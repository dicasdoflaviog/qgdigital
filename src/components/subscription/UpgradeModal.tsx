import { Crown, Sparkles, X, Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscription, PLAN_LABELS, type SubscriptionPlan } from "@/hooks/useSubscription";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  bronze: [
    "Cadastro de eleitores",
    "Demandas básicas",
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
    "Chat IA (Assistente de Gabinete)",
    "Análise de sentimento",
    "Observatório Legislativo",
    "Suporte prioritário",
  ],
};

export function UpgradeModal({ open, onOpenChange, featureName }: UpgradeModalProps) {
  const { plan } = useSubscription();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-border bg-card [&>button]:hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>

          <h2 className="text-lg font-medium tracking-tight text-foreground">
            Recurso Premium
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {featureName
              ? `"${featureName}" está disponível a partir do plano Prata.`
              : "Faça o upgrade para desbloquear este recurso."}
          </p>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Seu plano atual: <strong className="text-foreground">{PLAN_LABELS[plan]}</strong>
          </div>
        </div>

        {/* Plans comparison */}
        <div className="px-6 pb-6 space-y-3">
          {(["silver", "gold"] as SubscriptionPlan[])
            .filter((p) => {
              if (plan === "bronze") return true;
              if (plan === "silver") return p === "gold";
              return false;
            })
            .map((planKey) => (
              <div
                key={planKey}
                className={`rounded-xl border p-4 ${
                  planKey === "gold"
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">
                    Plano {PLAN_LABELS[planKey]}
                  </h3>
                  {planKey === "gold" && (
                    <span className="text-[10px] font-medium text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                      Recomendado
                    </span>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {PLAN_FEATURES[planKey].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-4 min-h-[44px] font-medium text-xs"
                  variant={planKey === "gold" ? "default" : "outline"}
                >
                  Falar com o Administrador
                </Button>
              </div>
            ))}

          <p className="text-[10px] text-center text-muted-foreground pt-1">
            Entre em contato com o administrador do sistema para solicitar o upgrade.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
