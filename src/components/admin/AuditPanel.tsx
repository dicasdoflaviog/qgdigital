import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ScrollText, Filter, Clock, User, Activity, ChevronRight,
  Loader2, Users, Shield, FileText, Trash2, LogIn, PlusCircle, Pencil,
} from "lucide-react";

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  LOGIN: { label: "Login", icon: LogIn, color: "text-blue-500" },
  CADASTRO_ELEITOR: { label: "Cadastro de Eleitor", icon: PlusCircle, color: "text-emerald-500" },
  CRIAR_DEMANDA: { label: "Nova Demanda", icon: FileText, color: "text-qg-blue-500" },
  EDITAR_DEMANDA: { label: "Edição de Demanda", icon: Pencil, color: "text-amber-500" },
  DELETAR_DEMANDA: { label: "Exclusão de Demanda", icon: Trash2, color: "text-destructive" },
  EXPORT_DATA: { label: "Exportação de Dados", icon: FileText, color: "text-orange-500" },
};

const ACTION_OPTIONS = [
  { value: "all", label: "Todas as ações" },
  { value: "LOGIN", label: "Login" },
  { value: "CADASTRO_ELEITOR", label: "Cadastro de Eleitor" },
  { value: "CRIAR_DEMANDA", label: "Nova Demanda" },
  { value: "EDITAR_DEMANDA", label: "Edição de Demanda" },
  { value: "DELETAR_DEMANDA", label: "Exclusão" },
  { value: "EXPORT_DATA", label: "Exportação" },
];

const DATE_OPTIONS = [
  { value: "all", label: "Todo o período" },
  { value: "1h", label: "Última hora" },
  { value: "24h", label: "Últimas 24h" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
];

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  usuario_nome: string | null;
  role_level: number | null;
  gabinete_nome: string | null;
  acao: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export function AuditPanel() {
  const [filterAction, setFilterAction] = useState("all");
  const [filterDate, setFilterDate] = useState("24h");
  const [filterClient, setFilterClient] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // L4 users for client filter
  const { data: l4Users = [] } = useQuery({
    queryKey: ["l4-users-audit"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id").eq("role_level", 4);
      if (!data?.length) return [];
      const ids = data.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      return profiles ?? [];
    },
  });

  // Audit logs with filters
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", filterAction, filterDate, filterClient],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterAction !== "all") {
        query = query.or(`action.eq.${filterAction},acao.eq.${filterAction}`);
      }

      if (filterDate !== "all") {
        const now = new Date();
        const offsets: Record<string, number> = { "1h": 3600000, "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
        const since = new Date(now.getTime() - (offsets[filterDate] || 86400000)).toISOString();
        query = query.gte("created_at", since);
      }

      const { data } = await query;
      let results = (data ?? []) as unknown as AuditLog[];

      // Client-side filter by L4 gabinete_nome
      if (filterClient !== "all") {
        const clientName = l4Users.find((u: any) => u.id === filterClient)?.full_name;
        if (clientName) {
          results = results.filter((l) => l.gabinete_nome === clientName);
        }
      }

      return results;
    },
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  // Online users (last_sign_in within 15 minutes)
  const { data: onlineCount = 0 } = useQuery({
    queryKey: ["online-users-count"],
    queryFn: async () => {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_sign_in", fifteenMinAgo)
        .eq("is_active", true);
      return count ?? 0;
    },
    refetchInterval: 60000,
  });

  const getActionInfo = (log: AuditLog) => {
    const key = log.acao || log.action || "";
    return ACTION_LABELS[key] || { label: key || "Ação", icon: Activity, color: "text-muted-foreground" };
  };

  const formatDetails = (details: Record<string, any> | null): string[] => {
    if (!details) return [];
    return Object.entries(details).map(([key, val]) => {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return `${label}: ${typeof val === "object" ? JSON.stringify(val) : val}`;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with online badge */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-qg-blue-500" />
          <h3 className="text-sm font-medium">Logs do Sistema</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-600">{onlineCount} online</span>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {logs.length} registros
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-qg-blue-500/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Tipo de ação" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {DATE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Cliente L4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos os clientes</SelectItem>
                {l4Users.map((u: any) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">{u.full_name || u.id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-qg-blue-500/20">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando logs…
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum log encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => {
                const info = getActionInfo(log);
                const Icon = info.icon;
                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted/80 shrink-0`}>
                      <Icon className={`h-4 w-4 ${info.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">{log.usuario_nome || "Usuário"}</span>
                        {log.role_level && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-qg-blue-500/30 text-qg-blue-600">
                            L{log.role_level}
                          </Badge>
                        )}
                        {log.gabinete_nome && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {log.gabinete_nome}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {info.label}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <> — {formatDetails(log.details).slice(0, 1).join("")}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("pt-BR", {
                          day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(v) => { if (!v) setSelectedLog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-qg-blue-500" /> Detalhes do Log
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[10px] text-muted-foreground font-medium">Usuário</p>
                  <p className="text-sm font-medium">{selectedLog.usuario_nome || "—"}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[10px] text-muted-foreground font-medium">Nível</p>
                  <p className="text-sm font-medium">L{selectedLog.role_level ?? "?"}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[10px] text-muted-foreground font-medium">Gabinete</p>
                  <p className="text-sm font-medium">{selectedLog.gabinete_nome || "—"}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[10px] text-muted-foreground font-medium">Ação</p>
                  <p className="text-sm font-medium">{getActionInfo(selectedLog).label}</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Data / Hora</p>
                <p className="text-sm font-medium">
                  {new Date(selectedLog.created_at).toLocaleString("pt-BR", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                  })}
                </p>
              </div>

              {selectedLog.ip_address && (
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[10px] text-muted-foreground font-medium">IP</p>
                  <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-2">Detalhes</p>
                {selectedLog.details && Object.keys(selectedLog.details).length > 0 ? (
                  <div className="space-y-1.5">
                    {formatDetails(selectedLog.details).map((line, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-border">
                        <span className="text-xs text-foreground">{line}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum detalhe adicional.</p>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">ID do Registro</p>
                <p className="text-[10px] font-mono text-muted-foreground break-all">{selectedLog.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
