import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Demanda {
  id: string;
  bairro: string;
  categoria: string | null;
  status: string | null;
  gabinete_id: string | null;
  assessor_id: string | null;
  eleitor_id: string | null;
  descricao: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  eleitor_nome?: string | null;
  eleitor_whatsapp?: string | null;
}

export const CATEGORIAS_DEMANDA = [
  "Saúde",
  "Infraestrutura",
  "Segurança",
  "Educação",
  "Iluminação",
  "Outros",
] as const;

export function useDemandas() {
  return useQuery({
    queryKey: ["demandas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demandas" as any)
        .select("id, bairro, categoria, status, gabinete_id, assessor_id, eleitor_id, descricao, created_at, latitude, longitude, eleitores!demandas_eleitor_id_fkey(nome, whatsapp)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return ((data ?? []) as any[]).map((d: any) => ({
        id: d.id,
        bairro: d.bairro,
        categoria: d.categoria,
        status: d.status,
        gabinete_id: d.gabinete_id,
        assessor_id: d.assessor_id,
        eleitor_id: d.eleitor_id,
        descricao: d.descricao,
        created_at: d.created_at,
        latitude: d.latitude,
        longitude: d.longitude,
        eleitor_nome: d.eleitores?.nome ?? null,
        eleitor_whatsapp: d.eleitores?.whatsapp ?? null,
      })) as Demanda[];
    },
  });
}
