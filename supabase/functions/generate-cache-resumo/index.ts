import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get all active gabinetes (L3 admins with gabinete_id)
    const { data: gabinetes } = await admin
      .from("profiles")
      .select("gabinete_id")
      .not("gabinete_id", "is", null)
      .eq("is_active", true);

    const uniqueGabinetes = [
      ...new Set((gabinetes ?? []).map((g: any) => g.gabinete_id).filter(Boolean)),
    ];

    let generated = 0;

    for (const gabineteId of uniqueGabinetes) {
      // Check if there's a valid (non-expired) cache already
      const { data: existing } = await admin
        .from("gabinete_cache_resumo")
        .select("id")
        .eq("gabinete_id", gabineteId)
        .gt("expires_at", new Date().toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue; // still valid

      // Generate summary using DB function
      const { data: stats } = await admin.rpc("get_gabinete_stats", {
        v_gabinete_id: gabineteId,
      });

      // Get recent demands breakdown
      const { data: demandas } = await admin
        .from("demandas")
        .select("categoria, status, bairro, prioridade, created_at")
        .eq("gabinete_id", gabineteId)
        .eq("excluido", false)
        .order("created_at", { ascending: false })
        .limit(50);

      // Get eleitores distribution
      const { data: eleitores } = await admin
        .from("eleitores")
        .select("bairro, situacao, is_leader, created_at")
        .eq("gabinete_id", gabineteId)
        .eq("excluido", false)
        .order("created_at", { ascending: false })
        .limit(100);

      // Build bairro map
      const bairroMap: Record<string, number> = {};
      (eleitores ?? []).forEach((e: any) => {
        if (e.bairro) bairroMap[e.bairro] = (bairroMap[e.bairro] || 0) + 1;
      });

      // Build category map
      const catMap: Record<string, number> = {};
      (demandas ?? []).forEach((d: any) => {
        if (d.categoria) catMap[d.categoria] = (catMap[d.categoria] || 0) + 1;
      });

      // Status breakdown
      const statusMap: Record<string, number> = {};
      (demandas ?? []).forEach((d: any) => {
        const s = d.status || "Sem status";
        statusMap[s] = (statusMap[s] || 0) + 1;
      });

      // Pending critical
      const pendentes = (demandas ?? []).filter(
        (d: any) => d.status === "Pendente"
      );

      // Recent activity (7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const recentEleitores = (eleitores ?? []).filter(
        (e: any) => e.created_at >= sevenDaysAgo
      ).length;
      const recentDemandas = (demandas ?? []).filter(
        (d: any) => d.created_at >= sevenDaysAgo
      ).length;

      // Top 5 bairros
      const topBairros = Object.entries(bairroMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([bairro, count]) => ({ bairro, count }));

      // Top 5 categorias
      const topCategorias = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([categoria, count]) => ({ categoria, count }));

      // Bairros sem atividade recente (30 dias)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const bairrosRecentes = new Set(
        (eleitores ?? [])
          .filter((e: any) => e.created_at >= thirtyDaysAgo)
          .map((e: any) => e.bairro)
          .filter(Boolean)
      );
      const bairrosInativos = Object.keys(bairroMap).filter(
        (b) => !bairrosRecentes.has(b)
      );

      const resumo = {
        stats,
        topBairros,
        topCategorias,
        statusBreakdown: statusMap,
        demandasPendentes: pendentes.length,
        eleitoresPorBairro: bairroMap,
        atividadeRecente: {
          eleitores7d: recentEleitores,
          demandas7d: recentDemandas,
        },
        bairrosInativos30d: bairrosInativos.slice(0, 10),
        totalLideres: (eleitores ?? []).filter((e: any) => e.is_leader).length,
        geradoEm: new Date().toISOString(),
      };

      // Delete old caches for this gabinete
      await admin
        .from("gabinete_cache_resumo")
        .delete()
        .eq("gabinete_id", gabineteId)
        .lt("expires_at", new Date().toISOString());

      // Insert new cache (8h TTL)
      await admin.from("gabinete_cache_resumo").insert({
        gabinete_id: gabineteId,
        resumo_json: resumo,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 8 * 3600000).toISOString(),
      });

      generated++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        gabinetes_processed: uniqueGabinetes.length,
        caches_generated: generated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("generate-cache-resumo error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
