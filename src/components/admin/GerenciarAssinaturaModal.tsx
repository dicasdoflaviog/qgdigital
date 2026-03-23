import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LABELS, type SubscriptionPlan } from "@/hooks/useSubscription";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Crown, CheckCircle, Loader2, AlertTriangle, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gabineteId: string;
  gabineteNome: string;
  currentPlan?: SubscriptionPlan;
  currentStatus?: string;
  currentExpiry?: string | null;
}

const PLAN_PRESETS = [
  { plan: "bronze" as SubscriptionPlan, label: "Bronze", price: "Gratuito", color: "text-amber-700", bg: "bg-amber-700/10 border-amber-700/20" },
  { plan: "silver" as SubscriptionPlan, label: "Prata",  price: "R$ 197/mês", color: "text-slate-400", bg: "bg-slate-400/10 border-slate-400/20" },
  { plan: "gold"   as SubscriptionPlan, label: "Ouro",   price: "R$ 297/mês", color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" },
];

const EXPIRY_SHORTCUTS = [
  { label: "30 dias",  days: 30 },
  { label: "3 meses",  days: 90 },
  { label: "6 meses",  days: 180 },
  { label: "1 ano",    days: 365 },
];

export function GerenciarAssinaturaModal({
  open, onOpenChange, gabineteId, gabineteNome, currentPlan, currentStatus, currentExpiry,
}: Props) {
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(currentPlan || "bronze");
  const [expiryDate, setExpiryDate] = useState<string>(
    currentExpiry
      ? format(new Date(currentExpiry), "yyyy-MM-dd")
      : format(addMonths(new Date(), 1), "yyyy-MM-dd")
  );
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function applyShortcut(days: number) {
    setExpiryDate(format(addDays(new Date(), days), "yyyy-MM-dd"));
  }

  async function handleSave() {
    if (!expiryDate) {
      toast.error("Defina a data de expiração.");
      return;
    }

    setSaving(true);
    try {
      const expiryIso = new Date(expiryDate + "T23:59:59").toISOString();

      const { error } = await supabase
        .from("subscriptions" as any)
        .upsert(
          {
            gabinete_id: gabineteId,
            plan_type: selectedPlan,
            status: "active",                 // Ativação imediata — sem validação de gateway
            next_billing_date: expiryIso,
            current_period_end: expiryIso,
            mp_transaction_id: transactionId || null,
            notes: notes || null,
            activated_by: "manual_l5",
            activated_at: new Date().toISOString(),
            is_manual_trial: false,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "gabinete_id" }
        );

      if (error) throw error;

      // Invalida caches de subscription
      queryClient.invalidateQueries({ queryKey: ["all-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription", gabineteId] });

      toast.success(
        `Plano ${PLAN_LABELS[selectedPlan]} ativado para ${gabineteNome} até ${format(new Date(expiryDate), "dd/MM/yyyy", { locale: ptBR })}.`
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar assinatura.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-purple-500/20 gap-0 [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-border bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Crown className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-sm font-bold text-foreground">
                Gerenciar Assinatura
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{gabineteNome}</p>
              {currentStatus && (
                <Badge
                  variant="outline"
                  className={`mt-1 text-[10px] font-bold ${
                    currentStatus === "active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}
                >
                  {currentStatus === "active" ? "Ativo" : currentStatus === "trialing" ? "Trial" : "Inativo"}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Aviso de override */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Override manual.</strong> A ativação é imediata e ignora validação de gateway.
              Use para contratos fechados por boleto, empenho ou acordo offline.
            </span>
          </div>

          {/* Seleção de Plano */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Plano
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {PLAN_PRESETS.map(({ plan, label, price, color, bg }) => {
                const selected = selectedPlan === plan;
                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                      selected
                        ? `${bg} border-current ${color}`
                        : "border-border bg-muted/30 hover:border-border/80"
                    }`}
                  >
                    <Crown className={`h-5 w-5 ${selected ? color : "text-muted-foreground"}`} />
                    <p className={`text-xs font-bold ${selected ? color : "text-foreground"}`}>{label}</p>
                    <p className="text-[10px] text-muted-foreground">{price}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data de Expiração */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" /> Data de Expiração
            </Label>

            {/* Atalhos rápidos */}
            <div className="flex flex-wrap gap-2">
              {EXPIRY_SHORTCUTS.map(({ label, days }) => (
                <button
                  key={label}
                  onClick={() => applyShortcut(days)}
                  className="px-2.5 py-1 rounded-lg bg-muted border border-border text-xs font-medium hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  {label}
                </button>
              ))}
            </div>

            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              className="min-h-[44px] text-sm"
            />

            {expiryDate && (
              <p className="text-xs text-muted-foreground">
                Expira em:{" "}
                <strong className="text-foreground">
                  {format(new Date(expiryDate + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </strong>
              </p>
            )}
          </div>

          {/* ID de Transação (opcional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              ID da Transação / Nº do Empenho{" "}
              <span className="text-muted-foreground font-normal normal-case tracking-normal">(opcional)</span>
            </Label>
            <Input
              className="min-h-[44px] text-sm font-mono"
              placeholder="Ex: NE2026/0042 ou boleto #123"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Observações{" "}
              <span className="text-muted-foreground font-normal normal-case tracking-normal">(opcional)</span>
            </Label>
            <Textarea
              className="text-sm min-h-[80px] resize-none"
              placeholder="Ex: Contrato assinado presencialmente em 21/03/2026. Renovação em março/2027."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer com botões */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <Button
            variant="outline"
            className="flex-1 min-h-[44px] text-xs font-bold uppercase tracking-wider"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 min-h-[44px] text-xs font-bold uppercase tracking-wider gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</>
              : <><CheckCircle className="h-4 w-4" /> Ativar Agora</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
