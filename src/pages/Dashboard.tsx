import { useMemo, useState, useEffect } from "react";
import {
  Users, Cake, MapPin, TrendingUp, AlertTriangle, Trophy, FileText,
  Clock, Activity, ChevronRight, Sparkles, CheckCircle2, BarChart3,
  Eye, PenLine, MessageCircle, Lightbulb, Shield, HeartPulse, Wrench,
  Building, Bus, Droplets, GraduationCap, TreePine, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { RelatorioModal } from "@/components/dashboard/RelatorioModal";
import { TransparencyReportModal } from "@/components/dashboard/TransparencyReportModal";
import { useVoterStats } from "@/hooks/useVoters";
import { useAssessores } from "@/hooks/useDashboardData";
import { AniversarianteCard } from "@/components/eleitores/AniversarianteCard";
import { RadarDaRua } from "@/components/dashboard/RadarDaRua";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DemandaDetailDrawer } from "@/components/dashboard/DemandaDetailDrawer";
import { RankingProdutividade } from "@/components/dashboard/RankingProdutividade";
import { EleitorDetailDrawer } from "@/components/dashboard/EleitorDetailDrawer";
import { useDemandas } from "@/hooks/useDemandas";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import {
  eleitores as mockEleitores, assessores as mockAssessores,
  getAniversariantes as getMockAniversariantes, getTopBairro as getMockTopBairro,
  getBairroStats as getMockBairroStats
} from "@/data/mockData";
import { oficios as mockOficios, isAtrasado, OFICIO_STATUS_CONFIG, diasDesdeProtocolo } from "@/data/oficiosData";

const PIE_COLORS = [
  "hsl(224, 76%, 40%)",
  "hsl(224, 76%, 55%)",
  "hsl(215, 20%, 55%)",
  "hsl(0, 0%, 48%)",
  "hsl(0, 0%, 30%)",
  "hsl(142, 71%, 45%)",
];

// Category icon mapping
const CATEGORY_ICONS: Record<string, { icon: React.ReactNode; color: string; emoji: string }> = {
  "Iluminação": { icon: <Lightbulb className="h-4 w-4" />, color: "text-yellow-500", emoji: "💡" },
  "Segurança": { icon: <Shield className="h-4 w-4" />, color: "text-blue-500", emoji: "🛡️" },
  "Saúde": { icon: <HeartPulse className="h-4 w-4" />, color: "text-red-500", emoji: "🏥" },
  "Infraestrutura": { icon: <Wrench className="h-4 w-4" />, color: "text-orange-500", emoji: "🔧" },
  "Educação": { icon: <GraduationCap className="h-4 w-4" />, color: "text-indigo-500", emoji: "📚" },
  "Transporte": { icon: <Bus className="h-4 w-4" />, color: "text-cyan-500", emoji: "🚌" },
  "Saneamento": { icon: <Droplets className="h-4 w-4" />, color: "text-teal-500", emoji: "💧" },
  "Habitação": { icon: <Building className="h-4 w-4" />, color: "text-purple-500", emoji: "🏘️" },
  "Meio Ambiente": { icon: <TreePine className="h-4 w-4" />, color: "text-green-500", emoji: "🌳" },
};

function getCategoryIcon(cat: string) {
  return CATEGORY_ICONS[cat] || { icon: <FileText className="h-4 w-4" />, color: "text-muted-foreground", emoji: "📋" };
}

// Urgency badge based on days open
function UrgencyBadge({ createdAt }: { createdAt: string }) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  let color = "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (days >= 6) color = "bg-red-500/15 text-red-600 border-red-500/30";
  else if (days >= 3) color = "bg-amber-500/15 text-amber-600 border-amber-500/30";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${color}`}>
      <Clock className="h-2.5 w-2.5" />
      Há {days}d
    </span>
  );
}

// Oficio status badge
function OficioStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    elaborado: { label: "Elaborado", classes: "bg-muted text-muted-foreground" },
    protocolado: { label: "Protocolado", classes: "bg-blue-500/15 text-blue-600 border-blue-500/30" },
    em_cobranca: { label: "Em Cobrança", classes: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
    respondido: { label: "Respondido", classes: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30" },
    resolvido: { label: "Resolvido", classes: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  };
  const c = config[status] || config.elaborado;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${c.classes}`}>{c.label}</span>;
}

