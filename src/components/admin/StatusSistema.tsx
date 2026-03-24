import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HardDrive, AlertTriangle, RefreshCw, Clock, User, FileWarning, Sparkles, Loader2, X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface ErrorLog {
  id: string;
  user_id: string | null;
  message: string;
  details: any;
  context: string;
  created_at: string;
}

export function StatusSistema() {
  const [storageUsedMB, setStorageUsedMB] = useState(0);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [diagnosing, setDiagnosing] = useState<string | null>(null);
  const [diagnoses, setDiagnoses] = useState<Record<string, string>>({});

  const STORAGE_LIMIT_MB = 1024;

  const fetchData = async () => {
    setLoading(true);
    try {
      let totalBytes = 0;
      const buckets = ["demandas-fotos", "demandas-arquivos"];
      for (const bucket of buckets) {
        try {
          const { data: files } = await supabase.storage
            .from(bucket)
            .list("", { limit: 1000 });
          if (files) {
            for (const f of files) {
              totalBytes += ((f.metadata as any)?.size || 0);
            }
          }
          const { data: nested } = await supabase.storage
            .from(bucket)
            .list("demandas", { limit: 1000 });
          if (nested) {
            for (const f of nested) {
              totalBytes += ((f.metadata as any)?.size || 0);
            }
          }
        } catch { /* skip bucket errors */ }
      }

      try {
        const { data: oficioFiles } = await supabase.storage
          .from("oficios-documentos")
          .list("", { limit: 1000 });
        if (oficioFiles) {
          for (const f of oficioFiles) {
            totalBytes += ((f.metadata as any)?.size || 0);
          }
        }
      } catch { /* skip */ }

      setStorageUsedMB(Math.round((totalBytes / (1024 * 1024)) * 100) / 100);

      const { data: logs } = await supabase
        .from("error_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20) as any;

      const logData = (logs ?? []) as ErrorLog[];
      setErrorLogs(logData);

      const userIds = [...new Set(logData.map((l) => l.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds as string[]);
        const map: Record<string, string> = {};
        (profiles ?? []).forEach((p: any) => { map[p.id] = p.full_name; });
        setProfileMap(map);
      }
    } catch (err) {
      console.error("StatusSistema fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDiagnose = async (log: ErrorLog) => {
    setDiagnosing(log.id);
    try {
      const { data, error } = await supabase.functions.invoke("diagnose-error", {
        body: {
          message: log.message,
          details: log.details,
          context: log.context,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }

      setDiagnoses((prev) => ({ ...prev, [log.id]: data.diagnosis }));
    } catch (err: any) {
      toast({
        title: "Erro ao diagnosticar",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDiagnosing(null);
    }
  };

  const storagePct = Math.min((storageUsedMB / STORAGE_LIMIT_MB) * 100, 100);
  const storageColor = storagePct > 80 ? "text-destructive" : storagePct > 50 ? "text-warning" : "text-primary";

  return (
    <div className="space-y-4">
      {/* Storage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" />
            Supabase Storage
            <Badge variant="secondary" className="text-[10px] font-medium">
              Limite: 1 GB
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Espaço ocupado</span>
            <span className={`text-sm font-medium ${storageColor}`}>
              {storageUsedMB} MB / {STORAGE_LIMIT_MB} MB
            </span>
          </div>
          <Progress value={storagePct} className="h-2.5" />
          {storagePct > 70 && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Atenção: considere arquivar mídias no Google Drive.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-destructive" />
              Logs de Erros
              {errorLogs.length > 0 && (
                <Badge variant="destructive" className="text-[10px]">{errorLogs.length}</Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="gap-1 text-xs">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando logs...</p>
          ) : errorLogs.length === 0 ? (
            <div className="text-center py-6 space-y-1">
              <p className="text-sm font-medium text-foreground">✅ Nenhum erro registrado</p>
              <p className="text-xs text-muted-foreground">O sistema está operando normalmente.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {errorLogs.map((log) => (
                <div key={log.id} className="border border-border rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground leading-tight">{log.message}</p>
                    <Badge variant="outline" className="text-[9px] shrink-0">{log.context || "geral"}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {log.user_id ? (profileMap[log.user_id] || "Usuário") : "Sistema"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <pre className="text-[10px] text-muted-foreground bg-muted p-1.5 rounded-2xl overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}

                  {/* AI Diagnosis */}
                  {diagnoses[log.id] ? (
                    <div className="relative bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1 animate-fade-up">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[10px] font-medium text-primary">Diagnóstico IA</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => setDiagnoses((prev) => {
                            const next = { ...prev };
                            delete next[log.id];
                            return next;
                          })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="prose prose-sm max-w-none text-xs text-foreground [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:text-xs [&_li]:text-xs [&_code]:text-[10px] [&_pre]:text-[10px] [&_pre]:bg-muted [&_pre]:rounded-2xl">
                        <ReactMarkdown>{diagnoses[log.id]}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs font-medium h-9 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
                      onClick={() => handleDiagnose(log)}
                      disabled={diagnosing === log.id}
                    >
                      {diagnosing === log.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Diagnosticar com IA
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
