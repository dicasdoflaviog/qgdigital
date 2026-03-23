import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AssessorRow {
  id: string;
  nome: string;
  cadastros: number;
  avatar: string | null;
  user_id: string | null;
}

export function useAssessores() {
  return useQuery({
    queryKey: ["assessores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessores")
        .select("*")
        .order("cadastros", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AssessorRow[];
    },
  });
}

export function useMyEleitores() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-eleitores", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // First get the assessor record linked to this user
      const { data: assessor } = await supabase
        .from("assessores")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!assessor) return [];

      const { data, error } = await supabase
        .from("eleitores")
        .select("*")
        .eq("assessor_id", assessor.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyWeeklyCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-weekly-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: assessor } = await supabase
        .from("assessores")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!assessor) return 0;

      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      startOfWeek.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("eleitores")
        .select("id", { count: "exact" })
        .eq("assessor_id", assessor.id)
        .gte("created_at", startOfWeek.toISOString());

      if (error) throw error;
      return data?.length ?? 0;
    },
  });
}

export function useMyMonthlyCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-monthly-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: assessor } = await supabase
        .from("assessores")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!assessor) return 0;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data, error } = await supabase
        .from("eleitores")
        .select("id", { count: "exact" })
        .eq("assessor_id", assessor.id)
        .gte("created_at", startOfMonth.toISOString());

      if (error) throw error;
      return data?.length ?? 0;
    },
  });
}

export function useMyTopBairro() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-top-bairro", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: assessor } = await supabase
        .from("assessores")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!assessor) return null;

      const { data, error } = await supabase
        .from("eleitores")
        .select("bairro")
        .eq("assessor_id", assessor.id);

      if (error || !data || data.length === 0) return null;

      const counts: Record<string, number> = {};
      data.forEach((e) => { counts[e.bairro] = (counts[e.bairro] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return top ? top[0] : null;
    },
  });
}
