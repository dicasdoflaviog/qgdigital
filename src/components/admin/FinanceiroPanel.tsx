import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  DollarSign, Loader2, Users, Ban, CheckCircle, XCircle, Settings2, TrendingUp,
} from "lucide-react";

interface FatConfig {
  id: string;
  cliente_id: string;
  valor_por_gabinete: number;
  dia_vencimento: number;
  status_pagamento: string;
  data_ultimo_pagamento: string | null;
  bloqueado: boolean;
}

export function FinanceiroPanel() {
  const qc = useQueryClient();

  // L4 users
  const { data: l4Users = [] } = useQuery({
    queryKey: ["l4-users-financeiro"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, role_level")
        .eq("role_level", 4);
      if (!data?.length) return [];
      const ids = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, is_active")
        .in("id", ids);
      return profiles ?? [];
    },
  });

  // Gabinetes (L3 profiles) count per gabinete_id (which points to L4 or L3 admin)
  // We count L3 users (role_level=3) grouped by their gabinete_id from profiles
  const { data: gabineteCountMap = {} } = useQuery({
    queryKey: ["gabinetes-per-l4"],
    queryFn: async () => {
      // Get all L3 user_ids
      const { data: l3Roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_level", 3);
      if (!l3Roles?.length) return {};
      const l3Ids = l3Roles.map((r) => r.user_id);
      // Get their profiles with gabinete_id
      const { data: l3Profiles } = await supabase
        .from("profiles")
        .select("id, gabinete_id")
        .in("id", l3Ids);
      // Also check contratos_nacional to map gabinete_id -> L4 user_id
      const { data: contratos } = await supabase
        .from("contratos_nacional")
        .select("user_id");
      const l4Ids = new Set((contratos ?? []).map((c) => c.user_id));

      // Count L3 profiles per L4 — gabinete_id on profile = the admin (L3) themselves
      // For simplicity: count L3 users whose gabinete_id matches an L4 user_id
      const map: Record<string, number> = {};
      (l3Profiles ?? []).forEach((p: any) => {
        if (p.gabinete_id && l4Ids.has(p.gabinete_id)) {
          map[p.gabinete_id] = (map[p.gabinete_id] || 0) + 1;
        }
      });
      // Also count L3 users with no gabinete_id — distribute via contratos
      // Simple fallback: just count all L3 per unique gabinete_id
      (l3Profiles ?? []).forEach((p: any) => {
        const gid = p.gabinete_id;
        if (gid && !l4Ids.has(gid)) {
          // This gabinete_id might be the L3's own id — try to find which L4 owns it
          // For now, skip — requires more complex mapping
        }
      });
      return map;
    },
  });

  // Billing configs
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["config-faturamento"],
    queryFn: async () => {
      const { data } = await supabase
        .from("config_faturamento" as any)
        .select("*");
      return (data ?? []) as unknown as FatConfig[];
    },
  });

  const configMap: Record<string, FatConfig> = {};
  configs.forEach((c) => { if (c.cliente_id) configMap[c.cliente_id] = c; });

  // Upsert config
  const upsertConfig = useMutation({
    mutationFn: async (payload: Partial<FatConfig> & { cliente_id: string }) => {
      const existing = configMap[payload.cliente_id];
      if (existing) {
        const { error } = await supabase
          .from("config_faturamento" as any)
          .update({
            valor_por_gabinete: payload.valor_por_gabinete,
            dia_vencimento: payload.dia_vencimento,
            status_pagamento: payload.status_pagamento,
            bloqueado: payload.bloqueado,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("config_faturamento" as any)
          .insert({
            cliente_id: payload.cliente_id,
            valor_por_gabinete: payload.valor_por_gabinete ?? 500,
            dia_vencimento: payload.dia_vencimento ?? 10,
            status_pagamento: payload.status_pagamento ?? "Em dia",
            bloqueado: payload.bloqueado ?? false,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["config-faturamento"] }),
  });

  // Toggle block
  const toggleBlock = async (clienteId: string, current: boolean) => {
    try {
      await upsertConfig.mutateAsync({
        cliente_id: clienteId,
        ...configMap[clienteId],
        bloqueado: !current,
      });
      toast({
        title: !current ? "🔒 Acesso bloqueado" : "🔓 Acesso liberado",
        description: !current
          ? "O Nível 4 e seus gabinetes perderam acesso."
          : "Acesso restaurado com sucesso.",
      });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  // Edit modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(500);
  const [editDia, setEditDia] = useState(10);

  const openEdit = (clienteId: string) => {
    const c = configMap[clienteId];
    setEditingId(clienteId);
    setEditValue(c?.valor_por_gabinete ?? 500);
    setEditDia(c?.dia_vencimento ?? 10);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await upsertConfig.mutateAsync({
        cliente_id: editingId,
        ...configMap[editingId],
        valor_por_gabinete: editValue,
        dia_vencimento: editDia,
      });
      toast({ title: "Valor atualizado! ✅" });
      setEditingId(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  // Calculations
  const rows = l4Users.map((u: any) => {
    const c = configMap[u.id];
    const qtdGabinetes = gabineteCountMap[u.id] ?? 0;
    const valorUnit = c?.valor_por_gabinete ?? 500;
    const total = qtdGabinetes * valorUnit;
    return {
      id: u.id,
      nome: u.full_name || u.id.slice(0, 8),
      isActive: u.is_active,
      qtdGabinetes,
      valorUnit,
      total,
      status: c?.status_pagamento ?? "Sem config",
      bloqueado: c?.bloqueado ?? false,
    };
  });

  const faturamentoBruto = rows.reduce((sum, r) => sum + r.total, 0);
  const clientesAtivos = rows.filter((r) => !r.bloqueado).length;
  const clientesBloqueados = rows.filter((r) => r.bloqueado).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-medium">
                  R$ {faturamentoBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Faturamento Bruto Mensal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-qg-blue-500/20 bg-gradient-to-br from-qg-blue-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-qg-blue-500/10">
                <Users className="h-6 w-6 text-qg-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-medium">{clientesAtivos}</p>
                <p className="text-xs text-muted-foreground font-medium">
                  Clientes Ativos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <Ban className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-medium">{clientesBloqueados}</p>
                <p className="text-xs text-muted-foreground font-medium">
                  Bloqueados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Table */}
      <Card className="border-qg-blue-500/20">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-qg-blue-500" /> Gestão de Faturamento — Clientes Nível 4
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
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
                    <TableHead className="font-medium text-xs">Cliente L4</TableHead>
                    <TableHead className="font-medium text-xs text-center">Gabinetes</TableHead>
                    <TableHead className="font-medium text-xs hidden sm:table-cell text-right">Valor Mensal</TableHead>
                    <TableHead className="font-medium text-xs hidden md:table-cell">Status</TableHead>
                    <TableHead className="font-medium text-xs text-center">Bloquear</TableHead>
                    <TableHead className="font-medium text-xs w-28">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} className={r.bloqueado ? "opacity-60 bg-destructive/5" : ""}>
                      <TableCell>
                        <p className="font-medium text-sm">{r.nome}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs font-medium">{r.qtdGabinetes}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">
                        <span className="text-sm font-medium">
                          R$ {r.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {r.qtdGabinetes} × R$ {r.valorUnit.toFixed(2)}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {r.bloqueado ? (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1">
                            <XCircle className="h-3 w-3" /> Bloqueado
                          </Badge>
                        ) : r.status === "Em dia" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
                            <CheckCircle className="h-3 w-3" /> {r.status}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] gap-1">
                            {r.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={r.bloqueado}
                          onCheckedChange={() => toggleBlock(r.id, r.bloqueado)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-[10px] font-medium"
                          onClick={() => openEdit(r.id)}
                        >
                          <Settings2 className="h-3 w-3" /> Valor
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

      {/* Edit Value Dialog */}
      <Dialog open={!!editingId} onOpenChange={(v) => { if (!v) setEditingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">
              Configurar Valor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Valor por Gabinete (R$)</Label>
              <Input
                type="number"
                min={0}
                step={50}
                value={editValue}
                onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Dia de Vencimento</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={editDia}
                onChange={(e) => setEditDia(parseInt(e.target.value) || 10)}
                className="min-h-[44px]"
              />
            </div>
            <Button
              onClick={saveEdit}
              disabled={upsertConfig.isPending}
              className="w-full min-h-[48px] text-sm font-medium rounded-full"
            >
              {upsertConfig.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
