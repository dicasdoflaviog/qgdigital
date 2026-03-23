import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SkillEntry {
  id: string;
  feature_key: string;
  role_level: number;
  enabled: boolean;
}

/** Features that are ALWAYS L5-only and can never be enabled for lower levels */
export const L5_EXCLUSIVE_FEATURES = [
  "system_master", "sistema", "sugestoes", "central_recuperacao",
] as const;

/** All manageable features with labels */
export const ALL_SKILLS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "eleitores", label: "Eleitores" },
  { key: "mapa_calor", label: "Mapa de Calor" },
  { key: "equipe", label: "Equipe" },
  { key: "agenda", label: "Agenda" },
  { key: "calendario", label: "Calendário" },
  { key: "oficios", label: "Ofícios" },
  { key: "guia", label: "Guia de Soluções" },
  { key: "configuracoes", label: "Configurações" },
  { key: "instituicoes", label: "Instituições" },
  { key: "emendas", label: "Emendas" },
  { key: "observatorio", label: "Observatório" },
  { key: "gestao_base", label: "Gestão de Base" },
  { key: "relatorios_pdf", label: "Relatórios PDF" },
  { key: "ia_demandas", label: "IA de Demandas" },
  { key: "ia_oficios", label: "IA de Ofícios" },
] as const;

/** Map sidebar route URLs to feature keys */
export const ROUTE_TO_SKILL: Record<string, string> = {
  "/": "dashboard",
  "/eleitores": "eleitores",
  "/mapa": "mapa_calor",
  "/equipe": "equipe",
  "/agenda": "agenda",
  "/calendario": "calendario",
  "/oficios": "oficios",
  "/guia": "guia",
  "/configuracoes": "configuracoes",
  "/instituicoes": "instituicoes",
  "/emendas": "emendas",
  "/observatorio": "observatorio",
  "/gestao-base": "gestao_base",
};

export function useSkillsMatrix() {
  const qc = useQueryClient();

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["skills-matrix"],
    queryFn: async () => {
      const { data } = await supabase
        .from("skills_matrix" as any)
        .select("*");
      return (data ?? []) as unknown as SkillEntry[];
    },
    staleTime: 60000,
  });

  const toggleSkill = useMutation({
    mutationFn: async ({ featureKey, roleLevel, enabled }: { featureKey: string; roleLevel: number; enabled: boolean }) => {
      // Protect L5-exclusive features
      if (L5_EXCLUSIVE_FEATURES.includes(featureKey as any) && roleLevel < 5) {
        throw new Error("Este recurso é exclusivo do Nível 5");
      }

      const existing = skills.find((s) => s.feature_key === featureKey && s.role_level === roleLevel);
      if (existing) {
        const { error } = await supabase
          .from("skills_matrix" as any)
          .update({ enabled, updated_at: new Date().toISOString() } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("skills_matrix" as any)
          .insert({ feature_key: featureKey, role_level: roleLevel, enabled } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills-matrix"] }),
  });

  /** Check if a feature is enabled for a given role level */
  const isSkillEnabled = (featureKey: string, roleLevel: number): boolean => {
    // L5 always has everything
    if (roleLevel >= 5) return true;
    // L5-exclusive features are never available below 5
    if (L5_EXCLUSIVE_FEATURES.includes(featureKey as any)) return false;

    const entry = skills.find((s) => s.feature_key === featureKey && s.role_level === roleLevel);
    // Default: enabled if no entry exists (backward compat)
    return entry ? entry.enabled : true;
  };

  return { skills, isLoading, toggleSkill, isSkillEnabled };
}
