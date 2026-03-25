import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, Trophy, Brain, Send,
  ArrowLeftRight, Loader2, Sparkles, Megaphone, Users, CheckCircle2, Activity,
  FileText,
} from "lucide-react";
import { generateIntelligenceReport } from "@/lib/intelligenceReportGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface CityStats {
  cidade: string;
  total_eleitores: number;
  total_demandas: number;
  demandas_resolvidas: number;
  demandas_pendentes: number;
  gabinetes: number;
}

export default function ObservatorioBi() {
  const { role, roleLevel, user } = useAuth();
  const queryClient = useQueryClient();

  const [cidadeA, setCidadeA] = useState<string>("");
  const [cidadeB, setCidadeB] = useState<string>("");
  const [diretrizOpen, setDiretrizOpen] = useState(false);
  const [diretrizMsg, setDiretrizMsg] = useState("");
  const [sendingDiretriz, setSendingDiretriz] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Fetch all cities from resumo view
  const { data: resumoGabinetes = [], isLoading: loadingResumo } = useQuery({
    queryKey: ["resumo-gabinetes-bi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumo_gabinetes_por_cidade" as any)
        .select("*");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Recent activity per gabinete (last 7 days)
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["recent-activity-bi"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase
        .from("eleitores")
        .select("gabinete_id, created_at")
        .gte("created_at", sevenDaysAgo);
      return data ?? [];
    },
  });

  // Gabinete names
  const { data: gabineteNames = {} } = useQuery({
    queryKey: ["gabinete-names-bi"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      const m: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { m[p.id] = p.full_name; });
      return m;
    },
  });

  // AI Sentiment — Pauta da Semana
  const { data: pautaSemana, isLoading: loadingPauta, refetch: refetchPauta } = useQuery({
    queryKey: ["pauta-semana-bi"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: demandas } = await supabase
        .from("demandas")
        .select("categoria, descricao, bairro, created_at")
        .gte("created_at", sevenDaysAgo)
        .limit(100);

      const { data: fnData, error } = await supabase.functions.invoke("sentiment-analysis", {
        body: { demandas: demandas ?? [], regiao: "Região monitorada" },
      });
      if (error) throw error;
      return fnData?.pauta || "Sem dados suficientes para análise.";
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Aggregate by city
  const cityStats = useMemo<CityStats[]>(() => {
    const map: Record<string, CityStats> = {};
    resumoGabinetes.forEach((r: any) => {
      const c = r.cidade || "Sem cidade";
      if (!map[c]) {
        map[c] = { cidade: c, total_eleitores: 0, total_demandas: 0, demandas_resolvidas: 0, demandas_pendentes: 0, gabinetes: 0 };
      }
      map[c].total_eleitores += Number(r.total_eleitores || 0);
      map[c].total_demandas += Number(r.total_demandas || 0);
      map[c].demandas_resolvidas += Number(r.demandas_resolvidas || 0);
      map[c].demandas_pendentes += Number(r.demandas_pendentes || 0);
      map[c].gabinetes += 1;
    });
    return Object.values(map).sort((a, b) => b.total_eleitores - a.total_eleitores);
  }, [resumoGabinetes]);

  const cidades = cityStats.map((c) => c.cidade);

  // Top 3 Destaque & Top 3 Alerta
  const { top3, alerta3 } = useMemo(() => {
    const gabMap: Record<string, number> = {};
    recentActivity.forEach((e: any) => {
      if (e.gabinete_id) gabMap[e.gabinete_id] = (gabMap[e.gabinete_id] || 0) + 1;
    });
    const sorted = Object.entries(gabMap)
      .map(([id, count]) => ({ id, count, nome: gabineteNames[id] || id.slice(0, 8) }))
      .sort((a, b) => b.count - a.count);

    const allGabIds = new Set(resumoGabinetes.map((r: any) => r.gabinete_id).filter(Boolean));
    const activeIds = new Set(Object.keys(gabMap));
    const inactiveGabs = [...allGabIds]
      .filter((id) => !activeIds.has(id as string))
      .map((id) => ({ id: id as string, count: 0, nome: gabineteNames[id as string] || (id as string).slice(0, 8) }));

    return {
      top3: sorted.slice(0, 3),
      alerta3: [...sorted.slice(-3).reverse(), ...inactiveGabs].slice(0, 3),
    };
  }, [recentActivity, gabineteNames, resumoGabinetes]);

  if (roleLevel < 4) return <Navigate to="/" replace />;

  const compA = cityStats.find((c) => c.cidade === cidadeA);
  const compB = cityStats.find((c) => c.cidade === cidadeB);

  // Disparar Diretriz
  const handleDisparar = async () => {
    if (!diretrizMsg.trim()) {
      toast({ title: "Mensagem vazia", variant: "destructive" });
      return;
    }
    setSendingDiretriz(true);
    try {
      // Get all L3 (admin) users
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (!adminRoles?.length) {
        toast({ title: "Nenhum vereador encontrado", variant: "destructive" });
        setSendingDiretriz(false);
        return;
      }

      const notifications = adminRoles.map((r) => ({
        user_id: r.user_id,
        title: "📢 Diretriz Regional",
        message: diretrizMsg,
        type: "diretriz",
        metadata: { from_user: user?.id, sent_at: new Date().toISOString() },
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user?.id || "",
        action: "DISPARAR_DIRETRIZ",
        acao: "DISPARAR_DIRETRIZ",
        details: { mensagem: diretrizMsg, destinatarios: adminRoles.length },
      } as any);

      toast({ title: `Diretriz enviada para ${adminRoles.length} vereador(es)! 📢` });
      setDiretrizMsg("");
      setDiretrizOpen(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err?.message, variant: "destructive" });
    }
    setSendingDiretriz(false);
  };

  // Generate Intelligence Report
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const profile = await supabase.from("profiles").select("full_name").eq("id", user?.id || "").single();
      await generateIntelligenceReport({
        cidadeFoco: cidadeA || undefined,
        userId: user?.id || "",
        userName: profile.data?.full_name || user?.email || "Usuário",
      });
      toast({ title: "Relatório gerado com sucesso! 📄", description: `Região: ${cidadeA || "Todas"}` });
    } catch (err: any) {
      toast({ title: "Erro ao gerar relatório", description: err?.message, variant: "destructive" });
    }
    setGeneratingReport(false);
  };

  const chartData = cityStats.slice(0, 8).map((c) => ({
    cidade: c.cidade.length > 12 ? c.cidade.slice(0, 12) + "…" : c.cidade,
    eleitores: c.total_eleitores,
    demandas: c.total_demandas,
  }));

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2, 220 70% 50%))",
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-5 w-5 text-primary" />
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold tracking-wider">
            Nível {roleLevel} · Observatório BI
          </Badge>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-[-0.04em] text-foreground leading-[0.9]">
          Observatório BI
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Análise macro-regional de performance, sentimento e inteligência territorial.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setDiretrizOpen(true)} className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          <Megaphone className="h-4 w-4" /> Disparar Diretriz
        </Button>
        <Button
          onClick={handleGenerateReport}
          disabled={generatingReport}
          variant="outline"
          className="gap-2"
        >
          {generatingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Gerar Relatório de Inteligência
        </Button>
      </div>

      {/* === PERFORMANCE CHART === */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-wider flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Desempenho por Cidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingResumo ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados disponíveis.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="cidade" className="text-[10px]" tick={{ fontSize: 10 }} />
                <YAxis className="text-[10px]" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
                  labelStyle={{ fontWeight: 700, fontSize: 12 }}
                />
                <Bar dataKey="eleitores" name="Eleitores" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="demandas" name="Demandas" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* === TOP 3 & ALERTA 3 === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold tracking-wider flex items-center gap-2 text-emerald-600">
              <Trophy className="h-4 w-4" /> Top 3 Gabinetes Destaque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {top3.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem atividade recente.</p>
            ) : top3.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg bg-emerald-500/5">
                <span className="text-lg font-medium text-emerald-600 w-6 text-center">{i + 1}º</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{g.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{g.count} cadastros nos últimos 7 dias</p>
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold tracking-wider flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Top 3 Gabinetes em Alerta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerta3.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem alertas.</p>
            ) : alerta3.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg bg-destructive/5">
                <span className="text-lg font-medium text-destructive w-6 text-center">{i + 1}º</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{g.nome}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {g.count === 0 ? "Sem atividade nos últimos 7 dias" : `Apenas ${g.count} cadastros recentes`}
                  </p>
                </div>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* === PAUTA DA SEMANA (IA) === */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-wider flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> Pauta da Semana — Análise de IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPauta ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Analisando demandas da região...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-background border">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground leading-relaxed">{pautaSemana}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchPauta()} className="text-xs gap-1">
                <Brain className="h-3 w-3" /> Atualizar Análise
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === COMPARAÇÃO TERRITORIAL === */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-wider flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" /> Comparação Territorial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-muted-foreground">Cidade A</label>
              <Select value={cidadeA} onValueChange={setCidadeA}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {cidades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground shrink-0 mb-2 hidden sm:block" />
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-muted-foreground">Cidade B</label>
              <Select value={cidadeB} onValueChange={setCidadeB}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {cidades.filter((c) => c !== cidadeA).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {compA && compB ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Labels */}
              <div className="col-span-3 grid grid-cols-3 text-[10px] font-bold tracking-wider text-muted-foreground border-b pb-2 mb-1">
                <span>{compA.cidade}</span>
                <span>Indicador</span>
                <span>{compB.cidade}</span>
              </div>
              {[
                { label: "Total Eleitores", a: compA.total_eleitores, b: compB.total_eleitores, icon: Users },
                { label: "Demandas Resolvidas", a: compA.demandas_resolvidas, b: compB.demandas_resolvidas, icon: CheckCircle2 },
                { label: "Atividade (Gabinetes)", a: compA.gabinetes, b: compB.gabinetes, icon: Activity },
              ].map((row) => (
                <div key={row.label} className="col-span-3 grid grid-cols-3 items-center py-2 border-b border-border/30">
                  <span className={`text-xl font-medium ${row.a >= row.b ? "text-emerald-600" : "text-foreground"}`}>
                    {row.a.toLocaleString("pt-BR")}
                  </span>
                  <div className="flex flex-col items-center gap-0.5">
                    <row.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">{row.label}</span>
                  </div>
                  <span className={`text-xl font-medium ${row.b >= row.a ? "text-emerald-600" : "text-foreground"}`}>
                    {row.b.toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Selecione duas cidades acima para comparar lado a lado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* === DISPARAR DIRETRIZ DIALOG === */}
      <Dialog open={diretrizOpen} onOpenChange={setDiretrizOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-medium">
              <Megaphone className="h-4 w-4 text-destructive" /> Disparar diretriz regional
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Esta mensagem aparecerá como um aviso urgente para todos os Vereadores (Nível 3) da rede.
            </p>
            <Textarea
              placeholder="Escreva a diretriz..."
              value={diretrizMsg}
              onChange={(e) => setDiretrizMsg(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <Button
              onClick={handleDisparar}
              disabled={sendingDiretriz || !diretrizMsg.trim()}
              className="w-full gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {sendingDiretriz ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar Diretriz
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
