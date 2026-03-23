import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PeriodFilter = "today" | "week" | "month";

function getStartDate(period: PeriodFilter): string {
  const now = new Date();
  if (period === "today") {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (period === "week") {
    const day = now.getDay();
    now.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  // month
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export interface AssessorPerformance {
  id: string;
  nome: string;
  avatar: string | null;
  cadastros_periodo: number;
  demandas_abertas: number;
  demandas_oficio: number;
  taxa_sucesso: number; // percentage
}

export function useAssessorPerformance(period: PeriodFilter) {
  const { user } = useAuth();
  const gabineteId = user?.id;

  return useQuery({
    queryKey: ["assessor-performance", period, gabineteId],
    enabled: !!gabineteId,
    queryFn: async () => {
      const startDate = getStartDate(period);

      // Get assessores
      const { data: assessores, error: aErr } = await supabase
        .from("assessores")
        .select("id, nome, avatar, user_id");
      if (aErr) throw aErr;
      if (!assessores || assessores.length === 0) return [];

      // Get eleitores created in period per assessor
      const { data: eleitores } = await supabase
        .from("eleitores")
        .select("assessor_id")
        .gte("created_at", startDate)
        .eq("excluido", false);

      // Get demandas per assessor in period
      const { data: demandas } = await supabase
        .from("demandas")
        .select("assessor_id, status")
        .gte("created_at", startDate)
        .eq("excluido", false);

      const results: AssessorPerformance[] = assessores.map((a) => {
        const cadastros = (eleitores ?? []).filter((e) => e.assessor_id === a.id).length;
        const aDemandas = (demandas ?? []).filter((d) => d.assessor_id === a.id);
        const abertas = aDemandas.length;
        const oficio = aDemandas.filter((d) => d.status === "Ofício Gerado" || d.status === "Resolvida").length;
        const taxa = abertas > 0 ? Math.round((oficio / abertas) * 100) : 0;

        return {
          id: a.id,
          nome: a.nome,
          avatar: a.avatar,
          cadastros_periodo: cadastros,
          demandas_abertas: abertas,
          demandas_oficio: oficio,
          taxa_sucesso: taxa,
        };
      });

      return results.sort((a, b) => b.cadastros_periodo - a.cadastros_periodo);
    },
  });
}
