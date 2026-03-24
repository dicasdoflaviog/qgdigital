import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Users, TrendingUp, Search, ChevronRight, Eye,
  BarChart3, CheckCircle2, AlertTriangle, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useGabinetesCidade } from "@/hooks/useGabinetesCidade";
import { Skeleton } from "@/components/ui/skeleton";

export function GabinetesRedePanel() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Fetch ALL gabinetes across all cities
  const { data: gabinetes = [], isLoading } = useGabinetesCidade("__all__");

  const filtered = useMemo(() => {
    if (!search) return gabinetes;
    const q = search.toLowerCase();
    return gabinetes.filter(
      (g) =>
        g.nome_vereador?.toLowerCase().includes(q) ||
        g.cidade?.toLowerCase().includes(q)
    );
  }, [gabinetes, search]);

  // Master indicators
  const totalGabinetes = gabinetes.length;
  const totalEleitoresRede = gabinetes.reduce((s, g) => s + (g.total_eleitores || 0), 0);
  const mediaProducao = totalGabinetes > 0
    ? Math.round(totalEleitoresRede / totalGabinetes)
    : 0;

  const maxEleitores = Math.max(...gabinetes.map((g) => g.total_eleitores || 0), 1);

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium md:text-3xl">Gabinetes da Rede</h1>
        <p className="text-xs font-medium text-muted-foreground mt-1">
          Visão estratégica dos vereadores sob sua jurisdição
        </p>
        <Badge variant="outline" className="mt-2 gap-1.5 text-xs py-1 px-3 border-emerald-500/30 text-emerald-600">
          <Building2 className="h-3 w-3" />
          Nível 4 — Líder Regional
        </Badge>
      </div>

      {/* Master Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-[10px] font-medium text-slate-400">Total de Gabinetes</span>
            </div>
            <p className="text-3xl font-medium mt-2 tabular-nums">
              {isLoading ? <Skeleton className="h-9 w-16 bg-slate-700" /> : totalGabinetes}
            </p>
            <div className="absolute top-3 right-3 opacity-5">
              <Building2 className="h-16 w-16" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-[10px] font-medium text-slate-400">Eleitores na Rede</span>
            </div>
            <p className="text-3xl font-medium mt-2 tabular-nums">
              {isLoading ? <Skeleton className="h-9 w-20 bg-slate-700" /> : totalEleitoresRede.toLocaleString("pt-BR")}
            </p>
            <div className="absolute top-3 right-3 opacity-5">
              <Users className="h-16 w-16" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50 text-white overflow-hidden relative">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-[10px] font-medium text-slate-400">Média por Gabinete</span>
            </div>
            <p className="text-3xl font-medium mt-2 tabular-nums">
              {isLoading ? <Skeleton className="h-9 w-14 bg-slate-700" /> : mediaProducao}
            </p>
            <p className="text-xs text-slate-400 mt-1">eleitores/gabinete</p>
            <div className="absolute top-3 right-3 opacity-5">
              <BarChart3 className="h-16 w-16" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar vereador ou cidade..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Gabinetes List */}
      <div className="space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum gabinete encontrado.
          </div>
        )}

        {filtered.map((g) => {
          const resolutividade = g.total_demandas > 0
            ? Math.round((g.demandas_resolvidas / g.total_demandas) * 100)
            : 0;
          const isActive = (g.total_eleitores || 0) > 0;

          return (
            <Card key={g.gabinete_id} className="p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4">
                {/* Avatar / Rank */}
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-medium text-foreground truncate">
                      {g.nome_vereador || "Sem nome"}
                    </p>
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className="text-[10px] shrink-0"
                    >
                      {isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{g.cidade || "—"}</p>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="font-medium text-foreground">{g.total_eleitores || 0}</span>
                      <span>eleitores</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span className="font-medium text-foreground">{g.demandas_resolvidas || 0}</span>
                      <span>resolvidas</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      <span className="font-medium text-foreground">{g.demandas_pendentes || 0}</span>
                      <span>pendentes</span>
                    </div>
                  </div>

                  {/* Progress bar - relative to max */}
                  <div className="mt-2">
                    <Progress
                      value={((g.total_eleitores || 0) / maxEleitores) * 100}
                      className="h-1.5"
                    />
                  </div>
                </div>

                {/* Drill-down button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 text-xs"
                  onClick={() => navigate(`/gestao-base?gabinete=${g.gabinete_id}`)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Visualizar</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
