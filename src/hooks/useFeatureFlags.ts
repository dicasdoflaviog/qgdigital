import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AVAILABLE_FEATURES = [
  { key: "mapa_calor", label: "Mapa de Calor", description: "Visualização geográfica de eleitores" },
  { key: "observatorio", label: "Observatório Legislativo", description: "Painel de indicadores estratégicos" },
  { key: "relatorios_pdf", label: "Relatórios PDF", description: "Geração de relatórios em PDF" },
  { key: "ia_demandas", label: "IA de Demandas", description: "Categorização automática por IA" },
  { key: "ia_oficios", label: "IA de Ofícios", description: "Extração inteligente de ofícios" },
  { key: "gestao_base", label: "Gestão de Base", description: "Painel estratégico de base eleitoral" },
] as const;

export type FeatureKey = typeof AVAILABLE_FEATURES[number]["key"];

interface FeatureFlag {
  id: string;
  cliente_id: string;
  feature_key: string;
  enabled: boolean;
}

export function useFeatureFlags(clienteId?: string) {
  const qc = useQueryClient();

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ["feature-flags", clienteId],
    queryFn: async () => {
      let query = supabase.from("feature_flags" as any).select("*");
      if (clienteId) query = query.eq("cliente_id", clienteId);
      const { data } = await query;
      return (data ?? []) as unknown as FeatureFlag[];
    },
    enabled: !!clienteId || clienteId === undefined, // load all if no clienteId
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ clienteId, featureKey, enabled }: { clienteId: string; featureKey: string; enabled: boolean }) => {
      // Upsert
      const existing = flags.find((f) => f.cliente_id === clienteId && f.feature_key === featureKey);
      if (existing) {
        const { error } = await supabase
          .from("feature_flags" as any)
          .update({ enabled, updated_at: new Date().toISOString() } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("feature_flags" as any)
          .insert({ cliente_id: clienteId, feature_key: featureKey, enabled } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
    },
  });

  const isFeatureEnabled = (featureKey: string, cId?: string): boolean => {
    const target = cId || clienteId;
    if (!target) return true; // no restriction
    const flag = flags.find((f) => f.cliente_id === target && f.feature_key === featureKey);
    return flag ? flag.enabled : true; // default enabled if no flag exists
  };

  return { flags, isLoading, toggleFlag, isFeatureEnabled };
}
