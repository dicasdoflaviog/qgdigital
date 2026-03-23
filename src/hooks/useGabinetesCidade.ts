import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GabineteCidade {
  gabinete_id: string;
  nome_vereador: string;
  cidade: string;
  total_eleitores: number;
  demandas_pendentes: number;
  demandas_resolvidas: number;
  total_demandas: number;
  avatar_url?: string | null;
  whatsapp?: string | null;
}

/**
 * Fetch gabinetes for a specific city, or ALL gabinetes if cidade is "__all__".
 * Returns empty if cidade is null/undefined.
 */
export function useGabinetesCidade(cidade?: string | null) {
  return useQuery({
    queryKey: ["gabinetes_cidade", cidade],
    queryFn: async () => {
      if (!cidade) return [];

      let query = supabase.from("resumo_gabinetes_por_cidade" as any).select("*");

      if (cidade !== "__all__") {
        query = query.eq("cidade", cidade);
      }

      const { data, error } = await query;
      if (error) throw error;
      const gabinetes = (data ?? []) as unknown as GabineteCidade[];

      // Enrich with avatar_url from profiles
      const ids = gabinetes.map((g) => g.gabinete_id).filter(Boolean);
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, avatar_url, whatsapp")
          .in("id", ids);
        const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
        gabinetes.forEach((g) => {
          const prof = profileMap.get(g.gabinete_id);
          g.avatar_url = prof?.avatar_url ?? null;
          g.whatsapp = prof?.whatsapp ?? null;
        });
      }

      return gabinetes;
    },
    enabled: !!cidade,
  });
}
