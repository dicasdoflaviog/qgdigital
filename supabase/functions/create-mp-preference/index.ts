/**
 * Edge Function: create-mp-preference
 * Cria uma preferência de pagamento no Mercado Pago.
 *
 * Variáveis de ambiente necessárias (Supabase Dashboard → Edge Functions → Secrets):
 *   MP_ACCESS_TOKEN   — Token de acesso do MP (use TEST-... para sandbox)
 *   APP_URL           — URL pública do app (ex: https://qgdigital.app)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANS: Record<string, { title: string; price: number; description: string }> = {
  silver: {
    title: "QG Digital — Plano Prata",
    description: "Ofícios PDF, Mapa de Calor e Relatórios Avançados",
    price: 197.00,
  },
  gold: {
    title: "QG Digital — Plano Ouro",
    description: "Chat IA, Análise de Sentimento, Observatório Legislativo e Suporte Prioritário",
    price: 297.00,
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const APP_URL = Deno.env.get("APP_URL") || "https://qgdigital.app";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!MP_ACCESS_TOKEN) {
      throw new Error("MP_ACCESS_TOKEN não configurado nos secrets da Edge Function.");
    }

    // Verifica autenticação do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    // Busca o perfil para pegar gabinete_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("gabinete_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.gabinete_id) throw new Error("Gabinete não encontrado.");

    const { plan } = await req.json();
    if (!plan || !PLANS[plan]) {
      throw new Error(`Plano inválido: ${plan}. Use 'silver' ou 'gold'.`);
    }

    const planInfo = PLANS[plan];

    // Cria preferência no Mercado Pago
    const preferenceBody = {
      items: [
        {
          id: `qgdigital-${plan}`,
          title: planInfo.title,
          description: planInfo.description,
          quantity: 1,
          currency_id: "BRL",
          unit_price: planInfo.price,
        },
      ],
      payer: {
        name: profile.full_name || "Usuário QG Digital",
        email: user.email,
      },
      back_urls: {
        success: `${APP_URL}/configuracoes?tab=plano&payment=success`,
        failure: `${APP_URL}/configuracoes?tab=plano&payment=failure`,
        pending: `${APP_URL}/configuracoes?tab=plano&payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      external_reference: `${profile.gabinete_id}|${plan}`,
      statement_descriptor: "QG DIGITAL",
      // Expiração em 24h
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpResponse.ok) {
      const err = await mpResponse.text();
      throw new Error(`Erro Mercado Pago: ${err}`);
    }

    const preference = await mpResponse.json();

    // Salva o mp_preference_id na subscription (cria ou atualiza)
    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          gabinete_id: profile.gabinete_id,
          plan_type: plan,
          status: "pending",
          mp_preference_id: preference.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "gabinete_id" }
      );

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({
        preference_id: preference.id,
        init_point: preference.init_point,         // Link de pagamento (produção)
        sandbox_init_point: preference.sandbox_init_point, // Link de pagamento (sandbox)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
