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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { tipo, destinatario, orgao, demanda_descricao, bairro, vereador_nome } = await req.json();

    if (!demanda_descricao || !tipo) {
      return new Response(
        JSON.stringify({ error: "Campos 'tipo' e 'demanda_descricao' são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
- Responda APENAS com a chamada da função, sem texto adicional`;

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
          tools: [
            {
              type: "function",
              function: {
                name: "redigir_documento",
                description: "Redige documento legislativo formal",
                parameters: {
                  type: "object",
                  properties: {
                    assunto: {
                      type: "string",
                      description: "Assunto do documento — máximo 80 caracteres",
                    },
                    corpo: {
                      type: "string",
                      description: "Texto principal do documento, formal e legislativo",
                    },
                    justificativa: {
                      type: "string",
                      description: "Justificativa formal com embasamento legal e social",
                    },
                  },
                  required: ["assunto", "corpo", "justificativa"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "redigir_documento" } },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      const body = await response.text();
      console.error("AI Gateway error:", status, body);
      if (status === 429) return new Response(JSON.stringify({ error: "Limite excedido. Tente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro ao processar com IA." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "IA não retornou dados estruturados." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-oficio error:", e);
    return new Response(JSON.stringify({ error: "Erro interno do servidor." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
