import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { tipo, destinatario, orgao, demanda_descricao, bairro, vereador_nome } = await req.json();

    if (!demanda_descricao || !tipo) {
      return new Response(
        JSON.stringify({ error: "Campos 'tipo' e 'demanda_descricao' são obrigatórios." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tipoLabel: Record<string, string> = {
      oficio: "Ofício",
      pedido_providencia: "Pedido de Providência",
      indicacao: "Indicação",
      requerimento: "Requerimento",
      mocao: "Moção",
    };

    const systemPrompt = `Você é redator legislativo especializado em documentos da Câmara Municipal de Teixeira de Freitas – BA.
Redija um ${tipoLabel[tipo] || "Ofício"} formal, respeitando a linguagem legislativa brasileira.

REGRAS:
- Linguagem formal, impessoal, em terceira pessoa
- Vereador se refere a si como "O Vereador que esta subscreve"
- Máximo 300 palavras no corpo
- Justificativa: embasamento legal e social objetivo, máximo 200 palavras
- Assunto: máximo 80 caracteres, direto ao ponto
- Não inventar dados — use apenas o que foi fornecido

RESPONDA APENAS com JSON válido, sem markdown, sem explicações, exatamente neste formato:
{"assunto":"...","corpo":"...","justificativa":"..."}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Tipo: ${tipoLabel[tipo] || tipo}
Destinatário: ${destinatario || "Exmº Sr. Prefeito Municipal"}
Órgão: ${orgao || "Prefeitura Municipal"}
Bairro: ${bairro || "não informado"}
Demanda: ${demanda_descricao}
Vereador: ${vereador_nome || "Vereador"}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      const body = await response.text();
      console.error("AI Gateway error:", status, body);
      let errMsg = `Gateway IA erro ${status}`;
      if (status === 429) errMsg = "Limite excedido. Tente em alguns segundos.";
      else if (status === 402) errMsg = "Créditos insuficientes na conta de IA.";
      else if (status === 401) errMsg = "Chave de IA inválida (401). Contate o suporte.";
      else errMsg = `Gateway IA erro ${status}: ${body.slice(0, 200)}`;
      return new Response(JSON.stringify({ error: errMsg }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "IA não retornou conteúdo." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Remove markdown code fences if present
    const clean = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    let extracted: { assunto: string; corpo: string; justificativa: string };
    try {
      extracted = JSON.parse(clean);
    } catch {
      console.error("JSON parse error. Raw content:", clean);
      return new Response(JSON.stringify({ error: "IA retornou formato inválido. Tente novamente." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-oficio error:", e);
    return new Response(JSON.stringify({ error: `Erro interno: ${(e as Error).message}` }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
