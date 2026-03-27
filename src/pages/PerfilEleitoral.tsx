import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, ChevronDown, ChevronUp, Filter, Loader2,
  UserRound, User, UserCircle, Calendar, TrendingUp, Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVoterDemographics, FAIXAS_ETARIAS, FAIXAS_ETARIAS_FILTRO } from "@/hooks/useVoterDemographics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// --- Paleta de cores qg-* ---
const COR_MASCULINO = "#2563EB";  // qg-blue-600
const COR_FEMININO  = "#16A34A";  // qg-green-600
const COR_OUTRO     = "#D97706";  // qg-amber-600
const COR_NAO_INF   = "#94A3B8";  // qg-slate-400

const CORES_FAIXA = [
  "#DBEAFE", "#93C5FD", "#3B82F6", "#2563EB", "#1D4ED8", "#1E3A8A", "#94A3B8",
];

const SITUACOES_COMUNS = [
  "Novo Cadastro", "Apoiador Forte", "Apoiador", "Neutro", "Oposição",
];

function KPICard({
  icon, iconBg, iconColor, value, label, sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-medium text-slate-900 whitespace-nowrap">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-sm">
      <p className="font-medium text-slate-700">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill || p.color }} className="text-xs">
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function PerfilEleitoral() {
  const { role, roleLevel, user } = useAuth();
  const isL4Plus = roleLevel >= 4;
  const isL2Plus = roleLevel >= 2;

  // Redirect se nível insuficiente
  if (!isL2Plus) return <Navigate to="/" replace />;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedGabinete, setSelectedGabinete] = useState<string>("__own__");
  const [filterSexo, setFilterSexo] = useState<string>("todos");
  const [filterFaixa, setFilterFaixa] = useState<string>("todas");
  const [filterSituacao, setFilterSituacao] = useState<string>("todas");

  // Para N4+: lista de gabinetes disponíveis
  const { data: gabinetes = [] } = useQuery({
    queryKey: ["all-gabinetes-demo"],
    enabled: isL4Plus,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome_completo, gabinete_id")
        .eq("role", "admin")
        .order("nome_completo");
      if (error) throw error;
      return (data ?? []) as { id: string; nome_completo: string; gabinete_id: string | null }[];
    },
  });

  // Resolve o gabineteId a usar na query
  const gabineteId = isL4Plus
    ? selectedGabinete === "__all__"
      ? null           // null = todos os gabinetes
      : selectedGabinete === "__own__"
        ? (user?.id ?? undefined)
        : selectedGabinete
    : (user?.id ?? undefined);

  const { stats, isLoading, options } = useVoterDemographics({
    gabineteId,
    sexo: filterSexo !== "todos" ? (filterSexo as "M" | "F" | "O") : undefined,
    faixaEtaria: filterFaixa !== "todas" ? (filterFaixa as any) : undefined,
    situacao: filterSituacao !== "todas" ? filterSituacao : undefined,
  });

  const pieData = [
    { name: "Masculino", value: stats.sexo.masculino, color: COR_MASCULINO },
    { name: "Feminino",  value: stats.sexo.feminino,  color: COR_FEMININO  },
    { name: "Outro",     value: stats.sexo.outro,     color: COR_OUTRO     },
    { name: "Não informado", value: stats.sexo.naoInformado, color: COR_NAO_INF },
  ].filter((d) => d.value > 0);

  const faixaChartData = FAIXAS_ETARIAS.filter((f) => f !== "Não informado").map((faixa, i) => ({
    faixa: faixa.replace(" a ", "-").replace(" ou mais", "+").replace("Menor de ", "<"),
    total: stats.faixaEtaria.find((f) => f.faixa === faixa)?.total ?? 0,
    fill: CORES_FAIXA[i] ?? "#3B82F6",
  }));

  const hasFilters = filterSexo !== "todos" || filterFaixa !== "todas" || filterSituacao !== "todas";

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-3 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-qg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-qg-blue-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-medium text-slate-900 truncate">Perfil eleitoral</h1>
              <p className="text-xs text-slate-500 truncate">
                {isLoading ? "Carregando..." : `${stats.total.toLocaleString("pt-BR")} eleitores`}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`h-9 gap-1.5 shrink-0 text-xs font-medium ${hasFilters ? "border-qg-blue-600 text-qg-blue-600" : ""}`}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {hasFilters && <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-qg-blue-600 rounded-full">!</Badge>}
            {filtersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>

        {/* Filtros colapsáveis */}
        {filtersOpen && (
          <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-slate-100">
            {/* Seletor de gabinete — N4+ only */}
            {isL4Plus && (
              <Select value={selectedGabinete} onValueChange={setSelectedGabinete}>
                <SelectTrigger className="h-9 text-xs">
                  <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                  <SelectValue placeholder="Gabinete" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os gabinetes</SelectItem>
                  <SelectItem value="__own__">Meu gabinete</SelectItem>
                  {gabinetes.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.nome_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Select value={filterSexo} onValueChange={setFilterSexo}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Sexo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todo sexo</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                  <SelectItem value="O">Outro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterFaixa} onValueChange={setFilterFaixa}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Faixa etária" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Toda idade</SelectItem>
                  {FAIXAS_ETARIAS_FILTRO.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSituacao} onValueChange={setFilterSituacao}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Situação" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Toda situação</SelectItem>
                  {[...new Set([...SITUACOES_COMUNS, ...options.situacoes])].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-qg-blue-600 self-end"
                onClick={() => { setFilterSexo("todos"); setFilterFaixa("todas"); setFilterSituacao("todas"); }}>
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-qg-blue-600" />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-5">

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <KPICard
              icon={<Users className="w-5 h-5" />}
              iconBg="bg-qg-blue-100"
              iconColor="text-qg-blue-600"
              value={stats.total.toLocaleString("pt-BR")}
              label="Total de eleitores"
            />
            <KPICard
              icon={<Calendar className="w-5 h-5" />}
              iconBg="bg-qg-amber-100"
              iconColor="text-qg-amber-700"
              value={stats.mediaIdade !== null ? `${stats.mediaIdade} anos` : "—"}
              label="Média de idade"
            />
            <KPICard
              icon={<User className="w-5 h-5" />}
              iconBg="bg-blue-50"
              iconColor="text-qg-blue-600"
              value={`${stats.sexo.pctMasculino}%`}
              label="Homens"
              sub={`${stats.sexo.masculino.toLocaleString("pt-BR")} eleitores`}
            />
            <KPICard
              icon={<UserCircle className="w-5 h-5" />}
              iconBg="bg-green-50"
              iconColor="text-qg-green-600"
              value={`${stats.sexo.pctFeminino}%`}
              label="Mulheres"
              sub={`${stats.sexo.feminino.toLocaleString("pt-BR")} eleitores`}
            />
          </div>

          {/* Distribuição por sexo */}
          {pieData.length > 0 && (
            <Card className="border-slate-200 shadow-none rounded-2xl">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <UserRound className="w-4 h-4 text-qg-blue-600" />
                  Distribuição por sexo
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Faixa etária */}
          <Card className="border-slate-200 shadow-none rounded-2xl">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-qg-amber-600" />
                Distribuição por faixa etária
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={faixaChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="faixa" tick={{ fontSize: 10, fill: "#64748B" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Eleitores" radius={[4, 4, 0, 0]}>
                    {faixaChartData.map((entry, index) => (
                      <Cell key={index} fill={COR_MASCULINO} fillOpacity={0.4 + index * 0.09} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Crescimento mensal */}
          {stats.monthlyGrowth.length > 0 && (
            <Card className="border-slate-200 shadow-none rounded-2xl">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-qg-green-600" />
                  Novos cadastros — últimos 6 meses
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.monthlyGrowth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#64748B" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Cadastros" fill={COR_FEMININO} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top bairros */}
          {stats.topBairros.length > 0 && (
            <Card className="border-slate-200 shadow-none rounded-2xl">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-qg-blue-600" />
                  Bairros com mais eleitores
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {stats.topBairros.map((b, i) => {
                  const pct = stats.total > 0 ? Math.round((b.count / stats.total) * 100) : 0;
                  return (
                    <div key={b.bairro} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-medium text-slate-700 truncate">{b.bairro}</p>
                          <p className="text-xs text-slate-500 whitespace-nowrap ml-2">{b.count} · {pct}%</p>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-qg-blue-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Estado vazio */}
          {stats.total === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">Nenhum eleitor encontrado</p>
              <p className="text-xs text-slate-400">Tente ajustar os filtros aplicados</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