export default function Dashboard() {
  const { role, isImpersonating } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedDemanda, setSelectedDemanda] = useState<any>(null);
  const [selectedEleitor, setSelectedEleitor] = useState<any>(null);
  const [demandaDrawerOpen, setDemandaDrawerOpen] = useState(false);
  const [eleitorDrawerOpen, setEleitorDrawerOpen] = useState(false);
  const [aniversariantesSheetOpen, setAniversariantesSheetOpen] = useState(false);
  const [bairroSheetOpen, setBairroSheetOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useVoterStats();
  const { data: assessoresData } = useAssessores();
  const { data: demandas, refetch: refetchDemandas } = useDemandas();

  // Auto-open demanda drawer from notification deep-link (?demanda=<id>)
  useEffect(() => {
    const demandaId = searchParams.get("demanda");
    if (demandaId && demandas && demandas.length > 0) {
      const found = demandas.find((d: any) => d.id === demandaId);
      if (found) {
        setSelectedDemanda(found);
        setDemandaDrawerOpen(true);
        // Clean up the URL
        searchParams.delete("demanda");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, demandas, setSearchParams]);

  const realTotal = stats?.total ?? 0;
  const useMock = isImpersonating || !statsLoading && realTotal === 0;

  const totalBase = useMock ? mockEleitores.length : realTotal;
  const novos7d = useMock ? 5 : stats?.novos7d ?? 0;
  const bairroStats = useMock ? getMockBairroStats() : stats?.bairroStats ?? [];
  const topBairro = useMock ? getMockTopBairro() : stats?.topBairro ?? { bairro: "—", total: 0 };

  const aniversariantes = useMemo(() => {
    if (useMock) return getMockAniversariantes();
    return (stats?.aniversariantes ?? []).map((e) => ({
      id: e.id, nome: "—", whatsapp: "", bairro: e.bairro,
      dataNascimento: e.data_nascimento ?? "", situacao: e.situacao,
      assessorId: "", criadoEm: e.created_at
    }));
  }, [useMock, stats]);

  const aniversariantesReais = stats?.aniversariantes ?? [];

  const topAssessores = useMemo(() => {
    if (useMock) return [...mockAssessores].sort((a, b) => b.cadastros - a.cadastros).slice(0, 3);
    return (assessoresData ?? []).slice(0, 3);
  }, [useMock, assessoresData]);
  const maxCadastros = topAssessores[0]?.cadastros || 1;

  const pieData = bairroStats.slice(0, 5).map((b) => ({ name: b.bairro, value: b.total }));

  // Category stats from demandas
  const categoryStats = useMemo(() => {
    const source = useMock
      ? mockOficios.map(o => o.titulo.split(" - ")[0].replace(/^[^a-zA-ZÀ-ú]+/, ""))
      : (demandas ?? []).map(d => d.categoria).filter(Boolean);

    const count: Record<string, number> = {};
    source.forEach(c => {
      if (c) count[c] = (count[c] || 0) + 1;
    });

    // If using mock, add some demo categories
    if (useMock && Object.keys(count).length < 3) {
      count["Iluminação"] = 18;
      count["Infraestrutura"] = 14;
      count["Saúde"] = 11;
      count["Segurança"] = 8;
      count["Educação"] = 6;
      count["Saneamento"] = 5;
    }

    return Object.entries(count)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [useMock, demandas]);

  const maxBairro = bairroStats[0]?.total || 1;
  const maxCategoria = categoryStats[0]?.total || 1;

  // Pending demandas count
  const pendingCount = useMock
    ? mockOficios.filter(o => o.status !== "resolvido").length
    : (demandas ?? []).filter(d => d.status === "Pendente").length;

  const isEmpty = false;

  const handleCategoryDrillDown = (categoria: string) => {
    navigate(`/eleitores?categoria=${encodeURIComponent(categoria)}`);
    toast.info(`Filtrando por: ${categoria}`);
  };

  const handleBairroDrillDown = (bairro: string) => {
    navigate(`/eleitores?bairro=${encodeURIComponent(bairro)}`);
    toast.info(`Filtrando por: ${bairro}`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      {/* Header */}
      <div className="bg-primary rounded-lg -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-6 pt-8 pb-10 mb-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-4xl font-medium text-primary-foreground leading-tight">
              Resumo do Mandato
            </h1>
            <p className="text-sm text-primary-foreground/70 mt-2">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <Button variant="ai" size="sm" className="hidden md:flex gap-1.5 text-xs rounded-full px-5">
            <Sparkles className="h-3.5 w-3.5" /> Resumo IA 24h
          </Button>
        </div>
      </div>

      {(role === "super_admin" || role === "admin") && (
        <div className="space-y-2">
          <RelatorioModal />
          {role === "super_admin" && <TransparencyReportModal />}
        </div>
      )}

      {isEmpty ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground">Bem-vindo ao QG Digital!</h2>
              <p className="text-sm text-muted-foreground mt-1">Sua base ainda está vazia.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => navigate("/eleitores")}><Users className="h-4 w-4 mr-2" /> Cadastrar Eleitores</Button>
              <Button variant="outline" onClick={() => navigate("/equipe")}><Trophy className="h-4 w-4 mr-2" /> Montar Equipe</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ═══════ Dynamic Intelligence Cards ═══════ */}
          <div className="grid gap-4 grid-cols-2">
            {/* Eleitores Card → /eleitores */}
            <Card
              className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 text-white overflow-hidden relative cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
              onClick={() => navigate("/eleitores")}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                      <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-white/10">
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                      <span className="text-[9px] md:text-xs font-medium text-slate-400">Total da base</span>
                    </div>
                    <p className="text-2xl md:text-4xl font-medium mt-2 md:mt-3 tabular-nums whitespace-nowrap">{totalBase}</p>
                    {novos7d > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 md:mt-2">
                        <TrendingUp className="h-3 w-3 md:h-3.5 md:w-3.5 text-emerald-400" />
                        <span className="text-[10px] md:text-sm font-medium text-emerald-400">+{novos7d} semana</span>
                      </div>
                    )}
                    <p className="text-[9px] md:text-xs text-slate-400 mt-0.5 md:mt-1 hidden md:block">
                      {novos7d > 0
                        ? `+${Math.round((novos7d / Math.max(totalBase - novos7d, 1)) * 100)}% crescimento`
                        : "Base estável"
                      }
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-5">
                    <Users className="h-16 w-16 md:h-24 md:w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pendentes Card → /oficios */}
            <Card
              className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 text-white overflow-hidden relative cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
              onClick={() => navigate("/oficios")}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                      <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-orange-500/20">
                        <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                      </div>
                      <span className="text-[9px] md:text-xs font-medium text-slate-400">Pendentes</span>
                    </div>
                    <p className="text-2xl md:text-4xl font-medium mt-2 md:mt-3 tabular-nums whitespace-nowrap">{pendingCount}</p>
                    <div className="flex items-center gap-1 mt-1.5 md:mt-2">
                      <Activity className="h-3 w-3 md:h-3.5 md:w-3.5 text-orange-400" />
                      <span className="text-[10px] md:text-sm font-medium text-orange-400">
                        {pendingCount > 5 ? "Atenção" : "Sob controle"}
                      </span>
                    </div>
                    <p className="text-[9px] md:text-xs text-slate-400 mt-0.5 md:mt-1 hidden md:block">
                      {useMock ? "3 com mais de 5 dias" : `${(demandas ?? []).filter(d => d.status === "Em Andamento").length} em andamento`}
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-5">
                    <FileText className="h-16 w-16 md:h-24 md:w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Small stat cards */}
          <div className="grid gap-4 grid-cols-2">
            {/* Aniversariantes → BottomSheet */}
            <Card
              className="cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
              onClick={() => setAniversariantesSheetOpen(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Cake className="h-4 w-4" /></div>
                  {(useMock ? aniversariantes.length : aniversariantesReais.length) > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Ação</Badge>
                  )}
                </div>
                <p className="text-2xl font-medium text-foreground whitespace-nowrap">{useMock ? aniversariantes.length : aniversariantesReais.length}</p>
                <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Aniversariantes</p>
              </CardContent>
            </Card>

            {/* Bairro mais ativo → BottomSheet */}
            <Card
              className="cursor-pointer active:scale-95 transition-transform touch-manipulation select-none"
              onClick={() => setBairroSheetOpen(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><MapPin className="h-4 w-4" /></div>
                  {topBairro.total > 0 && <Activity className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="text-base leading-tight font-medium text-foreground truncate">{topBairro.bairro}</p>
                <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Bairro mais ativo</p>
                {topBairro.total > 0 && <p className="text-[10px] text-primary font-medium mt-1 whitespace-nowrap">{topBairro.total} eleitores</p>}
              </CardContent>
            </Card>
          </div>

          {aniversariantes.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-muted-foreground">🎂 Aniversariantes do dia</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {aniversariantes.slice(0, 3).map((e) => <AniversarianteCard key={e.id} eleitor={e} />)}
              </div>
            </div>
          )}

          {(role === "secretaria" || role === "admin") && <RadarDaRua />}
          {role === "super_admin" && <ActivityFeed />}

          {/* ═══════ Inteligência Regional ═══════ */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Bairros com mais Demandas - Progress bars */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground"><BarChart3 className="h-3.5 w-3.5" /></div>
                  Bairros com mais Demandas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bairroStats.slice(0, 6).map((b) => (
                  <div
                    key={b.bairro}
                    className="relative p-3 min-h-[44px] rounded-lg cursor-pointer hover:bg-accent/50 transition-colors group flex items-center"
                    onClick={() => handleBairroDrillDown(b.bairro)}
                  >
                    {/* Background progress bar */}
                    <div
                      className="absolute inset-0 rounded-lg bg-primary/5 transition-all"
                      style={{ width: `${(b.total / maxBairro) * 100}%` }}
                    />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{b.bairro}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary tabular-nums">{b.total}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Categorias com ícones coloridos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><BarChart3 className="h-3.5 w-3.5" /></div>
                  Categorias de Demandas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categoryStats.map((c) => {
                  const catInfo = getCategoryIcon(c.categoria);
                  return (
                    <div
                      key={c.categoria}
                      className="relative p-3 min-h-[44px] rounded-lg cursor-pointer hover:bg-accent/50 transition-colors group flex items-center"
                      onClick={() => handleCategoryDrillDown(c.categoria)}
                    >
                      <div
                        className="absolute inset-0 rounded-lg bg-primary/5 transition-all"
                        style={{ width: `${(c.total / maxCategoria) * 100}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{catInfo.emoji}</span>
                          <span className="text-sm font-medium text-foreground">{c.categoria}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-primary tabular-nums">{c.total}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {categoryStats.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Sem categorias registradas.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ═══════ Ranking de Produtividade (L3+) ═══════ */}
          {(role === "admin" || role === "super_admin") && (
            <RankingProdutividade />
          )}

          {/* Pie chart + Top assessores */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {pieData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground"><BarChart3 className="h-3.5 w-3.5" /></div>
                    Distribuição por Bairro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={55} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
                            formatter={(value: number, name: string) => [`${value} eleitores`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {pieData.map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-foreground truncate">{d.name}</span>
                          </div>
                          <span className="font-medium text-foreground tabular-nums">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(role === "admin" || role === "super_admin") && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><Trophy className="h-3.5 w-3.5" /></div>
                    Top 3 Assessores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topAssessores.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum assessor cadastrado ainda.</p>
                  ) : (
                    topAssessores.map((a, i) => (
                      <div key={a.id} className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium shrink-0 ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {i + 1}º
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-foreground truncate">{a.nome}</span>
                            <span className="text-xs font-medium text-primary tabular-nums">{a.cadastros}</span>
                          </div>
                          <Progress value={a.cadastros / maxCadastros * 100} className="h-1.5" />
                        </div>
                      </div>
                    ))
                  )}
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1" onClick={() => navigate("/equipe")}>
                    Ver equipe completa <ChevronRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ═══════ Últimas Demandas with urgency badges ═══════ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-destructive/10 text-destructive"><AlertTriangle className="h-3.5 w-3.5" /></div>
                Últimas Demandas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {(useMock
                ? mockOficios.slice(0, 5).map((o) => ({
                    id: o.id, descricao: o.pauta, bairro: o.bairro, categoria: o.titulo,
                    status: o.status === "resolvido" ? "Resolvida" : "Pendente",
                    created_at: o.criadoEm + "T12:00:00Z", eleitor_nome: null, eleitor_whatsapp: null, assessor_nome: null,
                  }))
                : (demandas ?? []).slice(0, 5).map((d) => ({
                    id: d.id, descricao: d.descricao, bairro: d.bairro, categoria: d.categoria,
                    status: d.status, created_at: d.created_at, eleitor_nome: d.eleitor_nome ?? null,
                    eleitor_whatsapp: d.eleitor_whatsapp ?? null, assessor_nome: null,
                    latitude: d.latitude ?? null, longitude: d.longitude ?? null,
                  }))
              ).map((d: any) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 min-h-[48px] rounded-lg border cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => { setSelectedDemanda(d); setDemandaDrawerOpen(true); }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">{d.categoria || d.descricao || "Sem descrição"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{d.bairro || "—"} • {new Date(d.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <UrgencyBadge createdAt={d.created_at} />
                    <Badge variant={d.status === "Resolvida" ? "default" : "destructive"} className="text-[10px]">
                      {d.status || "Pendente"}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!useMock && (!demandas || demandas.length === 0)) && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma demanda registrada.</p>
              )}
            </CardContent>
          </Card>

          {/* ═══════ Ofícios - Action Oriented ═══════ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-3.5 w-3.5" /></div>
                Ofícios Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {mockOficios.slice(0, 5).map((o) => {
                const dias = diasDesdeProtocolo(o);
                return (
                  <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{o.numero}</span>
                        <OficioStatusBadge status={o.status} />
                        {dias !== null && dias > 0 && (
                          <UrgencyBadge createdAt={o.protocoladoEm ? o.protocoladoEm + "T12:00:00Z" : o.criadoEm + "T12:00:00Z"} />
                        )}
                      </div>
                      <p className="text-sm font-medium truncate text-foreground">{o.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.bairro} • {o.pauta}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Ver detalhes"
                        onClick={() => navigate("/oficios")}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Assinar"
                        onClick={() => toast.info("Assinatura em breve")}
                      >
                        <PenLine className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Enviar via WhatsApp"
                        onClick={() => toast.info("Envio via WhatsApp em breve")}
                      >
                        <MessageCircle className="h-4 w-4 text-emerald-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1" onClick={() => navigate("/oficios")}>
                Ver todos os ofícios <ChevronRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent Eleitores List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary"><Users className="h-3.5 w-3.5" /></div>
                Últimos Eleitores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {(useMock ? mockEleitores.slice(0, 5) : []).map((e: any) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-3 min-h-[48px] rounded-lg border cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => { setSelectedEleitor(e); setEleitorDrawerOpen(true); }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{e.nome}</p>
                    <p className="text-xs text-muted-foreground">{e.bairro || "—"} • {e.situacao}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1" onClick={() => navigate("/eleitores")}>
                Ver todos os eleitores <ChevronRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      <div className="md:hidden">
        <Button variant="ai" className="w-full gap-2 text-sm h-12">
          <Sparkles className="h-4 w-4" /> Resumo IA 24h
        </Button>
      </div>

      {/* Detail Drawers */}
      <DemandaDetailDrawer
        demanda={selectedDemanda}
        open={demandaDrawerOpen}
        onOpenChange={setDemandaDrawerOpen}
        onStatusChanged={() => refetchDemandas()}
      />
      <EleitorDetailDrawer
        eleitor={selectedEleitor}
        open={eleitorDrawerOpen}
        onOpenChange={setEleitorDrawerOpen}
      />

      {/* BottomSheet — Aniversariantes */}
      <Sheet open={aniversariantesSheetOpen} onOpenChange={setAniversariantesSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">🎂 Aniversariantes do dia</SheetTitle>
          </SheetHeader>
          {aniversariantes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum aniversariante hoje.</p>
          ) : (
            <div className="space-y-3 pb-safe">
              {aniversariantes.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border active:bg-accent transition-colors cursor-pointer"
                  onClick={() => { setAniversariantesSheetOpen(false); navigate(`/eleitores/${e.id}`); }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                    <Cake className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.nome !== "—" ? e.nome : "Eleitor"}</p>
                    <p className="text-xs text-muted-foreground">{e.bairro} • {e.situacao}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))}
              <Button
                className="w-full h-12 mt-2"
                onClick={() => { setAniversariantesSheetOpen(false); navigate("/eleitores"); }}
              >
                Ver todos os eleitores
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Bairro mais ativo */}
      <Sheet open={bairroSheetOpen} onOpenChange={setBairroSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">📍 Distribuição por bairro</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pb-safe">
            {bairroStats.slice(0, 10).map((b) => (
              <div
                key={b.bairro}
                className="relative p-3 min-h-[44px] rounded-xl border border-border cursor-pointer active:bg-accent transition-colors"
                onClick={() => { setBairroSheetOpen(false); handleBairroDrillDown(b.bairro); }}
              >
                <div
                  className="absolute inset-0 rounded-xl bg-primary/5"
                  style={{ width: `${(b.total / (bairroStats[0]?.total || 1)) * 100}%` }}
                />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{b.bairro}</span>
                  </div>
                  <span className="text-sm font-medium text-primary tabular-nums whitespace-nowrap">{b.total} eleitores</span>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full h-12 mt-2"
              onClick={() => { setBairroSheetOpen(false); navigate("/mapa"); }}
            >
              Ver mapa de calor
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
