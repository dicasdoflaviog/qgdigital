import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, UserPlus, FileEdit, Landmark, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  "Criou Eleitor": { icon: UserPlus, color: "text-primary" },
  "Atualizou Eleitor": { icon: FileEdit, color: "text-warning" },
  "Criou Emenda": { icon: Landmark, color: "text-success" },
  "Criou Instituição": { icon: Building2, color: "text-info" },
};

export function ActivityFeed() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000, // poll every 30s for "real-time" feel
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <p className="text-xs text-muted-foreground">Carregando atividades...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-6 text-center">
        <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Nenhuma atividade registrada</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-1">
      <p className="text-xs font-medium text-foreground mb-3">Feed de Atividades</p>
      <div className="space-y-0">
        {logs.map((log, i) => {
          const config = ACTION_CONFIG[log.action] || { icon: Clock, color: "text-muted-foreground" };
          const Icon = config.icon;
          const details = (log.details as Record<string, any>) || {};
          const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR });

          return (
            <div key={log.id} className="flex gap-3 py-2.5 relative">
              {/* Timeline line */}
              {i < logs.length - 1 && (
                <div className="absolute left-[13px] top-[38px] bottom-0 w-px bg-border/60" />
              )}
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/80 ${config.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-snug">
                  <span className="font-medium">{log.action}</span>
                  {details.nome && <span className="text-muted-foreground"> — {details.nome}</span>}
                  {details.bairro && <span className="text-muted-foreground"> no {details.bairro}</span>}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
