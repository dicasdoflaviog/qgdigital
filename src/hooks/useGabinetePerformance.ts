import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GabinetePerformance {
  cadastrosMesAtual: number;
  cadastrosMesPassado: number;
  growthPct: number;
  growthStatus: "aceleracao" | "estavel" | "queda";
  totalDemandas: number;
  demandasResolvidas: number;
  demandasPendentes: number;
  demandasResolvidasPerc: number;
  topCategorias: { categoria: string; count: number }[];
  topBairros: { bairro: string; count: number }[];
  bairrosAlcancados: number;
  totalBairrosCidade: number;
  penetracaoPct: number;
  categoriaTop: string | null;
  isActive: boolean; // had cadastros in last 7 days
  eleitoresPorBairro: Record<string, number>; // for mini-heatmap
}

export function useGabinetePerformance(gabineteId?: string | null, cidade?: string | null) {
  return useQuery({
    queryKey: ["gabinete_performance", gabineteId, cidade],
    queryFn: async (): Promise<GabinetePerformance> => {
      if (!gabineteId) throw new Error("No gabinete");

      // Use the DB function for core stats
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_gabinete_stats" as any,
        { v_gabinete_id: gabineteId }
      );
      if (rpcError) throw rpcError;

      const stats = rpcData as any;

      const cadastrosMesAtual = stats.cadastros_mes_atual ?? 0;
      const cadastrosMesPassado = stats.cadastros_mes_passado ?? 0;

      let growthStatus: GabinetePerformance["growthStatus"] = "estavel";
      let growthPct = 0;
      if (cadastrosMesPassado > 0) {
        growthPct = Math.round(((cadastrosMesAtual - cadastrosMesPassado) / cadastrosMesPassado) * 100);
        const ratio = cadastrosMesAtual / cadastrosMesPassado;
        if (ratio >= 1.15) growthStatus = "aceleracao";
        else if (ratio <= 0.85) growthStatus = "queda";
      } else if (cadastrosMesAtual > 0) {
        growthStatus = "aceleracao";
        growthPct = 100;
      }

      // Fetch detailed breakdowns + activity check
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [demandasRes, eleitoresRes, recentRes] = await Promise.all([
        supabase.from("demandas").select("categoria, bairro").eq("gabinete_id", gabineteId),
        supabase.from("eleitores").select("bairro").eq("gabinete_id", gabineteId),
        supabase.from("eleitores").select("id").eq("gabinete_id", gabineteId).gte("created_at", sevenDaysAgo).limit(1),
      ]);

      const demandas = demandasRes.data ?? [];
      const eleitores = eleitoresRes.data ?? [];
      const isActive = (recentRes.data ?? []).length > 0;

      // Top categories
      const catMap: Record<string, number> = {};
      demandas.forEach((d) => { if (d.categoria) catMap[d.categoria] = (catMap[d.categoria] || 0) + 1; });
      const topCategorias = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([categoria, count]) => ({ categoria, count }));

      // Bairro map (for both top list and mini-heatmap)
      const bairroMap: Record<string, number> = {};
      eleitores.forEach((e) => { if (e.bairro) bairroMap[e.bairro] = (bairroMap[e.bairro] || 0) + 1; });
      const topBairros = Object.entries(bairroMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([bairro, count]) => ({ bairro, count }));

      // Penetration
      const bairrosAlcancados = stats.bairros_alcancados ?? Object.keys(bairroMap).length;
      let totalBairrosCidade = bairrosAlcancados;
      if (cidade) {
        const { data: allEleitoresCidade } = await supabase
          .from("eleitores").select("bairro").eq("cidade", cidade);
        const allBairros = new Set((allEleitoresCidade ?? []).map((e) => e.bairro).filter(Boolean));
        totalBairrosCidade = Math.max(allBairros.size, bairrosAlcancados);
      }
      const penetracaoPct = totalBairrosCidade > 0 ? Math.round((bairrosAlcancados / totalBairrosCidade) * 100) : 0;

      return {
        cadastrosMesAtual,
        cadastrosMesPassado,
        growthPct,
        growthStatus,
        totalDemandas: stats.total_demandas ?? 0,
        demandasResolvidas: stats.demandas_resolvidas ?? 0,
        demandasPendentes: stats.demandas_pendentes ?? 0,
        demandasResolvidasPerc: stats.demandas_resolvidas_perc ?? 0,
        topCategorias,
        topBairros,
        bairrosAlcancados,
        totalBairrosCidade,
        penetracaoPct,
        categoriaTop: stats.categoria_top ?? null,
        isActive,
        eleitoresPorBairro: bairroMap,
      };
    },
    enabled: !!gabineteId,
  });
}
