import {
  Crown, Check, AlertCircle, Calendar, Sparkles, Zap,
  RefreshCw, ExternalLink, Clock, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useSubscription, PLAN_LABELS, PLAN_BG, PLAN_PRICES, type SubscriptionPlan,
} from "@/hooks/useSubscription";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:   { label: "Ativo",               color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  trialing: { label: "Aguardando",           color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  pending:  { label: "Pagamento Pendente",   color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  past_due: { label: "Pagamento Pendente",   color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  canceled: { label: "Cancelado",            color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  bronze: [
    "Cadastro de eleitores ilimitado",
    "Demandas e acompanhamento",
    "Dashboard padrão",
  ],
  silver: [
    "Tudo do Bronze",
    "Geração de Ofícios PDF",
    "Mapa de Calor",
    "Relatórios avançados",
  ],
  gold: [
    "Tudo do Prata",
    "Chat IA — Assistente de Gabinete",
    "Análise de sentimento",
    "Observatório Legislativo",
    "Suporte prioritário",
  ],
};

const PLAN_ORDER: SubscriptionPlan[] = ["bronze", "silver", "gold"];

const PLAN_ICON_COLOR: Record<SubscriptionPlan, string> = {
  bronze: "text-amber-700",
  silver: "text-slate-400",
  gold:   "text-yellow-500",
};

export function PlanoFaturamentoTab() {
  const { subscription, isLoading, plan, isActive, isPending, refetch, createMpPreference } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">
        Carregando plano…
      </div>
    );
  }

  const status = subscription?.status || "active";
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.active;
  const periodEnd = subscription?.next_billing_date || subscription?.current_period_end;

  async function handleUpgrade(targetPlan: "silver" | "gold") {
    setLoadingPlan(targetPlan);
    try {
      await createMpPreference.mutateAsync(targetPlan);
      toast.info("Abrindo link de pagamento… Após pagar, clique em 'Atualizar Status'.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar link de pagamento.");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Status atualizado.");
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" /> Seu Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${PLAN_BG[plan]}`}>
                <Crown className={`h-7 w-7 ${PLAN_ICON_COLOR[plan]}`} />
              </div>
              <div>
                <h3 className="text-lg font-black">{PLAN_LABELS[plan]}</h3>
                <Badge variant="outline" className={`${statusInfo.color} text-[10px] font-bold`}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Atualizar
            </Button>
          </div>

          {periodEnd && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Próxima renovação: {format(new Date(periodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          )}

          {subscription?.mp_payment_method && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />
              Método: <span className="font-medium text-foreground capitalize">{subscription.mp_payment_method}</span>
            </div>
          )}

          {subscription?.is_manual_trial && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Período de avaliação manual ativo.
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-700">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Pagamento enviado. Aguardando confirmação do Mercado Pago. Clique em "Atualizar" após concluir.
            </div>
          )}

          {!isActive && !isPending && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Sua assinatura está inativa. Escolha um plano abaixo para ativar.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funcionalidades do plano atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Funcionalidades incluídas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {PLAN_FEATURES[plan].map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                {feat}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Cards de Planos disponíveis para upgrade */}
      {plan !== "gold" && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Fazer Upgrade
          </p>

          {(PLAN_ORDER.filter((p) => {
            if (plan === "bronze") return p === "silver" || p === "gold";
            if (plan === "silver") return p === "gold";
            return false;
          }) as ("silver" | "gold")[]).map((targetPlan) => (
            <Card
              key={targetPlan}
              className={`transition-all ${
                targetPlan === "gold"
                  ? "border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-transparent"
                  : "border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-transparent"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${PLAN_BG[targetPlan]}`}>
                      <Crown className={`h-5 w-5 ${PLAN_ICON_COLOR[targetPlan]}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black">Plano {PLAN_LABELS[targetPlan]}</h4>
                      {targetPlan === "gold" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                          Recomendado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-foreground">
                      R$ {PLAN_PRICES[targetPlan].toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">/mês</p>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {PLAN_FEATURES[targetPlan].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full min-h-[44px] font-bold uppercase tracking-wider text-xs gap-2"
                  variant={targetPlan === "gold" ? "default" : "outline"}
                  disabled={!!loadingPlan || createMpPreference.isPending}
                  onClick={() => handleUpgrade(targetPlan)}
                >
                  {loadingPlan === targetPlan ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Gerando link…</>
                  ) : (
                    <><ExternalLink className="h-4 w-4" /> Assinar via Pix ou Cartão</>
                  )}
                </Button>

                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  Pix (0,99% taxa MP) · Cartão (3,99% taxa MP) · Pagamento seguro
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
