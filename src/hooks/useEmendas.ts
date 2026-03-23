import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Emenda {
  id: string;
  gabinete_id: string;
  titulo: string;
  valor: number | null;
  ano_exercicio: number | null;
  status: string;
  destino_instituicao_id: string | null;
  descricao: string | null;
  localizacao_gps: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmendaInsert {
  titulo: string;
  valor?: number;
  ano_exercicio?: number;
  status?: string;
  destino_instituicao_id?: string;
  descricao?: string;
  localizacao_gps?: string;
  gabinete_id: string;
}

export function useEmendas(filters?: { status?: string; ano?: number }) {
  return useQuery({
    queryKey: ["emendas", filters],
    queryFn: async () => {
      let query = supabase
        .from("emendas")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "todos") {
        query = query.eq("status", filters.status);
      }
      if (filters?.ano) {
        query = query.eq("ano_exercicio", filters.ano);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Emenda[];
    },
  });
}

export function useEmendasStats() {
  return useQuery({
    queryKey: ["emendas-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emendas")
        .select("id, valor, status, ano_exercicio");
      if (error) throw error;

      const emendas = data ?? [];
      const totalValor = emendas.reduce((s, e) => s + (Number(e.valor) || 0), 0);
      const totalCount = emendas.length;

      const byStatus: Record<string, { count: number; valor: number }> = {};
      emendas.forEach((e) => {
        if (!byStatus[e.status]) byStatus[e.status] = { count: 0, valor: 0 };
        byStatus[e.status].count++;
        byStatus[e.status].valor += Number(e.valor) || 0;
      });

      return { totalValor, totalCount, byStatus };
    },
  });
}

export function useCreateEmenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emenda: EmendaInsert) => {
      const { data, error } = await supabase
        .from("emendas")
        .insert(emenda)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emendas"] });
      qc.invalidateQueries({ queryKey: ["emendas-stats"] });
    },
  });
}

export function useDeleteEmenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("emendas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emendas"] });
      qc.invalidateQueries({ queryKey: ["emendas-stats"] });
    },
  });
}
