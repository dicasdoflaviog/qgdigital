import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllSubscriptions, PLAN_LABELS, type SubscriptionPlan, type SubscriptionStatus } from "@/hooks/useSubscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Crown, Edit2, CheckCircle, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:   { label: "Ativo",     color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  trialing: { label: "Trial",     color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  pending:  { label: "Pendente",  color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  past_due: { label: "Vencido",   color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  canceled: { label: "Cancelado", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

interface EditForm {
  gabinete_id: string;
  plan_type: SubscriptionPlan;
  status: SubscriptionStatus;
  mp_transaction_id: string;
  notes: string;
}

export function SubscricoesPanel() {
  const { data: subscriptions = [], isLoading } = useAllSubscriptions();
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(new Date(d), "dd/MM/yy HH:mm", { locale: ptBR }); }
    catch { return d; }
  };

  async function handleSave() {
    if (!editTarget) return;
    setSaving(true);
    try {
      const isActivating = editTarget.status === "active";

      const { error } = await supabase
        .from("subscriptions" as any)
        .update({
          plan_type: editTarget.plan_type,
          status: editTarget.status,
          mp_transaction_id: editTarget.mp_transaction_id || null,
          notes: editTarget.notes || null,
          activated_by: isActivating ? "manual_l5" : undefined,
          activated_at: isActivating ? new Date().toISOString() : undefined,
          next_billing_date: isActivating
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("gabinete_id", editTarget.gabinete_id);

      if (error) throw error;

      toast.success("Assinatura atualizada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["all-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      setEditTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar assinatura.");
    } finally {
      setSaving(false);
    }
  }

  async function handleForceActive(gabineteId: string, currentPlan: SubscriptionPlan) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("subscriptions" as any)
        .upsert({
          gabinete_id: gabineteId,
          plan_type: currentPlan,
          status: "active",
          activated_by: "manual_l5",
          activated_at: new Date().toISOString(),
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        } as any, { onConflict: "gabinete_id" });

      if (error) throw error;
      toast.success("Plano ativado manualmente.");
      queryClient.invalidateQueries({ queryKey: ["all-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao ativar plano.");
    } finally {
      setSaving(false);
    }
  }

  // Sumário
  const totalActive = subscriptions.filter((s) => s.status === "active").length;
  const totalPending = subscriptions.filter((s) => s.status === "pending" || s.status === "trialing").length;
  const mrr = subscriptions
    .filter((s) => s.status === "active")
    .reduce((acc, s) => {
      if (s.plan_type === "gold") return acc + 297;
      if (s.plan_type === "silver") return acc + 197;
      return acc;
    }, 0);

  return (
    <div className="space-y-4">
      {/* MRR Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-qg-blue-500/20 bg-gradient-to-br from-qg-blue-500/5 to-transparent">
          <CardContent className="p-4">
            <p className="text-2xl font-medium text-emerald-500">{totalActive}</p>
            <p className="text-xs text-muted-foreground font-medium">Assinaturas Ativas</p>
          </CardContent>
        </Card>
        <Card className="border-qg-blue-500/20 bg-gradient-to-br from-qg-blue-500/5 to-transparent">
          <CardContent className="p-4">
            <p className="text-2xl font-medium text-amber-500">{totalPending}</p>
            <p className="text-xs text-muted-foreground font-medium">Aguardando</p>
          </CardContent>
        </Card>
        <Card className="border-qg-blue-500/20 bg-gradient-to-br from-qg-blue-500/5 to-transparent">
          <CardContent className="p-4">
            <p className="text-2xl font-medium text-foreground">
              R$ {mrr.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground font-medium">MRR Estimado</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card className="border-qg-blue-500/20">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Crown className="h-4 w-4 text-qg-blue-500" /> Todas as Assinaturas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : subscriptions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma assinatura encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium text-xs">Gabinete</TableHead>
                    <TableHead className="font-medium text-xs">Plano</TableHead>
                    <TableHead className="font-medium text-xs">Status</TableHead>
                    <TableHead className="font-medium text-xs hidden md:table-cell">Ativado por</TableHead>
                    <TableHead className="font-medium text-xs hidden lg:table-cell">Próx. Renovação</TableHead>
                    <TableHead className="font-medium text-xs hidden lg:table-cell">MP Payment ID</TableHead>
                    <TableHead className="font-medium text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const si = STATUS_MAP[sub.status] || STATUS_MAP.active;
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <p className="text-xs font-mono text-muted-foreground">{sub.gabinete_id.slice(0, 8)}…</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {PLAN_LABELS[sub.plan_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${si.color} text-[10px] font-medium`}>
                            {si.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs text-muted-foreground capitalize">
                            {sub.activated_by === "manual_l5" ? "Manual L5" : sub.activated_by === "mp_webhook" ? "Mercado Pago" : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {fmtDate(sub.next_billing_date)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {sub.mp_payment_id || sub.mp_transaction_id || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Editar assinatura"
                              onClick={() =>
                                setEditTarget({
                                  gabinete_id: sub.gabinete_id,
                                  plan_type: sub.plan_type,
                                  status: sub.status,
                                  mp_transaction_id: sub.mp_transaction_id || "",
                                  notes: sub.notes || "",
                                })
                              }
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            {sub.status !== "active" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-600"
                                title="Forçar ativo (boleto/empenho)"
                                disabled={saving}
                                onClick={() => handleForceActive(sub.gabinete_id, sub.plan_type)}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4 text-qg-blue-500" /> Editar Assinatura
            </DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Plano</Label>
                <Select
                  value={editTarget.plan_type}
                  onValueChange={(v) => setEditTarget({ ...editTarget, plan_type: v as SubscriptionPlan })}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Prata</SelectItem>
                    <SelectItem value="gold">Ouro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select
                  value={editTarget.status}
                  onValueChange={(v) => setEditTarget({ ...editTarget, status: v as SubscriptionStatus })}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="trialing">Trial / Aguardando</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="past_due">Vencido</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  ID da Transação MP (opcional)
                </Label>
                <Input
                  className="min-h-[44px] text-sm font-mono"
                  placeholder="Ex: 123456789 (boleto/empenho)"
                  value={editTarget.mp_transaction_id}
                  onChange={(e) => setEditTarget({ ...editTarget, mp_transaction_id: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">
                  Para contratos via boleto ou empenho da Câmara.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Observações</Label>
                <Input
                  className="min-h-[44px] text-sm"
                  placeholder="Ex: Contrato assinado em 21/03/2026"
                  value={editTarget.notes}
                  onChange={(e) => setEditTarget({ ...editTarget, notes: e.target.value })}
                />
              </div>

              <Button
                className="w-full min-h-[44px] font-medium text-xs gap-2"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
