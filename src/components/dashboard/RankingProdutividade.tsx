import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, TrendingUp, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  useAssessorPerformance,
  type PeriodFilter,
} from "@/hooks/useAssessorPerformance";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta Semana" },
  { value: "month", label: "Este Mês" },
];

const BAR_COLORS = [
  "hsl(263, 70%, 50%)", // violet
  "hsl(234, 89%, 54%)", // indigo
  "hsl(263, 50%, 60%)",
  "hsl(234, 60%, 60%)",
  "hsl(263, 40%, 65%)",
  "hsl(234, 40%, 65%)",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function RankingProdutividade() {
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const navigate = useNavigate();
  const { data: assessores, isLoading } = useAssessorPerformance(period);

  const top = assessores?.[0];
  const chartData = (assessores ?? []).slice(0, 8).map((a) => ({
    name: a.nome.split(" ")[0],
    cadastros: a.cadastros_periodo,
    fullName: a.nome,
  }));

  return (
    <div className="space-y-4">
      {/* Section Header + Period Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5" /> Ranking de Produtividade
        </h2>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? "default" : "ghost"}
              className={`h-7 text-[10px] px-2.5 rounded-full font-medium ${
                period === p.value
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "text-muted-foreground"
              }`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl col-span-2" />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {/* Top Recruiter Card */}
          <Card
            className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 border-0 text-white overflow-hidden relative cursor-pointer active:opacity-90 transition-opacity"
            onClick={() => navigate("/equipe")}
          >
            <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full min-h-[180px]">
              <div className="absolute top-3 right-3 opacity-10">
                <Star className="h-16 w-16" />
              </div>
              {top && top.cadastros_periodo > 0 ? (
                <>
                  <Badge className="bg-white/20 text-white border-white/30 text-[10px] font-medium mb-3">
                    ⭐ Top Recrutador
                  </Badge>
                  <Avatar className="h-14 w-14 mb-2 ring-2 ring-white/30">
                    {top.avatar && (
                      <AvatarImage src={top.avatar} alt={top.nome} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-white/20 text-white font-medium text-lg">
                      {getInitials(top.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-base leading-tight truncate">{top.nome}</p>
                  <p className="text-white/80 text-xs mt-1">
                    {top.cadastros_periodo} cadastro{top.cadastros_periodo !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-white/70 text-[10px]">
                    <TrendingUp className="h-3 w-3" />
                    Taxa de sucesso: {top.taxa_sucesso}%
                  </div>
                </>
              ) : (
                <>
                  <Trophy className="h-10 w-10 text-white/30 mb-2" />
                  <p className="text-sm text-white/60">Nenhum cadastro no período</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600">
                  <BarChart3 className="h-3.5 w-3.5" />
                </div>
                Cadastros por Assessor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 && chartData.some((d) => d.cadastros > 0) ? (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number, _: string, props: any) => [
                          `${value} cadastros`,
                          props.payload.fullName,
                        ]}
                      />
                      <Bar dataKey="cadastros" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
                  Sem dados para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversion Rate Table */}
      {assessores && assessores.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600/10 text-violet-600">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              Taxa de Conversão (Demandas → Ofício)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assessores.map((a, i) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium shrink-0 ${
                      i === 0
                        ? "bg-indigo-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}º
                  </div>
                  <Avatar className="h-8 w-8 shrink-0">
                    {a.avatar && (
                      <AvatarImage src={a.avatar} alt={a.nome} className="object-cover" />
                    )}
                    <AvatarFallback className="text-[10px] font-medium bg-slate-700 text-white">
                      {getInitials(a.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.nome}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {a.cadastros_periodo} cadastros • {a.demandas_abertas} demandas
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {a.demandas_oficio}/{a.demandas_abertas}
                    </span>
                    <Badge
                      className={`text-[10px] px-2 ${
                        a.taxa_sucesso >= 70
                          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                          : a.taxa_sucesso >= 40
                          ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                          : "bg-slate-500/15 text-slate-500 border-slate-500/30"
                      }`}
                      variant="outline"
                    >
                      {a.taxa_sucesso}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
