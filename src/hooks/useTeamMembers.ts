import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface TeamMember {
  id: string;
  full_name: string;
  whatsapp: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  role: AppRole;
  role_level: number;
  gabinete_id: string | null;
  // Performance fields (L3 view)
  total_eleitores?: number;
  demandas_atendidas?: number;
  // L4 view fields
  cidade?: string;
  tamanho_equipe?: number;
  alcance_eleitoral?: number;
}

interface TeamFilters {
  search?: string;
  role?: string;
  /** Filter members by gabinete_id (L3 view) */
  gabineteId?: string | null;
  /** Only show members with these role levels */
  roleLevels?: number[];
}

export function useTeamMembers(filters?: TeamFilters) {
  return useQuery({
    queryKey: ["team-members", filters],
    queryFn: async () => {
      // Fetch profiles
      let profileQuery = supabase
        .from("profiles")
        .select("id, full_name, whatsapp, avatar_url, is_active, created_at, gabinete_id")
        .order("created_at", { ascending: false });

      if (filters?.gabineteId) {
        profileQuery = profileQuery.eq("gabinete_id", filters.gabineteId);
      }

      const { data: profiles, error: pErr } = await profileQuery;
      if (pErr) throw pErr;

      // Fetch all roles
      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role, role_level");
      if (rErr) throw rErr;

      const roleMap = new Map<string, { role: AppRole; role_level: number }>();
      roles?.forEach((r) => roleMap.set(r.user_id, { role: r.role, role_level: r.role_level }));

      let members: TeamMember[] = (profiles ?? []).map((p) => {
        const r = roleMap.get(p.id);
        return {
          ...p,
          role: r?.role ?? "assessor",
          role_level: r?.role_level ?? 1,
        };
      });

      // Filter by role levels if specified
      if (filters?.roleLevels && filters.roleLevels.length > 0) {
        members = members.filter((m) => filters.roleLevels!.includes(m.role_level));
      }

      // Apply search filter
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        members = members.filter((m) => m.full_name.toLowerCase().includes(s));
      }
      if (filters?.role && filters.role !== "todos") {
        members = members.filter((m) => m.role === filters.role);
      }

      // Fetch performance data for L1/L2 members (eleitores + demandas counts)
      const memberIds = members.map((m) => m.id);
      if (memberIds.length > 0) {
        // Get assessor mapping for eleitores count
        const { data: assessores } = await supabase
          .from("assessores")
          .select("id, user_id")
          .in("user_id", memberIds);

        const assessorMap = new Map<string, string>();
        assessores?.forEach((a) => {
          if (a.user_id) assessorMap.set(a.user_id, a.id);
        });

        // For L3 vereadores, get their gabinete stats
        const vereadorIds = members.filter((m) => m.role_level === 3).map((m) => m.id);

        if (vereadorIds.length > 0) {
          // Use resumo_gabinetes_por_cidade view
          const { data: gabData } = await supabase
            .from("resumo_gabinetes_por_cidade" as any)
            .select("*");

          const gabMap = new Map<string, any>();
          (gabData ?? []).forEach((g: any) => {
            if (g.gabinete_id) gabMap.set(g.gabinete_id, g);
          });

          // Count team size per gabinete
          const { data: allProfiles } = await supabase
            .from("profiles")
            .select("gabinete_id")
            .not("gabinete_id", "is", null);

          const teamSizeMap = new Map<string, number>();
          allProfiles?.forEach((p) => {
            if (p.gabinete_id) {
              teamSizeMap.set(p.gabinete_id, (teamSizeMap.get(p.gabinete_id) || 0) + 1);
            }
          });

          members = members.map((m) => {
            if (m.role_level === 3 && m.id) {
              const gab = gabMap.get(m.id);
              return {
                ...m,
                cidade: gab?.cidade || "—",
                tamanho_equipe: teamSizeMap.get(m.id) || 0,
                alcance_eleitoral: gab?.total_eleitores || 0,
                total_eleitores: gab?.total_eleitores || 0,
                demandas_atendidas: gab?.demandas_resolvidas || 0,
              };
            }
            return m;
          });
        }

        // For L1/L2 members, get eleitores and demandas counts
        const assessorIds = Array.from(assessorMap.values());
        if (assessorIds.length > 0) {
          const { data: eleitorCounts } = await supabase
            .from("eleitores")
            .select("assessor_id")
            .in("assessor_id", assessorIds)
            .eq("excluido", false);

          const eleitorCountMap = new Map<string, number>();
          eleitorCounts?.forEach((e) => {
            if (e.assessor_id) {
              eleitorCountMap.set(e.assessor_id, (eleitorCountMap.get(e.assessor_id) || 0) + 1);
            }
          });

          const { data: demandaCounts } = await supabase
            .from("demandas")
            .select("assessor_id, status")
            .in("assessor_id", assessorIds)
            .eq("excluido", false);

          const demandaCountMap = new Map<string, number>();
          demandaCounts?.forEach((d) => {
            if (d.assessor_id && d.status === "Resolvida") {
              demandaCountMap.set(d.assessor_id, (demandaCountMap.get(d.assessor_id) || 0) + 1);
            }
          });

          members = members.map((m) => {
            const aId = assessorMap.get(m.id);
            if (aId) {
              return {
                ...m,
                total_eleitores: eleitorCountMap.get(aId) || 0,
                demandas_atendidas: demandaCountMap.get(aId) || 0,
              };
            }
            return m;
          });
        }
      }

      return members;
    },
  });
}

export function useToggleMemberActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}
