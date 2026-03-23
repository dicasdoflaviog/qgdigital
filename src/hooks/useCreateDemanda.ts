import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DemandaInsert {
  eleitor_id?: string;
  bairro?: string;
  categoria?: string;
  descricao?: string;
  status?: string;
  prioridade?: string;
  gabinete_id?: string;
  assessor_id?: string;
}

export function useCreateDemanda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (demanda: DemandaInsert) => {
      const { data, error } = await supabase
        .from("demandas")
        .insert(demanda)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demandas"] });
    },
  });
}
