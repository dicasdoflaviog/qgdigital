/**
 * Edge Function: mp-webhook
 * Recebe notificações do Mercado Pago e atualiza o status da subscription.
 *
 * Variáveis de ambiente:
 *   MP_ACCESS_TOKEN   — Token de acesso do MP
 *   MP_WEBHOOK_SECRET — (opcional) Para validar a assinatura do webhook
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

// Mapeia status do MP para status interno
function mapMpStatus(mpStatus: string): string {
  switch (mpStatus) {
    case "approved":
      return "active";
    case "pending":
    case "in_process":
    case "authorized":
      return "trialing"; // aguardando confirmação
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "canceled";
    default:
      return "pending";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // O MP envia tanto GET (query params) quanto POST (JSON body)
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") || url.searchParams.get("type");
  const mpId = url.searchParams.get("id");

  const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!MP_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: "MP_ACCESS_TOKEN não configurado" }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    let paymentId: string | null = null;
    let eventType: string | null = topic;

    // Lê corpo JSON se disponível (notificações IPN modernas)
    if (req.method === "POST" && req.headers.get("content-type")?.includes("application/json")) {
      try {
        const body = await req.json();
        eventType = body.type || eventType;
        paymentId = body.data?.id?.toString() || mpId;
      } catch {
        paymentId = mpId;
      }
    } else {
      paymentId = mpId;
    }

    // Ignora eventos que não são de pagamento
    if (!eventType?.includes("payment") || !paymentId) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca o pagamento no MP para obter detalhes reais (nunca confiar cegamente no webhook)
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });

    if (!mpRes.ok) {
      console.error("Erro ao buscar pagamento no MP:", await mpRes.text());
      return new Response(JSON.stringify({ error: "Pagamento não encontrado no MP" }), { status: 404 });
    }

    const payment = await mpRes.json();
    const { status, external_reference, payment_method_id } = payment;

    // external_reference = "gabinete_id|plan_type"
    if (!external_reference) {
      return new Response(JSON.stringify({ error: "external_reference ausente" }), { status: 400 });
    }

    const [gabineteId, planType] = external_reference.split("|");
    if (!gabineteId || !planType) {
      return new Response(JSON.stringify({ error: "external_reference inválido" }), { status: 400 });
    }

    const internalStatus = mapMpStatus(status);
    const isApproved = internalStatus === "active";

    // Calcula próxima data de cobrança (30 dias a partir de agora se aprovado)
    const nextBillingDate = isApproved
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Atualiza subscription
    const { error: updateError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          gabinete_id: gabineteId,
          plan_type: planType,
          status: internalStatus,
          mp_payment_id: paymentId,
          mp_payment_method: payment_method_id || null,
          next_billing_date: nextBillingDate,
          activated_by: isApproved ? "mp_webhook" : null,
          activated_at: isApproved ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "gabinete_id" }
      );

    if (updateError) {
      console.error("Erro ao atualizar subscription:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
    }

    // Log de auditoria
    await supabase.from("audit_logs").insert({
      user_id: gabineteId,
      action: "mp_payment_webhook",
      details: {
        payment_id: paymentId,
        mp_status: status,
        internal_status: internalStatus,
        plan_type: planType,
        payment_method: payment_method_id,
      },
    });

    console.log(`Pagamento ${paymentId} → ${internalStatus} para gabinete ${gabineteId} (${planType})`);

    return new Response(JSON.stringify({ ok: true, status: internalStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro no webhook MP:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
