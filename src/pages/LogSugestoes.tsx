import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Archive, MessageSquarePlus, Filter, Loader2, Rocket, Code2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type FeedbackStatus = "pendente" | "interessante" | "em_desenvolvimento" | "implementado" | "descartado";

interface Feedback {
  id: string;
  user_id: string;
  content: string;
  status: string;
  created_at: string;
}

interface ProfileBasic {
  id: string;
  full_name: string;
}

export default function LogSugestoes() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"todos" | "interessantes" | "em_desenvolvimento">("todos");

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ["feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Feedback[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-feedbacks"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      return data || [];
    },
  });

  const profileMap = useMemo(() => {
    const map: Record<string, string> = {};
    (profiles as ProfileBasic[]).forEach((p) => { map[p.id] = p.full_name; });
    return map;
  }, [profiles]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FeedbackStatus }) => {
      const { error } = await supabase.from("feedbacks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["pending-feedbacks-count"] });
      const labels: Record<string, string> = {
        interessante: "⭐ Marcado como Interessante",
        em_desenvolvimento: "🛠️ Em Desenvolvimento",
        implementado: "✅ Marcado como Implementado",
        descartado: "📦 Arquivado",
      };
      toast({ title: labels[variables.status] || "Status atualizado!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    const list = feedbacks.filter((f) => f.status !== "descartado");
    if (filter === "interessantes") return list.filter((f) => f.status === "interessante");
    if (filter === "em_desenvolvimento") return list.filter((f) => f.status === "em_desenvolvimento");
    return list;
  }, [feedbacks, filter]);

  // Redirect non-super_admin
  if (role !== "super_admin") {
    navigate("/", { replace: true });
    return null;
  }

  const statusConfig: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
    pendente: { label: "Pendente", color: "bg-warning/15 text-warning-foreground border-warning/30" },
    interessante: { label: "Interessante", color: "bg-primary/10 text-primary border-primary/30", icon: <Star className="h-3 w-3 mr-1 fill-current" /> },
    em_desenvolvimento: { label: "Em Desenvolvimento", color: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30", icon: <Code2 className="h-3 w-3 mr-1" /> },
    implementado: { label: "Implementado", color: "bg-success/15 text-success border-success/30", icon: <Rocket className="h-3 w-3 mr-1" /> },
  };

  const activeCount = feedbacks.filter((f) => f.status !== "descartado").length;
  const interessanteCount = feedbacks.filter((f) => f.status === "interessante").length;
  const devCount = feedbacks.filter((f) => f.status === "em_desenvolvimento").length;

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      <div>
        <h1 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
            <MessageSquarePlus className="h-4 w-4" />
          </div>
          Log de Sugestões
        </h1>
        <p className="text-xs font-medium text-muted-foreground mt-1">
          Feedbacks da equipe para o roadmap do QG Digital
        </p>
      </div>

      <div className="border-t border-border" />

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="w-full grid grid-cols-3 h-11 p-1">
          <TabsTrigger value="todos" className="text-xs font-medium gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full rounded-full overflow-hidden">
            <Filter className="h-4 w-4 shrink-0" />
            {filter === "todos" && <span className="truncate">Todos ({activeCount})</span>}
          </TabsTrigger>
          <TabsTrigger value="interessantes" className="text-xs font-medium gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full rounded-full overflow-hidden">
            <Star className="h-4 w-4 shrink-0" />
            {filter === "interessantes" && <span className="truncate">Interessantes ({interessanteCount})</span>}
          </TabsTrigger>
          <TabsTrigger value="em_desenvolvimento" className="text-xs font-medium gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full rounded-full overflow-hidden">
            <Code2 className="h-4 w-4 shrink-0" />
            {filter === "em_desenvolvimento" && <span className="truncate">Dev ({devCount})</span>}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquarePlus className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma sugestão encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fb) => {
            const sc = statusConfig[fb.status] || statusConfig.pendente;
            return (
              <Card
                key={fb.id}
                className={`transition-all duration-300 ${
                  fb.status === "interessante" ? "border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.1)]" :
                  fb.status === "em_desenvolvimento" ? "border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.1)]" : ""
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {profileMap[fb.user_id] || "Usuário desconhecido"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {format(new Date(fb.created_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium shrink-0 ${sc.color}`}
                    >
                      {sc.icon}
                      {sc.label}
                    </Badge>
                  </div>

                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap line-clamp-3">{fb.content}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {fb.status === "pendente" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs font-medium min-h-[36px]"
                        onClick={() => updateStatus.mutate({ id: fb.id, status: "interessante" })}
                      >
                        <Star className="h-3.5 w-3.5" /> Interessante
                      </Button>
                    )}
                    {(fb.status === "pendente" || fb.status === "interessante") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs font-medium min-h-[36px]"
                        onClick={() => updateStatus.mutate({ id: fb.id, status: "em_desenvolvimento" })}
                      >
                        <Code2 className="h-3.5 w-3.5" /> Em Dev
                      </Button>
                    )}
                    {(fb.status === "interessante" || fb.status === "em_desenvolvimento") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs font-medium min-h-[36px]"
                        onClick={() => updateStatus.mutate({ id: fb.id, status: "implementado" })}
                      >
                        <Rocket className="h-3.5 w-3.5" /> Implementado
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs font-medium text-muted-foreground min-h-[36px]"
                      onClick={() => updateStatus.mutate({ id: fb.id, status: "descartado" })}
                    >
                      <Archive className="h-3.5 w-3.5" /> Arquivar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}