import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContratoNacional {
  id: string;
  user_id: string;
  escopo_geografico: string;
  estados_autorizados: string[] | null;
  limite_gabinetes: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useContratos() {
  return useQuery({
    queryKey: ["contratos_nacional"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos_nacional" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ContratoNacional[];
    },
  });
}

export function useContratoByUser(userId: string | undefined) {
  return useQuery({
    queryKey: ["contratos_nacional", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos_nacional" as any)
        .select("*")
        .eq("user_id", userId!)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ContratoNacional | null;
    },
  });
}

export function useUpsertContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contrato: Partial<ContratoNacional> & { user_id: string }) => {
      const { data, error } = await supabase
        .from("contratos_nacional" as any)
        .upsert(contrato as any, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos_nacional"] });
    },
  });
}
