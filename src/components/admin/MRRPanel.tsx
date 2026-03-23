import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign, TrendingUp, TrendingDown, Users, Activity, BarChart3, Loader2,
} from "lucide-react";

interface FatConfig {
  id: string;
  cliente_id: string;
  valor_por_gabinete: number;
  status_pagamento: string;
  bloqueado: boolean;
}

export function MRRPanel() {
  // L4 users
  const { data: l4Users = [] } = useQuery({
    queryKey: ["l4-users-mrr"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id")
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

  // Billing configs
  const { data: configs = [] } = useQuery({
    queryKey: ["config-faturamento-mrr"],
    queryFn: async () => {
      const { data } = await supabase.from("config_faturamento" as any).select("*");
      return (data ?? []) as unknown as FatConfig[];
    },
  });

  // Gabinetes count (L3 users) per L4
  const { data: gabCountMap = {} } = useQuery({
    queryKey: ["gabinetes-per-l4-mrr"],
    queryFn: async () => {
      const { data: l3Roles } = await supabase.from("user_roles").select("user_id").eq("role_level", 3);
      if (!l3Roles?.length) return {};
      const l3Ids = l3Roles.map((r) => r.user_id);
      const { data: l3Profiles } = await supabase.from("profiles").select("id, gabinete_id").in("id", l3Ids);
      const { data: contratos } = await supabase.from("contratos_nacional").select("user_id");
      const l4Set = new Set((contratos ?? []).map((c) => c.user_id));
      const map: Record<string, number> = {};
      (l3Profiles ?? []).forEach((p: any) => {
        if (p.gabinete_id && l4Set.has(p.gabinete_id)) {
          map[p.gabinete_id] = (map[p.gabinete_id] || 0) + 1;
        }
      });
      return map;
    },
  });

  // Active gabinetes today (any cadastro/demanda today)
  const { data: activeGabinetes = 0 } = useQuery({
    queryKey: ["active-gabinetes-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: eleitoresHoje } = await supabase
        .from("eleitores")
        .select("gabinete_id")
        .gte("created_at", today);
      const { data: demandasHoje } = await supabase
        .from("demandas")
        .select("gabinete_id")
        .gte("created_at", today);
      const ids = new Set<string>();
      (eleitoresHoje ?? []).forEach((e: any) => { if (e.gabinete_id) ids.add(e.gabinete_id); });
      (demandasHoje ?? []).forEach((d: any) => { if (d.gabinete_id) ids.add(d.gabinete_id); });
      return ids.size;
    },
  });

  // Billing history for chart
  const { data: billingHistory = [], isLoading } = useQuery({
    queryKey: ["billing-history-mrr"],
    queryFn: async () => {
      const { data } = await supabase
        .from("billing_history" as any)
        .select("*")
        .order("mes_referencia", { ascending: true })
        .limit(6);
      return (data ?? []) as any[];
    },
  });

  const configMap: Record<string, FatConfig> = {};
  configs.forEach((c) => { if (c.cliente_id) configMap[c.cliente_id] = c; });

  // Calculate MRR
  const clientRows = l4Users.map((u: any) => {
    const c = configMap[u.id];
    const qtdGab = gabCountMap[u.id] ?? 0;
    const valorUnit = c?.valor_por_gabinete ?? 500;
    return { id: u.id, nome: u.full_name || u.id.slice(0, 8), qtdGab, total: qtdGab * valorUnit, bloqueado: c?.bloqueado ?? false };
  });

  const mrr = clientRows.filter((r) => !r.bloqueado).reduce((s, r) => s + r.total, 0);
  const totalClientes = l4Users.length;
  const clientesBloqueados = clientRows.filter((r) => r.bloqueado).length;
  const churnRate = totalClientes > 0 ? ((clientesBloqueados / totalClientes) * 100).toFixed(1) : "0";
  const arpu = totalClientes > 0 ? (mrr / totalClientes).toFixed(2) : "0";

  // MRR chart from billing_history or calculated
  const months = billingHistory.length > 0
    ? billingHistory.map((b: any) => ({
        label: new Date(b.mes_referencia).toLocaleDateString("pt-BR", { month: "short" }),
        value: Number(b.valor_total),
      }))
    : [{ label: "Atual", value: mrr }];

  const chartMax = Math.max(...months.map((m) => m.value), 1);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">MRR</span>
            </div>
            <p className="text-2xl font-black">R$ {mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Churn Rate</span>
            </div>
            <p className="text-2xl font-black">{churnRate}%</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ARPU</span>
            </div>
            <p className="text-2xl font-black">R$ {Number(arpu).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gabinetes Ativos</span>
            </div>
            <p className="text-2xl font-black">{activeGabinetes}</p>
            <p className="text-[10px] text-muted-foreground">com atividade hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* MRR Chart */}
      <Card className="border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-500" /> Faturamento Mensal (MRR)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
            </div>
          ) : (
            <div className="space-y-3">
              {months.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-12 text-right text-muted-foreground uppercase">{m.label}</span>
                  <div className="flex-1 h-7 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((m.value / chartMax) * 100, 8)}%` }}
                    >
                      <span className="text-[10px] font-black text-white">
                        R$ {m.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client breakdown */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" /> Receita por Cliente (Nível 4)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {clientRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente L4.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Cliente</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Gabinetes</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Receita</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientRows.map((r) => (
                    <TableRow key={r.id} className={r.bloqueado ? "opacity-50" : ""}>
                      <TableCell className="font-medium text-sm">{r.nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs font-black">{r.qtdGab}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-black">
                        R$ {r.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {r.bloqueado ? (
                          <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Ativo</Badge>
                        )}
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
  );
}
