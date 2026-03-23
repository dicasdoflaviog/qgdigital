import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get user's gabinete_id
    const { data: profile } = await admin
      .from("profiles")
      .select("gabinete_id")
      .eq("id", user.id)
      .single();
    
    const gabineteId = profile?.gabinete_id ?? user.id;

    // Get last memory timestamp to only summarize new messages
    const { data: lastMemory } = await admin
      .from("ai_memories")
      .select("created_at")
      .eq("gabinete_id", gabineteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const since = lastMemory?.created_at || "2000-01-01T00:00:00Z";

    // Fetch recent messages since last summary
    const { data: messages } = await admin
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("user_id", user.id)
      .gt("created_at", since)
      .order("created_at", { ascending: true })
      .limit(50);

    if (!messages || messages.length < 10) {
      return new Response(JSON.stringify({ skipped: true, reason: "Less than 10 new messages" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build conversation text for summarization
    const conversationText = messages
      .map((m: any) => `${m.role === "user" ? "Usuário" : "IA"}: ${m.content}`)
      .join("\n\n");

    // Call AI to summarize
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um sistema interno de memória estratégica. Resuma a conversa abaixo extraindo APENAS:
1. **Bairros citados** e contexto
2. **Nomes de lideranças ou eleitores** mencionados
3. **Demandas ou problemas** discutidos
4. **Decisões estratégicas** tomadas
5. **Humor/tom** do vereador (preocupado, otimista, urgente, etc.)
6. **Prioridades atuais** identificadas

Formato: JSON com campos: summary (texto resumido em 2-3 parágrafos), topics (array de palavras-chave).
NUNCA inclua dados sensíveis como CPF ou RG. Responda APENAS o JSON, sem markdown.`,
          },
          {
            role: "user",
            content: conversationText,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI summarization error:", response.status, errText);
      throw new Error("Erro ao gerar resumo");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "{}";
    
    let parsed: { summary?: string; topics?: string[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: content, topics: [] };
    }

    // Save memory
    const { error: insertError } = await admin
      .from("ai_memories")
      .insert({
        gabinete_id: gabineteId,
        user_id: user.id,
        summary: parsed.summary || "Resumo não disponível",
        topics: parsed.topics || [],
        message_count: messages.length,
        period_start: messages[0].created_at,
        period_end: messages[messages.length - 1].created_at,
      });

    if (insertError) {
      console.error("Error saving memory:", insertError);
      throw new Error("Erro ao salvar memória");
    }

    return new Response(JSON.stringify({ success: true, message_count: messages.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("summarize-memories error:", e);
    return new Response(JSON.stringify({ error: e.message || "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
