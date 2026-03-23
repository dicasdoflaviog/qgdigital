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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch voters without coordinates (limit 50 per call to avoid timeout)
    const { data: voters, error } = await supabaseAdmin
      .from("eleitores")
      .select("id, bairro, cidade, estado")
      .is("latitude", null)
      .eq("excluido", false)
      .neq("bairro", "")
      .limit(50);

    if (error) throw error;
    if (!voters || voters.length === 0) {
      return new Response(
        JSON.stringify({ updated: 0, remaining: 0, message: "Nenhum eleitor pendente" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updated = 0;

    for (const voter of voters) {
      const query = [voter.bairro, voter.cidade || "", voter.estado || "Brasil"]
        .filter(Boolean)
        .join(", ");

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
          {
            headers: {
              "User-Agent": "QGDigital/1.0 (contact@qgdigital.app)",
              "Accept-Language": "pt-BR",
            },
          }
        );

        const data = await res.json();

        if (data && data.length > 0) {
          const { error: updateErr } = await supabaseAdmin
            .from("eleitores")
            .update({
              latitude: parseFloat(data[0].lat),
              longitude: parseFloat(data[0].lon),
            })
            .eq("id", voter.id);

          if (!updateErr) updated++;
        }

        // Respect Nominatim rate limit (1 req/sec)
        await new Promise((r) => setTimeout(r, 1100));
      } catch {
        // Skip failed geocodes, continue with next
      }
    }

    // Count remaining
    const { count } = await supabaseAdmin
      .from("eleitores")
      .select("id", { count: "exact", head: true })
      .is("latitude", null)
      .eq("excluido", false)
      .neq("bairro", "");

    return new Response(
      JSON.stringify({ updated, remaining: count || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
