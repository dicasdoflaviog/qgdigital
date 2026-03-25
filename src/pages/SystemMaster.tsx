import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useContratos, useUpsertContrato, ContratoNacional } from "@/hooks/useContratos";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Users, Globe, MapPin, CheckCircle, XCircle,
  Pencil, Loader2, BarChart3, AlertTriangle, Lock, DollarSign, ToggleRight, TrendingUp, ScrollText, Cpu, Trash2, Palette,
} from "lucide-react";
import { useState, useMemo } from "react";
import { FinanceiroPanel } from "@/components/admin/FinanceiroPanel";
import { MRRPanel } from "@/components/admin/MRRPanel";
import { FeatureFlagsPanel } from "@/components/admin/FeatureFlagsPanel";
import { GestaoClientesPanel } from "@/components/admin/GestaoClientesPanel";
import { AuditPanel } from "@/components/admin/AuditPanel";
import { SkillsManagerPanel } from "@/components/admin/SkillsManagerPanel";
import { RecuperacaoDadosPanel } from "@/components/admin/RecuperacaoDadosPanel";
import { LayoutConfigPanel } from "@/components/admin/LayoutConfigPanel";

const TODOS_ESTADOS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const ESCOPO_OPTIONS = ["Regional", "Estadual", "Nacional"];

