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

export type SkillGroup = "inteligencia" | "operacional" | "estrategico" | "ia";

export interface SkillDef {
  key: string;
  label: string;
  group: SkillGroup;
  description?: string;
}

/** All manageable features with labels and groups */
export const ALL_SKILLS: SkillDef[] = [
  // ── Inteligência ──
  { key: "dashboard",           label: "Dashboard",            group: "inteligencia", description: "Painel principal com KPIs e resumo" },
  { key: "mapa_calor",          label: "Mapa de Calor",        group: "inteligencia", description: "Visualização geográfica de eleitores" },
  { key: "observatorio_bi",     label: "Observatório BI",      group: "inteligencia", description: "Análises e gráficos avançados" },
  { key: "perfil_eleitoral",    label: "Perfil Eleitoral",     group: "inteligencia", description: "Demografias: sexo, faixa etária, bairro" },
  // ── Operacional ──
  { key: "eleitores",           label: "Eleitores",            group: "operacional",  description: "Cadastro e gestão de eleitores" },
  { key: "equipe",              label: "Equipe",               group: "operacional",  description: "Gestão de assessores e ranking" },
  { key: "agenda",              label: "Agenda",               group: "operacional",  description: "Reuniões e compromissos" },
  { key: "calendario",          label: "Calendário",           group: "operacional",  description: "Eventos políticos do calendário" },
  { key: "oficios",             label: "Ofícios",              group: "operacional",  description: "Criação e gestão de ofícios" },
  { key: "guia",                label: "Guia de Soluções",     group: "operacional",  description: "Catálogo de soluções para demandas" },
  { key: "instituicoes",        label: "Instituições",         group: "operacional",  description: "Banco de dados de instituições" },
  { key: "emendas",             label: "Emendas",              group: "operacional",  description: "Gestão de emendas parlamentares" },
  { key: "configuracao_gabinete", label: "Identidade do Gabinete", group: "operacional", description: "Logo, cores e dados do gabinete" },
  { key: "plano",               label: "Plano",                group: "operacional",  description: "Informações de assinatura e plano" },
  // ── Estratégico ──
  { key: "observatorio",        label: "Observatório",         group: "estrategico",  description: "Painel legislativo estratégico" },
  { key: "gestao_base",         label: "Gestão de Base",       group: "estrategico",  description: "Estratégia de base eleitoral" },
  // ── IA ──
  { key: "ia_demandas",         label: "IA de Demandas",       group: "ia",           description: "Assistente IA para triagem de demandas" },
  { key: "ia_oficios",          label: "IA de Ofícios",        group: "ia",           description: "Redação automática de ofícios com IA" },
  { key: "relatorios_pdf",      label: "Relatórios PDF",       group: "ia",           description: "Geração e exportação de relatórios" },
];

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
  "/perfil-eleitoral": "perfil_eleitoral",
  "/observatorio-bi": "observatorio_bi",
  "/configuracao-gabinete": "configuracao_gabinete",
  "/plano": "plano",
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
