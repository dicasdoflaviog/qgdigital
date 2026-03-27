import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { QueryClient } from "@tanstack/react-query";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Profile {
  id: string;
  full_name: string;
  whatsapp: string | null;
  avatar_url: string | null;
  is_active: boolean;
  first_login: boolean;
  birth_date: string | null;
  gabinete_id: string | null;
  // Campos de IA — migration 20260321000002
  assistant_name: string | null;
  assistant_personality: Record<string, unknown> | null;
  onboarding_ia_completed: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  realRole: AppRole | null;
  isImpersonating: boolean;
  simulatedLevel: number | null;
  roleLevel: number;
  loading: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  impersonateRole: (role: AppRole | null, level?: number | null) => void;
  updateProfile: (partial: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

/** Map role to default level */
function defaultLevelForRole(role: AppRole | null): number {
  switch (role) {
    case "assessor": return 1;
    case "secretaria": return 2;
    case "admin": return 3;
    case "lider_politico": return 4;
    case "super_admin": return 5;
    default: return 1;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [realRole, setRealRole] = useState<AppRole | null>(null);
  const [persistedLevel, setPersistedLevel] = useState<number>(1);
  const [impersonatedRole, setImpersonatedRole] = useState<AppRole | null>(null);
  const [simulatedLevel, setSimulatedLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const role = impersonatedRole ?? realRole;
  const isImpersonating = impersonatedRole !== null || simulatedLevel !== null;
  const roleLevel = simulatedLevel ?? persistedLevel;

  const updateProfile = useCallback((partial: Partial<Profile>) => {
    setProfile(prev => prev ? { ...prev, ...partial } : prev);
  }, []);

  const impersonateRole = useCallback((r: AppRole | null, level: number | null = null) => {
    if (realRole !== "super_admin") return;
    setImpersonatedRole(r);
    setSimulatedLevel(level);

    // Cache clearing is handled by useRoleSimulator.ts before calling this function
  }, [realRole]);

  const fetchProfileAndRole = async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_roles").select("role, role_level").eq("user_id", userId).limit(1).single(),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data as unknown as Profile);
    }
    if (roleRes.data) {
      setRealRole(roleRes.data.role);
      // Persist level from DB; fallback to role-based default if null/0
      const dbLevel = roleRes.data.role_level;
      const level = dbLevel && dbLevel >= 1 && dbLevel <= 5
        ? dbLevel
        : defaultLevelForRole(roleRes.data.role);
      setPersistedLevel(level);
    } else {
      // No role found — fallback to assessor level 1
      setRealRole(null);
      setPersistedLevel(1);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => fetchProfileAndRole(session.user.id), 0);
        } else {
          setProfile(null);
          setRealRole(null);
          setPersistedLevel(1);
          setImpersonatedRole(null);
          setSimulatedLevel(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    // Log login to audit_logs (fire and forget)
    if (!error && data?.user) {
      supabase.from("audit_logs").insert({
        user_id: data.user.id,
        action: "LOGIN",
        details: { email: data.user.email },
      } as any).then(() => {});
    }
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRealRole(null);
    setPersistedLevel(1);
    setImpersonatedRole(null);
    setSimulatedLevel(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{
        session, user, profile, role, realRole, isImpersonating, simulatedLevel,
        roleLevel, loading, signIn, signUp, signOut, resetPassword, impersonateRole, updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
