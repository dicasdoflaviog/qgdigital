import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionPlan = "bronze" | "silver" | "gold";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing" | "pending";

export interface Subscription {
  id: string;
  gabinete_id: string;
  plan_type: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end: string | null;
  next_billing_date: string | null;
  is_manual_trial: boolean;
  // Mercado Pago
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  mp_transaction_id: string | null;
  mp_payment_method: string | null;
  activated_by: string | null;
  activated_at: string | null;
  notes: string | null;
  // Legacy Stripe (mantido por compatibilidade)
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
};

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  bronze: "text-amber-700",
  silver: "text-slate-400",
  gold: "text-yellow-500",
};

const PLAN_BG: Record<SubscriptionPlan, string> = {
  bronze: "bg-amber-700/10 border-amber-700/20",
  silver: "bg-slate-400/10 border-slate-400/20",
  gold: "bg-yellow-500/10 border-yellow-500/20",
};

// Preços em BRL (já consideram margem sobre taxas MP)
// Pix: ~0,99% taxa | Cartão: ~3,99% taxa
export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  bronze: 0,     // sem cobrança via MP (plano gratuito/entrada)
  silver: 197,
  gold: 297,
};

export { PLAN_LABELS, PLAN_COLORS, PLAN_BG };

export function useSubscription(gabineteId?: string | null) {
  const { profile } = useAuth();
  const targetId = gabineteId || profile?.gabinete_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["subscription", targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions" as any)
        .select("*")
        .eq("gabinete_id", targetId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Subscription) || null;
    },
    enabled: !!targetId,
  });

  const upsert = useMutation({
    mutationFn: async (values: Partial<Subscription> & { gabinete_id: string }) => {
      const { data: existing } = await supabase
        .from("subscriptions" as any)
        .select("id")
        .eq("gabinete_id", values.gabinete_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("subscriptions" as any)
          .update(values as any)
          .eq("gabinete_id", values.gabinete_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("subscriptions" as any)
          .insert(values as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  /** Cria preferência MP e redireciona para checkout */
  const createMpPreference = useMutation({
    mutationFn: async (plan: "silver" | "gold") => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await supabase.functions.invoke("create-mp-preference", {
        body: { plan },
      });

      if (res.error) throw new Error(res.error.message);
      return res.data as {
        preference_id: string;
        init_point: string;
        sandbox_init_point: string;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      // Abre link de pagamento — usa sandbox se token começa com TEST-
      const isSandbox = true; // mude para false em produção
      const link = isSandbox ? data.sandbox_init_point : data.init_point;
      if (link) window.open(link, "_blank", "noopener,noreferrer");
    },
  });

  const plan = query.data?.plan_type || "bronze";
  const isActive = plan === "bronze" || query.data?.status === "active" || query.data?.status === "trialing";
  const isPending = query.data?.status === "pending";
  const isPremium = plan === "silver" || plan === "gold";

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    isActive,
    isPending,
    plan,
    isPremium,
    upsert,
    createMpPreference,
  };
}

/** Hook para L5 listar todas as subscriptions */
export function useAllSubscriptions() {
  return useQuery({
    queryKey: ["all-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions" as any)
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Subscription[]) || [];
    },
  });
}
