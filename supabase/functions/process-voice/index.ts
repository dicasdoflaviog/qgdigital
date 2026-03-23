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
    // Authenticate the request
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
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { transcription } = await req.json();

    if (!transcription || typeof transcription !== "string") {
      return new Response(
        JSON.stringify({ error: "Campo 'transcription' é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é a Sol, Estrategista do Mandato. Receba esta transcrição bruta de um assessor de rua e extraia as informações estruturadas.

REGRAS:
- Extraia o nome do eleitor mencionado. Se não houver nome, retorne string vazia.
- Extraia o bairro mencionado. Se não houver, retorne string vazia.
- Extraia a demanda/situação principal de forma clara e objetiva (máx 200 caracteres).
- Avalie a prioridade de 1 (baixa) a 5 (urgente) com base na gravidade.
- Se o áudio tiver ruído ou informação confusa, faça o melhor possível para interpretar o contexto.
- Responda APENAS com a chamada da função, sem texto adicional.`;

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
            { role: "user", content: `Transcrição: "${transcription}"` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extrair_dados_eleitor",
                description:
                  "Extrai dados estruturados da transcrição de voz de um assessor de rua.",
                parameters: {
                  type: "object",
                  properties: {
                    nome: {
                      type: "string",
                      description: "Nome do eleitor mencionado",
                    },
                    bairro: {
                      type: "string",
                      description: "Bairro mencionado na transcrição",
                    },
                    demanda: {
                      type: "string",
                      description:
                        "Descrição objetiva da demanda ou situação reportada",
                    },
                    prioridade: {
                      type: "number",
                      description:
                        "Prioridade de 1 (baixa) a 5 (urgente/crítica)",
                    },
                  },
                  required: ["nome", "bairro", "demanda", "prioridade"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extrair_dados_eleitor" },
          },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      const body = await response.text();
      console.error("AI Gateway error:", status, body);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao processar com IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "IA não retornou dados estruturados." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-voice error:", e);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