export default function SystemMaster() {
  const { role, roleLevel } = useAuth();

  // --- Data ---
  const { data: contratos = [], isLoading: loadingContratos } = useContratos();
  const upsertContrato = useUpsertContrato();

  // L4 users
  const { data: l4Users = [] } = useQuery({
    queryKey: ["l4-users-master"],
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

  // Global eleitores count
  const { data: totalEleitores = 0 } = useQuery({
    queryKey: ["total-eleitores-global"],
    queryFn: async () => {
      const { count } = await supabase
        .from("eleitores")
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  // Eleitores per estado for bar chart
  const { data: eleitoresPorEstado = [] } = useQuery({
    queryKey: ["eleitores-por-estado"],
    queryFn: async () => {
      const { data } = await supabase
        .from("eleitores")
        .select("estado");
      const map: Record<string, number> = {};
      (data ?? []).forEach((e: any) => {
        const uf = e.estado || "BA";
        map[uf] = (map[uf] || 0) + 1;
      });
      return Object.entries(map)
        .map(([estado, total]) => ({ estado, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    },
  });

  // Security logs (unauthorized access attempts)
  const { data: securityLogs = [] } = useQuery({
    queryKey: ["security-access-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("error_logs" as any)
        .select("*")
        .eq("context", "UNAUTHORIZED_STATE_ACCESS")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as any[];
    },
  });

  // Profile map
  const { data: profileMap = {} } = useQuery({
    queryKey: ["profile-map-master"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { map[p.id] = p.full_name; });
      return map;
    },
  });

  // --- Contract editing ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    user_id: string;
    escopo_geografico: string;
    estados_autorizados: string[];
    limite_gabinetes: number;
    ativo: boolean;
  } | null>(null);

  const contratoMap = useMemo(() => {
    const m: Record<string, ContratoNacional> = {};
    contratos.forEach((c) => { if (c.user_id) m[c.user_id] = c; });
    return m;
  }, [contratos]);

  const openEdit = (userId: string) => {
    const existing = contratoMap[userId];
    if (existing) {
      setEditingId(existing.id);
      setEditForm({
        user_id: existing.user_id,
        escopo_geografico: existing.escopo_geografico,
        estados_autorizados: existing.estados_autorizados ?? [],
        limite_gabinetes: existing.limite_gabinetes,
        ativo: existing.ativo,
      });
    } else {
      setEditingId("new");
      setEditForm({
        user_id: userId,
        escopo_geografico: "Regional",
        estados_autorizados: ["BA"],
        limite_gabinetes: 10,
        ativo: true,
      });
    }
  };

  const toggleEstado = (uf: string) => {
    if (!editForm) return;
    const current = editForm.estados_autorizados;
    setEditForm({
      ...editForm,
      estados_autorizados: current.includes(uf)
        ? current.filter((e) => e !== uf)
        : [...current, uf],
    });
  };

  const handleSave = async () => {
    if (!editForm || !editForm.user_id) {
      toast({ title: "Erro", description: "Usuário não selecionado", variant: "destructive" });
      return;
    }
    try {
      await upsertContrato.mutateAsync({
        user_id: editForm.user_id,
        escopo_geografico: editForm.escopo_geografico,
        estados_autorizados: editForm.estados_autorizados,
        limite_gabinetes: editForm.limite_gabinetes,
        ativo: editForm.ativo,
      });
      toast({ title: "Contrato salvo! ✅" });
      setEditingId(null);
      setEditForm(null);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err?.message, variant: "destructive" });
    }
  };

  // Bar chart max for scaling
  const barMax = Math.max(...eleitoresPorEstado.map((e) => e.total), 1);

  if (roleLevel !== 5 && role !== "super_admin") return <Navigate to="/" replace />;

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-purple-500" />
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px] font-bold tracking-wider">
            Nível 5 · System Master
          </Badge>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-[-0.04em] text-foreground leading-[0.9]">
          System Master
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Gestão centralizada de contratos geográficos, monitoramento global e segurança do sistema.
        </p>
      </div>

      <Tabs defaultValue="painel" className="space-y-4">
        <TabsList className="w-full flex flex-wrap gap-1">
          <TabsTrigger value="painel" className="text-xs font-bold tracking-wider">Painel</TabsTrigger>
          <TabsTrigger value="clientes" className="text-xs font-bold tracking-wider gap-1">
            <Users className="h-3 w-3" /> Clientes
          </TabsTrigger>
          <TabsTrigger value="skills" className="text-xs font-bold tracking-wider gap-1">
            <Cpu className="h-3 w-3" /> Skills
          </TabsTrigger>
          <TabsTrigger value="mrr" className="text-xs font-bold tracking-wider gap-1">
            <TrendingUp className="h-3 w-3" /> MRR
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="text-xs font-bold tracking-wider gap-1">
            <DollarSign className="h-3 w-3" /> Faturamento
          </TabsTrigger>
          <TabsTrigger value="flags" className="text-xs font-bold tracking-wider gap-1">
            <ToggleRight className="h-3 w-3" /> Recursos
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="text-xs font-bold tracking-wider gap-1">
            <ScrollText className="h-3 w-3" /> Logs
          </TabsTrigger>
          <TabsTrigger value="recuperacao" className="text-xs font-bold tracking-wider gap-1">
            <Trash2 className="h-3 w-3" /> Lixeira
          </TabsTrigger>
          <TabsTrigger value="layout" className="text-xs font-bold tracking-wider gap-1">
            <Palette className="h-3 w-3" /> Layout
          </TabsTrigger>
        </TabsList>

        <TabsContent value="painel" className="space-y-6">
      <Separator className="bg-purple-500/20" />

      {/* === MONITORAMENTO GLOBAL === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-medium">{totalEleitores.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground font-bold tracking-wider">Eleitores no Sistema</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <Globe className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-medium">{contratos.filter((c) => c.ativo).length}</p>
                <p className="text-xs text-muted-foreground font-bold tracking-wider">Contratos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-3xl font-medium">{securityLogs.length}</p>
                <p className="text-xs text-muted-foreground font-bold tracking-wider">Alertas de Segurança</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === TOP 5 ESTADOS - BAR CHART === */}
      <Card className="border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-wider flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-500" /> Top 5 Estados com Mais Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eleitoresPorEstado.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem dados por estado ainda.</p>
          ) : (
            <div className="space-y-3">
              {eleitoresPorEstado.map((item, i) => (
                <div key={item.estado} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-6 text-right text-muted-foreground">{i + 1}º</span>
                  <Badge variant="outline" className="text-[10px] w-8 justify-center border-purple-500/30 text-purple-600">
                    {item.estado}
                  </Badge>
                  <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((item.total / barMax) * 100, 8)}%` }}
                    >
                      <span className="text-[10px] font-medium text-white">{item.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* === GESTÃO DE CONTRATOS L4 === */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-sm font-bold tracking-wider flex items-center gap-2">
            <MapPin className="h-4 w-4 text-purple-500" /> Gestão de Escopo Geográfico — Usuários Nível 4
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {l4Users.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum usuário Nível 4 cadastrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-xs tracking-wider">Usuário L4</TableHead>
                    <TableHead className="font-bold text-xs tracking-wider hidden sm:table-cell">Status</TableHead>
                    <TableHead className="font-bold text-xs tracking-wider hidden md:table-cell">Escopo</TableHead>
                    <TableHead className="font-bold text-xs tracking-wider hidden md:table-cell">Estados</TableHead>
                    <TableHead className="font-bold text-xs tracking-wider hidden lg:table-cell">Limite</TableHead>
                    <TableHead className="font-bold text-xs tracking-wider w-36">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {l4Users.map((u: any) => {
                    const c = contratoMap[u.id];
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{u.full_name || u.id.slice(0, 8) + "…"}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {c?.ativo ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
                              <CheckCircle className="h-3 w-3" /> Ativo
                            </Badge>
                          ) : c ? (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1">
                              <XCircle className="h-3 w-3" /> Inativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">Sem contrato</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {c ? (
                            <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600">
                              <Globe className="h-3 w-3 mr-1" />{c.escopo_geografico}
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {c?.estados_autorizados?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {c.estados_autorizados.slice(0, 4).map((uf) => (
                                <Badge key={uf} variant="secondary" className="text-[9px] px-1.5 py-0">{uf}</Badge>
                              ))}
                              {c.estados_autorizados.length > 4 && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                  +{c.estados_autorizados.length - 4}
                                </Badge>
                              )}
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm font-bold">{c?.limite_gabinetes ?? "—"}</span>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-[10px] font-bold tracking-wider"
                            onClick={() => openEdit(u.id)}>
                            <Pencil className="h-3 w-3" /> Configurar Escopo
                          </Button>
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

      {/* === SECURITY LOGS === */}
      {securityLogs.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-wider flex items-center gap-2 text-destructive">
              <Lock className="h-4 w-4" /> Log de Tentativas de Acesso Indevido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-xs tracking-wider">Usuário</TableHead>
                    <TableHead className="font-bold text-xs tracking-wider">Detalhes</TableHead>
                    <TableHead className="font-bold text-xs tracking-wider hidden sm:table-cell">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {(profileMap as any)[log.user_id] || log.user_id?.slice(0, 8) + "…"}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-destructive font-medium">{log.message}</p>
                        {log.details?.attempted_estado && (
                          <Badge variant="destructive" className="text-[9px] mt-1">
                            Estado: {log.details.attempted_estado}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === EDIT MODAL === */}
      <Dialog open={!!editingId} onOpenChange={(v) => { if (!v) { setEditingId(null); setEditForm(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">
              Configurar escopo geográfico
            </DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold tracking-wider">Usuário</Label>
                <p className="text-sm font-medium">{(profileMap as any)[editForm.user_id] || editForm.user_id.slice(0, 8)}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold tracking-wider">Escopo Geográfico</Label>
                <Select value={editForm.escopo_geografico} onValueChange={(v) => setEditForm({ ...editForm, escopo_geografico: v })}>
                  <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESCOPO_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold tracking-wider">Estados Autorizados</Label>
                <div className="grid grid-cols-6 gap-1.5 max-h-[200px] overflow-y-auto p-1">
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
                <p className="text-[10px] text-muted-foreground">
                  {editForm.estados_autorizados.length} estado(s) selecionado(s)
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold tracking-wider">Limite de Gabinetes</Label>
                <Input type="number" min={1} max={1000} value={editForm.limite_gabinetes}
                  onChange={(e) => setEditForm({ ...editForm, limite_gabinetes: parseInt(e.target.value) || 10 })}
                  className="min-h-[44px]" />
              </div>

              <div className="flex items-center justify-between border border-border p-3 rounded-xl">
                <div>
                  <p className="text-sm font-bold">Contrato Ativo</p>
                  <p className="text-xs text-muted-foreground">Desativar bloqueia o acesso ao mapa nacional</p>
                </div>
                <Switch checked={editForm.ativo} onCheckedChange={(v) => setEditForm({ ...editForm, ativo: v })} />
              </div>

              <Button onClick={handleSave} disabled={upsertContrato.isPending}
                className="w-full min-h-[48px] text-sm font-bold tracking-wider rounded-full">
                {upsertContrato.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar Contrato
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="clientes">
          <GestaoClientesPanel />
        </TabsContent>

        <TabsContent value="skills">
          <SkillsManagerPanel />
        </TabsContent>

        <TabsContent value="mrr">
          <MRRPanel />
        </TabsContent>

        <TabsContent value="financeiro">
          <FinanceiroPanel />
        </TabsContent>

        <TabsContent value="flags">
          <FeatureFlagsPanel />
        </TabsContent>

        <TabsContent value="auditoria">
          <AuditPanel />
        </TabsContent>

        <TabsContent value="recuperacao">
          <RecuperacaoDadosPanel />
        </TabsContent>

        <TabsContent value="layout">
          <LayoutConfigPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
