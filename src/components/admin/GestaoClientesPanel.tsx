import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useContratos, useUpsertContrato, ContratoNacional } from "@/hooks/useContratos";
import { useFeatureFlags, AVAILABLE_FEATURES } from "@/hooks/useFeatureFlags";
import { useAllSubscriptions, PLAN_LABELS, type Subscription, type SubscriptionPlan, type SubscriptionStatus } from "@/hooks/useSubscription";
import { PlanBadge } from "@/components/subscription/PlanBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Users, Settings2, Loader2, CheckCircle, XCircle, Globe, MapPin,
  DollarSign, TrendingUp, Ban, Shield, Pencil, Crown,
} from "lucide-react";

const TODOS_ESTADOS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const ESCOPO_OPTIONS = ["Regional", "Estadual", "Nacional"];

interface FatConfig {
  id: string;
  cliente_id: string;
  valor_por_gabinete: number;
  dia_vencimento: number;
  status_pagamento: string;
  bloqueado: boolean;
  habilidades: Record<string, boolean> | null;
  estados_autorizados: string[] | null;
}

export function GestaoClientesPanel() {
  const qc = useQueryClient();

  // --- Data ---
  const { data: l4Users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["l4-users-gestao"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, role_level")
        .eq("role_level", 4);
      if (!data?.length) return [];
      const ids = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, estado_atuacao, is_active")
        .in("id", ids);
      return profiles ?? [];
    },
  });

  const { data: contratos = [] } = useContratos();
  const upsertContrato = useUpsertContrato();
  const { flags, toggleFlag, isFeatureEnabled } = useFeatureFlags();
  const { data: allSubscriptions = [] } = useAllSubscriptions();

  // Subscription map by gabinete_id
  const subMap = useMemo(() => {
    const m: Record<string, Subscription> = {};
    allSubscriptions.forEach((s) => { m[s.gabinete_id] = s; });
    return m;
  }, [allSubscriptions]);

  // Upsert subscription
  const upsertSub = useMutation({
    mutationFn: async (values: { gabinete_id: string; plan_type: SubscriptionPlan; status: SubscriptionStatus; current_period_end: string | null; is_manual_trial: boolean }) => {
      const existing = subMap[values.gabinete_id];
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-subscriptions"] }),
  });

  // Billing configs
  const { data: configs = [] } = useQuery({
    queryKey: ["config-faturamento-gestao"],
    queryFn: async () => {
      const { data } = await supabase.from("config_faturamento").select("*");
      return (data ?? []) as unknown as FatConfig[];
    },
  });

  // Gabinete count per L4
  const { data: gabCountMap = {} } = useQuery({
    queryKey: ["gabinetes-per-l4-gestao"],
    queryFn: async () => {
      const { data: l3Roles } = await supabase.from("user_roles").select("user_id").eq("role_level", 3);
      if (!l3Roles?.length) return {};
      const l3Ids = l3Roles.map((r) => r.user_id);
      const { data: l3Profiles } = await supabase.from("profiles").select("id, gabinete_id").in("id", l3Ids);
      const map: Record<string, number> = {};
      (l3Profiles ?? []).forEach((p: any) => {
        if (p.gabinete_id) map[p.gabinete_id] = (map[p.gabinete_id] || 0) + 1;
      });
      return map;
    },
  });

  const configMap = useMemo(() => {
    const m: Record<string, FatConfig> = {};
    configs.forEach((c) => { if (c.cliente_id) m[c.cliente_id] = c; });
    return m;
  }, [configs]);

  const contratoMap = useMemo(() => {
    const m: Record<string, ContratoNacional> = {};
    contratos.forEach((c) => { if (c.user_id) m[c.user_id] = c; });
    return m;
  }, [contratos]);

  // --- Modal state ---
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    valor_por_gabinete: number;
    dia_vencimento: number;
    bloqueado: boolean;
    escopo_geografico: string;
    estados_autorizados: string[];
    limite_gabinetes: number;
    ativo: boolean;
    plan_type: SubscriptionPlan;
    sub_status: SubscriptionStatus;
    current_period_end: string;
    is_manual_trial: boolean;
  } | null>(null);

  const openModal = (userId: string) => {
    const cfg = configMap[userId];
    const ctr = contratoMap[userId];
    const sub = subMap[userId];
    setSelectedClient(userId);
    setEditForm({
      valor_por_gabinete: cfg?.valor_por_gabinete ?? 500,
      dia_vencimento: cfg?.dia_vencimento ?? 10,
      bloqueado: cfg?.bloqueado ?? false,
      escopo_geografico: ctr?.escopo_geografico ?? "Regional",
      estados_autorizados: ctr?.estados_autorizados ?? ["BA"],
      limite_gabinetes: ctr?.limite_gabinetes ?? 10,
      ativo: ctr?.ativo ?? true,
      plan_type: (sub?.plan_type || "bronze") as SubscriptionPlan,
      sub_status: (sub?.status || "active") as SubscriptionStatus,
      current_period_end: sub?.current_period_end
        ? new Date(sub.current_period_end).toISOString().split("T")[0]
        : new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      is_manual_trial: sub?.is_manual_trial ?? false,
    });
  };

  const toggleEstado = (uf: string) => {
    if (!editForm) return;
    const current = editForm.estados_autorizados;
    setEditForm({
      ...editForm,
      estados_autorizados: current.includes(uf) ? current.filter((e) => e !== uf) : [...current, uf],
    });
  };

  // Upsert billing config
  const upsertConfig = useMutation({
    mutationFn: async (payload: { cliente_id: string } & Partial<FatConfig>) => {
      const existing = configMap[payload.cliente_id];
      if (existing) {
        const { error } = await supabase
          .from("config_faturamento")
          .update({
            valor_por_gabinete: payload.valor_por_gabinete,
            dia_vencimento: payload.dia_vencimento,
            bloqueado: payload.bloqueado,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("config_faturamento")
          .insert({
            cliente_id: payload.cliente_id,
            valor_por_gabinete: payload.valor_por_gabinete ?? 500,
            dia_vencimento: payload.dia_vencimento ?? 10,
            bloqueado: payload.bloqueado ?? false,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["config-faturamento-gestao"] }),
  });

  const handleSave = async () => {
    if (!selectedClient || !editForm) return;
    try {
      await upsertConfig.mutateAsync({
        cliente_id: selectedClient,
        valor_por_gabinete: editForm.valor_por_gabinete,
        dia_vencimento: editForm.dia_vencimento,
        bloqueado: editForm.bloqueado,
      });
      await upsertContrato.mutateAsync({
        user_id: selectedClient,
        escopo_geografico: editForm.escopo_geografico,
        estados_autorizados: editForm.estados_autorizados,
        limite_gabinetes: editForm.limite_gabinetes,
        ativo: editForm.ativo,
      });
      // Save subscription
      await upsertSub.mutateAsync({
        gabinete_id: selectedClient,
        plan_type: editForm.plan_type,
        status: editForm.sub_status,
        current_period_end: editForm.current_period_end ? new Date(editForm.current_period_end).toISOString() : null,
        is_manual_trial: editForm.is_manual_trial,
      });
      toast({ title: "Contrato salvo! ✅" });
      setSelectedClient(null);
      setEditForm(null);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err?.message, variant: "destructive" });
    }
  };

  const handleToggleFeature = async (clienteId: string, featureKey: string, currentEnabled: boolean) => {
    try {
      await toggleFlag.mutateAsync({ clienteId, featureKey, enabled: !currentEnabled });
      toast({
        title: !currentEnabled ? "✅ Recurso ativado" : "❌ Recurso desativado",
      });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  // --- Calculations ---
  const rows = l4Users.map((u: any) => {
    const cfg = configMap[u.id];
    const ctr = contratoMap[u.id];
    const sub = subMap[u.id];
    const qtdGab = gabCountMap[u.id] ?? 0;
    const valorUnit = cfg?.valor_por_gabinete ?? 500;
    return {
      id: u.id,
      nome: u.full_name || u.id.slice(0, 8),
      isActive: u.is_active,
      qtdGab,
      valorUnit,
      total: qtdGab * valorUnit,
      bloqueado: cfg?.bloqueado ?? false,
      estados: ctr?.estados_autorizados ?? [],
      escopo: ctr?.escopo_geografico ?? "—",
      ativo: ctr?.ativo ?? false,
      plan: (sub?.plan_type || "bronze") as SubscriptionPlan,
      subStatus: sub?.status || "active",
    };
  });

  const mrr = rows.filter((r) => !r.bloqueado && r.ativo).reduce((s, r) => s + r.total, 0);
  const totalGabinetes = rows.reduce((s, r) => s + r.qtdGab, 0);
  const clientesAtivos = rows.filter((r) => !r.bloqueado && r.ativo).length;

  const selectedUser = l4Users.find((u: any) => u.id === selectedClient) as any;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Gestão de Clientes — Nível 4</h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-4">
          Configure contratos, habilidades e território de cada cliente. Mudanças propagam automaticamente para os gabinetes vinculados.
        </p>

        <Card className="border-purple-500/20">
          <CardContent className="p-0">
            {loadingUsers ? (
              <div className="p-8 text-center flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
              </div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum cliente Nível 4 cadastrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Cliente</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Gabinetes</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Escopo</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Estados</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell text-right">MRR</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Plano</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider w-36">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id} className={r.bloqueado ? "opacity-50 bg-destructive/5" : ""}>
                        <TableCell>
                          <p className="font-medium text-sm">{r.nome}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs font-black">{r.qtdGab}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600">
                            <Globe className="h-3 w-3 mr-1" />{r.escopo}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {r.estados.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.estados.slice(0, 3).map((uf) => (
                                <Badge key={uf} variant="secondary" className="text-[9px] px-1.5 py-0">{uf}</Badge>
                              ))}
                              {r.estados.length > 3 && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">+{r.estados.length - 3}</Badge>
                              )}
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right">
                          <span className="text-sm font-black">
                            R$ {r.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <PlanBadge plan={r.plan} />
                        </TableCell>
                        <TableCell className="text-center">
                          {r.bloqueado ? (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1">
                              <Ban className="h-3 w-3" /> Bloq.
                            </Badge>
                          ) : r.ativo ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
                              <CheckCircle className="h-3 w-3" /> Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                            onClick={() => openModal(r.id)}>
                            <Settings2 className="h-3 w-3" /> Configurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Resumo Financeiro */}
      <div className="lg:w-72 space-y-4">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">MRR (Receita Mensal)</p>
              <p className="text-2xl font-black text-emerald-600">
                R$ {mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Clientes Ativos</p>
                <p className="text-lg font-black">{clientesAtivos}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Gabinetes</p>
                <p className="text-lg font-black">{totalGabinetes}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">ARPU</p>
              <p className="text-lg font-black">
                R$ {clientesAtivos > 0
                  ? (mrr / clientesAtivos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                  : "0,00"}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Valor Total Contratos</p>
              <p className="text-lg font-black">
                R$ {rows.reduce((s, r) => s + r.total, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === MODAL: Configurar Contrato === */}
      <Dialog open={!!selectedClient} onOpenChange={(v) => { if (!v) { setSelectedClient(null); setEditForm(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              Configurar Contrato
            </DialogTitle>
          </DialogHeader>
          {editForm && selectedClient && (
            <div className="space-y-5">
              {/* Client name */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Cliente</p>
                <p className="text-sm font-bold">{selectedUser?.full_name || selectedClient.slice(0, 8)}</p>
              </div>

              {/* === Preço === */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Preço
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Valor por Gabinete (R$)</Label>
                    <Input type="number" min={0} step={50} value={editForm.valor_por_gabinete}
                      onChange={(e) => setEditForm({ ...editForm, valor_por_gabinete: parseFloat(e.target.value) || 0 })}
                      className="min-h-[44px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Dia Vencimento</Label>
                    <Input type="number" min={1} max={31} value={editForm.dia_vencimento}
                      onChange={(e) => setEditForm({ ...editForm, dia_vencimento: parseInt(e.target.value) || 10 })}
                      className="min-h-[44px]" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* === Habilidades (Feature Flags) === */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5 text-purple-500" /> Habilidades
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  Desativar um recurso remove o acesso para este cliente e todos os gabinetes vinculados.
                </p>
                <div className="space-y-2">
                  {AVAILABLE_FEATURES.map((feature) => {
                    const enabled = isFeatureEnabled(feature.key, selectedClient);
                    return (
                      <div key={feature.key}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                          enabled ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5"
                        }`}>
                        <div className="flex items-center gap-2">
                          {enabled ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          )}
                          <div>
                            <p className="text-xs font-bold">{feature.label}</p>
                            <p className="text-[9px] text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        <Switch checked={enabled} disabled={toggleFlag.isPending}
                          onCheckedChange={() => handleToggleFeature(selectedClient, feature.key, enabled)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* === Território === */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-purple-500" /> Território
                </h4>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">Escopo Geográfico</Label>
                  <Select value={editForm.escopo_geografico} onValueChange={(v) => setEditForm({ ...editForm, escopo_geografico: v })}>
                    <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ESCOPO_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">
                    Estados Autorizados ({editForm.estados_autorizados.length})
                  </Label>
                  <div className="grid grid-cols-7 gap-1 max-h-[150px] overflow-y-auto p-1">
                    {TODOS_ESTADOS.map((uf) => {
                      const selected = editForm.estados_autorizados.includes(uf);
                      return (
                        <button key={uf} type="button" onClick={() => toggleEstado(uf)}
                          className={`text-[10px] font-bold py-1.5 rounded-md border transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                          }`}>
                          {uf}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">Limite de Gabinetes</Label>
                  <Input type="number" min={1} max={1000} value={editForm.limite_gabinetes}
                    onChange={(e) => setEditForm({ ...editForm, limite_gabinetes: parseInt(e.target.value) || 10 })}
                    className="min-h-[44px]" />
                </div>
              </div>

              <Separator />

              {/* === Plano / Assinatura === */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Crown className="h-3.5 w-3.5 text-yellow-500" /> Plano & Assinatura
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Plano</Label>
                    <Select value={editForm.plan_type} onValueChange={(v) => setEditForm({ ...editForm, plan_type: v as SubscriptionPlan })}>
                      <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="silver">Prata</SelectItem>
                        <SelectItem value="gold">Ouro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Status</Label>
                    <Select value={editForm.sub_status} onValueChange={(v) => setEditForm({ ...editForm, sub_status: v as SubscriptionStatus })}>
                      <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="trialing">Trial</SelectItem>
                        <SelectItem value="past_due">Pagamento Pendente</SelectItem>
                        <SelectItem value="canceled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">Expiração do Período</Label>
                  <Input type="date" value={editForm.current_period_end}
                    onChange={(e) => setEditForm({ ...editForm, current_period_end: e.target.value })}
                    className="min-h-[44px]" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-bold">Trial Manual</p>
                    <p className="text-[10px] text-muted-foreground">Conceder período de avaliação gratuito</p>
                  </div>
                  <Switch checked={editForm.is_manual_trial} onCheckedChange={(v) => setEditForm({ ...editForm, is_manual_trial: v })} />
                </div>
              </div>

              <Separator />

              {/* === Contrato Ativo + Bloqueio === */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-bold">Contrato Ativo</p>
                    <p className="text-[10px] text-muted-foreground">Desativar remove acesso ao mapa nacional</p>
                  </div>
                  <Switch checked={editForm.ativo} onCheckedChange={(v) => setEditForm({ ...editForm, ativo: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-destructive/30">
                  <div>
                    <p className="text-sm font-bold text-destructive">Bloquear Acesso</p>
                    <p className="text-[10px] text-muted-foreground">Bloqueia o sistema inteiro por inadimplência</p>
                  </div>
                  <Switch checked={editForm.bloqueado} onCheckedChange={(v) => setEditForm({ ...editForm, bloqueado: v })} />
                </div>
              </div>

              <Button onClick={handleSave} disabled={upsertContrato.isPending || upsertConfig.isPending}
                className="w-full min-h-[48px] text-sm font-bold uppercase tracking-wider rounded-full">
                {(upsertContrato.isPending || upsertConfig.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar Contrato
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
