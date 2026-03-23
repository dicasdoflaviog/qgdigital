const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { address, city, state } = await req.json();

    if (!address) {
      return new Response(JSON.stringify({ error: "address is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const query = [address, city || "", state || "Brasil"]
      .filter(Boolean)
      .join(", ");

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "QGDigital/1.0 (contact@qgdigital.app)",
        "Accept-Language": "pt-BR",
        "Accept": "application/json",
      },
    });

    const text = await res.text();

    if (!res.ok || !text.startsWith("[") && !text.startsWith("{")) {
      console.error("Nominatim returned non-JSON:", res.status, text.substring(0, 200));
      return new Response(JSON.stringify({ lat: null, lng: null, found: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = JSON.parse(text);

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ lat: null, lng: null, found: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name,
        found: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
