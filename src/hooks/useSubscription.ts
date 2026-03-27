import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionPlan = "bronze" | "silver" | "gold";
export type PlanKey = SubscriptionPlan;
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

const PLAN_LABELS: Record<PlanKey, string> = {
  bronze: "Essencial",
  silver: "Profissional",
  gold: "Completo",
};

const PLAN_COLORS: Record<PlanKey, string> = {
  bronze: "text-qg-blue-600",
  silver: "text-emerald-600",
  gold: "text-amber-600",
};

const PLAN_BG: Record<PlanKey, string> = {
  bronze: "bg-qg-blue-500/10 border-qg-blue-500/20",
  silver: "bg-emerald-500/10 border-emerald-500/20",
  gold: "bg-amber-500/10 border-amber-500/20",
};

export const PLAN_PRICES: Record<PlanKey, number> = {
  bronze: 197,
  silver: 497,
  gold: 997,
};

export const PLAN_USER_LIMITS: Record<PlanKey, number | null> = {
  bronze: 3,
  silver: 10,
  gold: null,
};

export const PLAN_VOTER_LIMITS: Record<PlanKey, number | null> = {
  bronze: 500,
  silver: null,
  gold: null,
};

export const PLAN_FEATURES: Record<PlanKey, string[]> = {
  bronze: [
    "Dashboard com KPIs",
    "Cadastro de eleitores (até 500)",
    "Agenda de reuniões",
    "Guia de Soluções",
    "Entrada por voz (campo)",
    "App offline",
    "Até 3 usuários",
  ],
  silver: [
    "Tudo do Essencial",
    "Eleitores ilimitados",
    "Mapa de Calor (geolocalização)",
    "Perfil Eleitoral (sexo, idade, bairros)",
    "Equipe & Ranking de assessores",
    "Calendário político",
    "Ofícios (rascunho → resolução)",
    "Identidade do Gabinete",
    "IA de Demandas (triagem automática)",
    "IA de Ofícios (redação automática)",
    "Mensagens personalizadas",
    "Relatórios em PDF",
    "Até 10 usuários",
  ],
  gold: [
    "Tudo do Profissional",
    "Observatório BI (análises avançadas)",
    "Emendas parlamentares",
    "Banco de Instituições estratégicas",
    "Usuários ilimitados",
    "Suporte prioritário via WhatsApp",
    "Onboarding dedicado",
  ],
};

export const PLAN_LOCKED_FEATURES: Record<PlanKey, string[]> = {
  bronze: [
    "Mapa de Calor",
    "Perfil Eleitoral",
    "Ofícios e documentos",
    "IA de Demandas e Ofícios",
    "Relatórios PDF",
    "Observatório BI",
    "Emendas parlamentares",
  ],
  silver: [
    "Observatório BI",
    "Emendas parlamentares",
    "Banco de Instituições",
    "Usuários ilimitados",
    "Suporte prioritário",
  ],
  gold: [],
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
    mutationFn: async (plan: PlanKey) => {
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
