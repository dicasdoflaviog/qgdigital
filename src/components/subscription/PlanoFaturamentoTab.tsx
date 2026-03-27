import {
  Crown, Check, AlertCircle, Calendar, Sparkles, Zap, Star,
  RefreshCw, Clock, Loader2, Lock, Users, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useSubscription, PLAN_LABELS, PLAN_BG, PLAN_COLORS, PLAN_PRICES,
  PLAN_FEATURES, PLAN_LOCKED_FEATURES, PLAN_USER_LIMITS, PLAN_VOTER_LIMITS,
  type PlanKey,
} from "@/hooks/useSubscription";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:   { label: "Ativo",             color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  trialing: { label: "Avaliação",         color: "bg-qg-blue-500/10 text-qg-blue-600 border-qg-blue-500/20" },
  pending:  { label: "Pagamento pendente",color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  past_due: { label: "Pagamento pendente",color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  canceled: { label: "Cancelado",         color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const PLAN_ICON: Record<PlanKey, React.ElementType> = {
  bronze: Star,
  silver: Zap,
  gold: Crown,
};

const PLAN_ORDER: PlanKey[] = ["bronze", "silver", "gold"];

export function PlanoFaturamentoTab() {
  const { subscription, isLoading, plan, isActive, isPending, refetch, createMpPreference } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
        Carregando plano…
      </div>
    );
  }

  const currentPlan = (plan ?? "bronze") as PlanKey;
  const status = subscription?.status || "active";
  const statusInfo = STATUS_MAP[status] ?? STATUS_MAP.active;
  const periodEnd = subscription?.next_billing_date || subscription?.current_period_end;
  const userLimit = PLAN_USER_LIMITS[currentPlan];
  const voterLimit = PLAN_VOTER_LIMITS[currentPlan];
  const PlanIcon = PLAN_ICON[currentPlan];

  async function handleUpgrade(targetPlan: PlanKey) {
    setLoadingPlan(targetPlan);
    try {
      await createMpPreference.mutateAsync(targetPlan);
      toast.info("Abrindo link de pagamento…", {
        description: "Após pagar, clique em 'Atualizar status' para confirmar.",
      });
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

  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);

  return (
    <div className="space-y-5 pb-4">

      {/* ── Plano atual ── */}
      <Card className={`border ${PLAN_BG[currentPlan]}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${PLAN_BG[currentPlan]}`}>
                <PlanIcon className={`h-5 w-5 ${PLAN_COLORS[currentPlan]}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Seu plano</p>
                <h3 className={`text-lg font-medium whitespace-nowrap ${PLAN_COLORS[currentPlan]}`}>
                  {PLAN_LABELS[currentPlan]}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-medium whitespace-nowrap">
                R$ {PLAN_PRICES[currentPlan].toLocaleString("pt-BR")}
              </p>
              <p className="text-[10px] text-muted-foreground">/mês</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`${statusInfo.color} text-[10px]`}>
              {statusInfo.label}
            </Badge>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-[10px] text-muted-foreground active:opacity-70"
            >
              {isRefreshing
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <RefreshCw className="h-3 w-3" />}
              Atualizar status
            </button>
          </div>

          {periodEnd && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              Renova em {format(new Date(periodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          )}

          {subscription?.is_manual_trial && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-qg-blue-50 border border-qg-blue-200 text-xs text-qg-blue-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Período de avaliação ativo.
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Aguardando confirmação de pagamento.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Limites de uso ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium">Uso do plano</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Usuários</span>
              <span className="font-medium whitespace-nowrap">
                {userLimit ? `até ${userLimit}` : "ilimitado"}
              </span>
            </div>
            {userLimit && <Progress value={(1 / userLimit) * 100} className="h-1.5" />}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Eleitores</span>
              <span className="font-medium whitespace-nowrap">
                {voterLimit ? `até ${voterLimit.toLocaleString("pt-BR")}` : "ilimitado"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Funcionalidades incluídas ── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium">Incluído no seu plano</p>
          </div>
          <ul className="space-y-2">
            {PLAN_FEATURES[currentPlan].map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                {feat}
              </li>
            ))}
          </ul>

          {PLAN_LOCKED_FEATURES[currentPlan].length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                Disponível em planos superiores
              </p>
              <ul className="space-y-1.5">
                {PLAN_LOCKED_FEATURES[currentPlan].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Cards de upgrade ── */}
      {currentPlanIndex < PLAN_ORDER.length - 1 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground px-0.5">Fazer upgrade</p>

          {PLAN_ORDER.slice(currentPlanIndex + 1).map((targetPlan) => {
            const TargetIcon = PLAN_ICON[targetPlan];
            const isMostPopular = targetPlan === "silver";
            const isTop = targetPlan === "gold";

            return (
              <Card
                key={targetPlan}
                className={`border transition-all ${
                  isTop
                    ? "border-amber-300/50 bg-amber-50/30 dark:bg-amber-900/5"
                    : "border-emerald-300/50 bg-emerald-50/30 dark:bg-emerald-900/5"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${PLAN_BG[targetPlan]}`}>
                        <TargetIcon className={`h-5 w-5 ${PLAN_COLORS[targetPlan]}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{PLAN_LABELS[targetPlan]}</h4>
                        {isMostPopular && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Mais popular
                          </span>
                        )}
                        {isTop && (
                          <span className="text-[10px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Completo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-medium whitespace-nowrap">
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
                    className="w-full h-12 font-medium text-sm gap-2"
                    disabled={!!loadingPlan}
                    onClick={() => handleUpgrade(targetPlan)}
                  >
                    {loadingPlan === targetPlan ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Gerando link…</>
                    ) : (
                      <>Assinar {PLAN_LABELS[targetPlan]} <ChevronRight className="h-4 w-4" /></>
                    )}
                  </Button>

                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    Pix · Cartão · Pagamento seguro via Mercado Pago
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Plano máximo */}
      {currentPlanIndex === PLAN_ORDER.length - 1 && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Crown className="h-8 w-8 text-amber-500" />
          <p className="text-sm font-medium">Você tem o melhor plano</p>
          <p className="text-xs text-muted-foreground">
            Todas as funcionalidades estão disponíveis para o seu gabinete.
          </p>
        </div>
      )}
    </div>
  );
}
