import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Server, Users, Building2, Shield, Clock, Activity,
  CheckCircle, XCircle, Archive, Eye, FileText, CreditCard, Crown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatusSistema } from "@/components/admin/StatusSistema";
import { ContratosPanel } from "@/components/admin/ContratosPanel";
import { SubscricoesPanel } from "@/components/admin/SubscricoesPanel";
import { GerenciarAssinaturaModal } from "@/components/admin/GerenciarAssinaturaModal";
import { useAllSubscriptions } from "@/hooks/useSubscription";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AssinaturaTarget {
  gabineteId: string;
  gabineteNome: string;
}

export default function Sistema() {
  const { role } = useAuth();
  const [assinaturaTarget, setAssinaturaTarget] = useState<AssinaturaTarget | null>(null);
  const { data: allSubscriptions = [] } = useAllSubscriptions();

  // All gabinetes (profiles with admin role)
  const { data: gabinetes = [], isLoading: loadingGabinetes } = useQuery({
    queryKey: ["all-gabinetes"],
    queryFn: async () => {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (!adminRoles?.length) return [];
      const adminIds = adminRoles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", adminIds)
        .order("created_at", { ascending: false });
      return profiles ?? [];
    },
  });

  // Global eleitores count per gabinete
  const { data: eleitorStats = {} } = useQuery({
    queryKey: ["eleitor-stats-global"],
    queryFn: async () => {
      const { data } = await supabase
        .from("eleitores")
        .select("gabinete_id");
      const stats: Record<string, number> = {};
      (data ?? []).forEach((e: any) => {
        if (e.gabinete_id) stats[e.gabinete_id] = (stats[e.gabinete_id] || 0) + 1;
      });
      return stats;
    },
  });

  // Global audit logs
  const { data: auditLogs = [], isLoading: loadingAudit } = useQuery({
    queryKey: ["global-audit-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  // Backup exclusões (global deletion logs)
  const { data: exclusoes = [], isLoading: loadingExclusoes } = useQuery({
    queryKey: ["global-exclusoes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("backup_exclusoes")
        .select("*")
        .order("excluido_em", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  // Profile name map for logs
  const { data: profileMap = {} } = useQuery({
    queryKey: ["profile-map-sistema"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { map[p.id] = p.full_name; });
      return map;
    },
  });

  const activeGabinetes = gabinetes.filter((g: any) => g.is_active);
  const inactiveGabinetes = gabinetes.filter((g: any) => !g.is_active);

  const fmtDate = (d: string) => {
    try { return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR }); }
    catch { return d; }
  };

  if (role !== "super_admin") return <Navigate to="/" replace />;

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <Server className="h-5 w-5 text-purple-500" />
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px] font-bold uppercase tracking-wider">
            Nível 5 · Acesso Irrestrito
          </Badge>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-[-0.04em] text-foreground leading-[0.9]">
          Sistema
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Painel de controle SaaS — visão global de todos os gabinetes e dados do sistema.
        </p>
      </div>

      <Separator className="bg-purple-500/20" />

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="bg-purple-500/10">
          <TabsTrigger value="status" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs font-bold gap-1">
            <Activity className="h-3.5 w-3.5" /> Status
          </TabsTrigger>
          <TabsTrigger value="gabinetes" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs font-bold gap-1">
            <Building2 className="h-3.5 w-3.5" /> Gabinetes
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs font-bold gap-1">
            <Eye className="h-3.5 w-3.5" /> Logs Globais
          </TabsTrigger>
          <TabsTrigger value="contratos" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs font-bold gap-1">
            <FileText className="h-3.5 w-3.5" /> Contratos
          </TabsTrigger>
          <TabsTrigger value="assinaturas" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs font-bold gap-1">
            <CreditCard className="h-3.5 w-3.5" /> Assinaturas
          </TabsTrigger>
        </TabsList>

        {/* === STATUS TAB === */}
        <TabsContent value="status" className="space-y-4 animate-fade-up">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Building2 className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{activeGabinetes.length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Gabinetes Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Archive className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{inactiveGabinetes.length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Gabinetes Inativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{Object.values(eleitorStats).reduce((a: number, b: number) => a + b, 0)}</p>
                    <p className="text-xs text-muted-foreground font-medium">Eleitores Globais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Shield className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{exclusoes.length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Registros Arquivados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Existing StatusSistema component (storage + error logs) */}
          <StatusSistema />
        </TabsContent>

        {/* === GABINETES TAB === */}
        <TabsContent value="gabinetes" className="space-y-4 animate-fade-up">
          <Card className="border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-500" /> Todos os Gabinetes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingGabinetes ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : gabinetes.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Nenhum gabinete encontrado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Político</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Status</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Plano</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Eleitores</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider hidden lg:table-cell">Criado em</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Assinatura</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gabinetes.map((g: any) => {
                        const gabId = g.gabinete_id || g.id;
                        const sub = allSubscriptions.find((s) => s.gabinete_id === gabId);
                        const planLabel = sub?.plan_type === "gold" ? "Ouro" : sub?.plan_type === "silver" ? "Prata" : "Bronze";
                        const planColor = sub?.plan_type === "gold"
                          ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
                          : sub?.plan_type === "silver"
                          ? "text-slate-400 bg-slate-400/10 border-slate-400/20"
                          : "text-amber-700 bg-amber-700/10 border-amber-700/20";
                        return (
                          <TableRow key={g.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{g.full_name || "Sem nome"}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{g.id.slice(0, 8)}…</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {g.is_active ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
                                  <CheckCircle className="h-3 w-3" /> Ativo
                                </Badge>
                              ) : (
                                <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1">
                                  <XCircle className="h-3 w-3" /> Inativo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className={`text-[10px] font-bold gap-1 ${planColor}`}>
                                <Crown className="h-3 w-3" /> {planLabel}
                              </Badge>
                              {sub?.status === "active" && sub?.next_billing_date && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  até {fmtDate(sub.next_billing_date)}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm font-bold">{(eleitorStats as any)[gabId] || 0}</span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {fmtDate(g.created_at)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-[11px] font-bold border-purple-500/30 text-purple-600 hover:bg-purple-500/10 hover:text-purple-600 whitespace-nowrap"
                                onClick={() => setAssinaturaTarget({ gabineteId: gabId, gabineteNome: g.full_name || "Gabinete" })}
                              >
                                <Crown className="h-3 w-3" /> Assinatura
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
        </TabsContent>

        {/* === LOGS GLOBAIS TAB === */}
        <TabsContent value="logs" className="space-y-4 animate-fade-up">
          {/* Audit Logs */}
          <Card className="border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" /> Logs de Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAudit ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Nenhum log de auditoria.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Ação</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Usuário</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600">
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {(profileMap as any)[log.user_id] || log.user_id?.slice(0, 8) + "…"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                            {fmtDate(log.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deletion Logs */}
          <Card className="border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Archive className="h-4 w-4 text-purple-500" /> Registros Arquivados / Excluídos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingExclusoes ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : exclusoes.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Nenhum registro de exclusão.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Origem</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Dados</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Excluído por</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exclusoes.map((b: any) => {
                        const dados = b.dados_originais as any;
                        return (
                          <TableRow key={b.id}>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600">
                                {b.tabela_origem}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <p className="font-medium">{dados?.full_name || dados?.nome || "—"}</p>
                              <p className="text-[10px] text-muted-foreground">{dados?.email || dados?.whatsapp || ""}</p>
                            </TableCell>
                            <TableCell className="text-sm hidden sm:table-cell">
                              {b.excluido_por ? ((profileMap as any)[b.excluido_por] || b.excluido_por.slice(0, 8) + "…") : "Sistema"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                              {b.excluido_em ? fmtDate(b.excluido_em) : "—"}
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
        </TabsContent>
        {/* === CONTRATOS TAB === */}
        <TabsContent value="contratos" className="space-y-4 animate-fade-up">
          <ContratosPanel />
        </TabsContent>

        {/* === ASSINATURAS TAB === */}
        <TabsContent value="assinaturas" className="space-y-4 animate-fade-up">
          <SubscricoesPanel />
        </TabsContent>
      </Tabs>

      {assinaturaTarget && (
        <GerenciarAssinaturaModal
          open={!!assinaturaTarget}
          onOpenChange={(open) => { if (!open) setAssinaturaTarget(null); }}
          gabineteId={assinaturaTarget.gabineteId}
          gabineteNome={assinaturaTarget.gabineteNome}
          currentPlan={allSubscriptions.find(s => s.gabinete_id === assinaturaTarget.gabineteId)?.plan_type}
          currentStatus={allSubscriptions.find(s => s.gabinete_id === assinaturaTarget.gabineteId)?.status}
          currentExpiry={allSubscriptions.find(s => s.gabinete_id === assinaturaTarget.gabineteId)?.next_billing_date}
        />
      )}
    </div>
  );
}
