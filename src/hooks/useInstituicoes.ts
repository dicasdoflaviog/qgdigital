import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Instituicao {
  id: string;
  gabinete_id: string;
  nome: string;
  tipo: string | null;
  cnpj: string | null;
  responsavel_nome: string | null;
  responsavel_contato: string | null;
  endereco: string | null;
  bairro: string | null;
  historico_apoio: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstituicaoInsert {
  nome: string;
  tipo?: string;
  cnpj?: string;
  responsavel_nome?: string;
  responsavel_contato?: string;
  endereco?: string;
  bairro?: string;
  historico_apoio?: string;
  gabinete_id: string;
}

export function useInstituicoes(filters?: { search?: string; tipo?: string }) {
  return useQuery({
    queryKey: ["instituicoes", filters],
    queryFn: async () => {
      let query = supabase
        .from("instituicoes")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.tipo && filters.tipo !== "todos") {
        query = query.eq("tipo", filters.tipo);
      }
      if (filters?.search) {
        query = query.ilike("nome", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Instituicao[];
    },
  });
}

export function useCreateInstituicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inst: InstituicaoInsert) => {
      const { data, error } = await supabase
        .from("instituicoes")
        .insert(inst)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instituicoes"] });
    },
  });
}

export function useDeleteInstituicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instituicoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instituicoes"] });
    },
  });
}
