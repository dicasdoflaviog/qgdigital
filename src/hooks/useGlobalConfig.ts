import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GlobalConfigMap {
  logo_institucional_url: string | null;
  endereco_rodape_global: string | null;
  telefone_rodape_global: string | null;
  nome_instituicao: string | null;
}

const DEFAULT_CONFIG: GlobalConfigMap = {
  logo_institucional_url: null,
  endereco_rodape_global: null,
  telefone_rodape_global: null,
  nome_instituicao: null,
};

export function useGlobalConfig() {
  const queryClient = useQueryClient();

  const { data: config = DEFAULT_CONFIG, isLoading } = useQuery({
    queryKey: ["global-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_config" as any)
        .select("key, value");
      if (error) throw error;
      const map: any = { ...DEFAULT_CONFIG };
      (data ?? []).forEach((row: any) => {
        if (row.key in map) map[row.key] = row.value;
      });
      return map as GlobalConfigMap;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<GlobalConfigMap>) => {
      for (const [key, value] of Object.entries(updates)) {
        const { error } = await supabase
          .from("global_config" as any)
          .update({ value, updated_at: new Date().toISOString() } as any)
          .eq("key", key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-config"] });
    },
  });

  return { config, isLoading, updateConfig };
}
