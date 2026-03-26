import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSaasStats } from "@/hooks/useSaasStats";
import Dashboard from "./Dashboard";
import DashboardAssessor from "./DashboardAssessor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Users, CalendarDays, FileText, Landmark, MapPin, Server,
  Shield, Database, Activity, AlertTriangle, CheckCircle2, Trophy,
  CheckCircle, Clock, XCircle,
} from "lucide-react";

/** Mock dashboard for Secretária (Level 2) simulation */
function DashboardSecretaria() {
  const [reunioesOpen, setReunioesOpen] = useState(false);
  const [oficiosPendentesOpen, setOficiosPendentesOpen] = useState(false);
  const [eleitoresOpen, setEleitoresOpen] = useState(false);
  const [oficiosConcluidos, setOficiosConcluidos] = useState(false);

  const reunioes = [
    { hora: "09:00", titulo: "Reunião com líder comunitário - Bairro Centro", tipo: "Reunião" },
    { hora: "11:30", titulo: "Entrega de ofício na Câmara Municipal", tipo: "Protocolo" },
    { hora: "14:00", titulo: "Atendimento ao público - Gabinete", tipo: "Atendimento" },
  ];

  const oficiosPendentes = [
    { numero: "OF-2026/045", titulo: "Solicitação de iluminação - Bairro Jardim", dias: 3 },
    { numero: "OF-2026/046", titulo: "Requerimento de poda de árvores - Centro", dias: 2 },
    { numero: "OF-2026/047", titulo: "Pedido de recapeamento - Vila Nova", dias: 1 },
    { numero: "OF-2026/048", titulo: "Solicitação de sinalização - Av. Principal", dias: 5 },
    { numero: "OF-2026/049", titulo: "Requerimento de limpeza - Praça Central", dias: 1 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
      <div className="bg-primary rounded-lg -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-6 pt-8 pb-10 mb-2">
        <h1 className="text-2xl md:text-3xl font-medium text-primary-foreground">Painel da secretaria</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">Agenda e gestão do gabinete</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MockStatCard icon={<CalendarDays className="h-4 w-4" />} value="3" label="Reuniões hoje" onClick={() => setReunioesOpen(true)} />
        <MockStatCard icon={<FileText className="h-4 w-4" />} value="5" label="Ofícios pendentes" highlight onClick={() => setOficiosPendentesOpen(true)} />
        <MockStatCard icon={<Users className="h-4 w-4" />} value="328" label="Eleitores ativos" onClick={() => setEleitoresOpen(true)} />
        <MockStatCard icon={<CheckCircle2 className="h-4 w-4" />} value="12" label="Ofícios concluídos" onClick={() => setOficiosConcluidos(true)} />
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Agenda de hoje
          </h2>
          {reunioes.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs font-medium text-primary tabular-nums w-12">{item.hora}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.titulo}</p>
                <Badge variant="outline" className="text-[9px] mt-0.5">{item.tipo}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Ofícios pendentes de assinatura
          </h2>
          {oficiosPendentes.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{item.titulo}</p>
                <p className="text-[10px] text-muted-foreground">Nº {item.numero}</p>
              </div>
              <Badge variant={item.dias > 3 ? "destructive" : "outline"} className="text-[9px] shrink-0">
                {item.dias}d
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* BottomSheet — Reuniões hoje */}
      <Sheet open={reunioesOpen} onOpenChange={setReunioesOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">📅 Reuniões hoje</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {reunioes.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <span className="text-sm font-medium text-primary tabular-nums w-14">{item.hora}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.titulo}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{item.tipo}</Badge>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Ofícios pendentes */}
      <Sheet open={oficiosPendentesOpen} onOpenChange={setOficiosPendentesOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">📋 Ofícios pendentes</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {oficiosPendentes.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Nº {item.numero}</p>
                </div>
                <Badge variant={item.dias > 3 ? "destructive" : "outline"} className="text-xs ml-2 shrink-0">
                  {item.dias}d
                </Badge>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Eleitores ativos */}
      <Sheet open={eleitoresOpen} onOpenChange={setEleitoresOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">👥 Eleitores ativos</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {[
              { bairro: "Centro", count: 98 },
              { bairro: "Liberdade", count: 74 },
              { bairro: "Vila Nova", count: 66 },
              { bairro: "Jardim América", count: 55 },
              { bairro: "Outros", count: 35 },
            ].map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-sm font-medium text-foreground">{b.bairro}</span>
                <span className="text-sm font-medium text-primary whitespace-nowrap">{b.count} eleitores</span>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-primary/10 text-center">
              <p className="text-2xl font-medium text-primary whitespace-nowrap">328</p>
              <p className="text-xs text-muted-foreground mt-1">Total de eleitores ativos</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Ofícios concluídos */}
      <Sheet open={oficiosConcluidos} onOpenChange={setOficiosConcluidos}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">✅ Ofícios concluídos</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {[
              { numero: "OF-2026/030", titulo: "Instalação de semáforos - Av. Norte", data: "20/03" },
              { numero: "OF-2026/031", titulo: "Reforma da creche municipal", data: "19/03" },
              { numero: "OF-2026/033", titulo: "Pavimentação Rua das Palmeiras", data: "18/03" },
              { numero: "OF-2026/035", titulo: "Poda de árvores - Bairro Sul", data: "17/03" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.titulo}</p>
                  <p className="text-xs text-muted-foreground">Nº {item.numero} · {item.data}</p>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Mock dashboard for Vereador (Level 3) simulation */
function DashboardVereador() {
  const [investimentoOpen, setInvestimentoOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [baseOpen, setBaseOpen] = useState(false);
  const [protocoladosOpen, setProtocoladosOpen] = useState(false);

  const emendas = [
    { titulo: "Reforma da UBS Centro", valor: "R$ 500.000", status: "Em execução" },
    { titulo: "Pavimentação Rua das Flores", valor: "R$ 350.000", status: "Empenhada" },
    { titulo: "Equipamentos para Escola Municipal", valor: "R$ 200.000", status: "Indicada" },
  ];

  const assessores = [
    { nome: "João Silva", cadastros: 312, posicao: 1 },
    { nome: "Maria Santos", cadastros: 287, posicao: 2 },
    { nome: "Pedro Costa", cadastros: 245, posicao: 3 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
      <div className="bg-primary rounded-lg -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-6 pt-8 pb-10 mb-2">
        <h1 className="text-2xl md:text-3xl font-medium text-primary-foreground">Dashboard do vereador</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">Performance e emendas do mandato</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MockStatCard icon={<Landmark className="h-4 w-4" />} value="R$ 2M" label="Investimento total" isText onClick={() => setInvestimentoOpen(true)} />
        <MockStatCard icon={<Trophy className="h-4 w-4" />} value="João" label="1º ranking" isText onClick={() => setRankingOpen(true)} />
        <MockStatCard icon={<Users className="h-4 w-4" />} value="1.250" label="Base total" onClick={() => setBaseOpen(true)} />
        <MockStatCard icon={<FileText className="h-4 w-4" />} value="48" label="Ofícios protocolados" onClick={() => setProtocoladosOpen(true)} />
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Ranking de assessores
          </h2>
          {assessores.map((a) => (
            <div key={a.posicao} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium ${a.posicao === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {a.posicao}º
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">{a.nome}</p>
                <p className="text-[10px] text-muted-foreground">{a.cadastros} cadastros</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" /> Emendas em destaque
          </h2>
          {emendas.map((e, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{e.titulo}</p>
                <p className="text-[10px] text-muted-foreground">{e.valor}</p>
              </div>
              <Badge variant="outline" className="text-[9px]">{e.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* BottomSheet — Investimento total */}
      <Sheet open={investimentoOpen} onOpenChange={setInvestimentoOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">🏛️ Investimento total</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {emendas.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{e.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.valor}</p>
                </div>
                <Badge variant="outline" className="text-xs ml-2 shrink-0">{e.status}</Badge>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-primary/10 text-center">
              <p className="text-2xl font-medium text-primary whitespace-nowrap">R$ 2.000.000</p>
              <p className="text-xs text-muted-foreground mt-1">Total investido no mandato</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Ranking */}
      <Sheet open={rankingOpen} onOpenChange={setRankingOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">🏆 Ranking de assessores</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {assessores.map((a) => (
              <div key={a.posicao} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium ${a.posicao === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {a.posicao}º
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">{a.cadastros} cadastros registrados</p>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Base total */}
      <Sheet open={baseOpen} onOpenChange={setBaseOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">👥 Base total de eleitores</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {[
              { bairro: "Centro", count: 380 },
              { bairro: "Liberdade", count: 290 },
              { bairro: "Vila Nova", count: 250 },
              { bairro: "Jardim América", count: 210 },
              { bairro: "Outros", count: 120 },
            ].map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-sm font-medium text-foreground">{b.bairro}</span>
                <span className="text-sm font-medium text-primary whitespace-nowrap">{b.count} eleitores</span>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-primary/10 text-center">
              <p className="text-2xl font-medium text-primary whitespace-nowrap">1.250</p>
              <p className="text-xs text-muted-foreground mt-1">Total na base eleitoral</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Ofícios protocolados */}
      <Sheet open={protocoladosOpen} onOpenChange={setProtocoladosOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">📄 Ofícios protocolados</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {[
              { numero: "OF-2026/048", titulo: "Solicitação de sinalização - Av. Principal", status: "Aguardando" },
              { numero: "OF-2026/047", titulo: "Pedido de recapeamento - Vila Nova", status: "Em análise" },
              { numero: "OF-2026/040", titulo: "Reforma da praça central", status: "Aprovado" },
              { numero: "OF-2026/035", titulo: "Poda de árvores - Bairro Sul", status: "Concluído" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Nº {item.numero}</p>
                </div>
                <Badge variant="outline" className="text-xs ml-2 shrink-0">{item.status}</Badge>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Mock dashboard for Super Admin Level 4 simulation */
function DashboardSuperAdmin() {
  const [cidadesOpen, setCidadesOpen] = useState(false);
  const [eleitoresOpen, setEleitoresOpen] = useState(false);
  const [alertasOpen, setAlertasOpen] = useState(false);
  const [gabineteOpen, setGabineteOpen] = useState(false);

  const alertas = [
    { cidade: "Cidade A", alerta: "Falta de água - Bairro Norte", severidade: "Alta" },
    { cidade: "Cidade B", alerta: "Queda de energia recorrente - Centro", severidade: "Média" },
    { cidade: "Cidade C", alerta: "Alagamento após chuvas - Vila Sul", severidade: "Alta" },
  ];

  const cidades = [
    { cidade: "Cidade A", eleitores: 3500, gabinetes: 2 },
    { cidade: "Cidade B", eleitores: 2800, gabinetes: 2 },
    { cidade: "Cidade C", eleitores: 2200, gabinetes: 1 },
    { cidade: "Cidade D", eleitores: 1800, gabinetes: 2 },
    { cidade: "Cidade E", eleitores: 1700, gabinetes: 1 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
      <div className="bg-primary rounded-lg -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-6 pt-8 pb-10 mb-2">
        <h1 className="text-2xl md:text-3xl font-medium text-primary-foreground">Observatório regional</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">Dados consolidados da rede política</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MockStatCard icon={<MapPin className="h-4 w-4" />} value="5" label="Cidades monitoradas" onClick={() => setCidadesOpen(true)} />
        <MockStatCard icon={<Users className="h-4 w-4" />} value="12.000" label="Eleitores na rede" onClick={() => setEleitoresOpen(true)} />
        <MockStatCard icon={<AlertTriangle className="h-4 w-4" />} value="3" label="Alertas de crise" highlight onClick={() => setAlertasOpen(true)} />
        <MockStatCard icon={<Shield className="h-4 w-4" />} value="8" label="Gabinetes ativos" onClick={() => setGabineteOpen(true)} />
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Alertas de crise regionais
          </h2>
          {alertas.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{a.alerta}</p>
                <p className="text-[10px] text-muted-foreground">{a.cidade}</p>
              </div>
              <Badge variant={a.severidade === "Alta" ? "destructive" : "outline"} className="text-[9px]">
                {a.severidade}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Performance por cidade
          </h2>
          {cidades.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs font-medium text-foreground">{c.cidade}</p>
                <p className="text-[10px] text-muted-foreground">{c.gabinetes} gabinete{c.gabinetes > 1 ? "s" : ""}</p>
              </div>
              <span className="text-xs font-medium text-primary">{c.eleitores.toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* BottomSheet — Cidades monitoradas */}
      <Sheet open={cidadesOpen} onOpenChange={setCidadesOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">🗺️ Cidades monitoradas</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {cidades.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.cidade}</p>
                  <p className="text-xs text-muted-foreground">{c.gabinetes} gabinete{c.gabinetes > 1 ? "s" : ""}</p>
                </div>
                <span className="text-sm font-medium text-primary whitespace-nowrap">{c.eleitores.toLocaleString("pt-BR")} eleitores</span>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Eleitores na rede */}
      <Sheet open={eleitoresOpen} onOpenChange={setEleitoresOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">👥 Eleitores na rede</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {cidades.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-sm font-medium text-foreground">{c.cidade}</span>
                <span className="text-sm font-medium text-primary whitespace-nowrap">{c.eleitores.toLocaleString("pt-BR")}</span>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-primary/10 text-center">
              <p className="text-2xl font-medium text-primary whitespace-nowrap">12.000</p>
              <p className="text-xs text-muted-foreground mt-1">Total na rede regional</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Alertas de crise */}
      <Sheet open={alertasOpen} onOpenChange={setAlertasOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">⚠️ Alertas de crise</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {alertas.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <AlertTriangle className={`h-5 w-5 shrink-0 ${a.severidade === "Alta" ? "text-destructive" : "text-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.alerta}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.cidade}</p>
                </div>
                <Badge variant={a.severidade === "Alta" ? "destructive" : "outline"} className="text-xs shrink-0">
                  {a.severidade}
                </Badge>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Gabinetes ativos */}
      <Sheet open={gabineteOpen} onOpenChange={setGabineteOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium">🏛️ Gabinetes ativos</SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            {cidades.flatMap((c) =>
              Array.from({ length: c.gabinetes }, (_, idx) => ({
                nome: `Gabinete ${c.cidade} ${idx + 1}`,
                cidade: c.cidade,
              }))
            ).map((g, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{g.nome}</p>
                  <p className="text-xs text-muted-foreground">{g.cidade}</p>
                </div>
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30">Online</Badge>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Dashboard para System Master (Level 5) com dados reais do Supabase */
function DashboardDeus() {
  const [gabineteOpen, setGabineteOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [servidoresOpen, setServidoresOpen] = useState(false);
  const [incidentesOpen, setIncidentesOpen] = useState(false);

  const {
    gabineteCount, gabinetes,
    incidenteCount, archivedCount,
    recentLogs, recentIncidents,
    isOnline, fmtTime, logTipo,
  } = useSaasStats();

  const backupValue = archivedCount === 0 ? "OK" : `${archivedCount} arq.`;

  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
      <div className="bg-primary rounded-lg -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-6 pt-8 pb-10 mb-2">
        <h1 className="text-2xl md:text-3xl font-medium text-primary-foreground">Painel de controle SaaS</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">System Master — visão completa da infraestrutura</p>
      </div>

      {/* KPI cards — dados reais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MockStatCard icon={<Server className="h-4 w-4" />} value={String(gabineteCount)} label="Gabinetes ativos" onClick={() => setGabineteOpen(true)} />
        <MockStatCard icon={<Database className="h-4 w-4" />} value={backupValue} label="Backup" isText onClick={() => setBackupOpen(true)} />
        <MockStatCard icon={<Activity className="h-4 w-4" />} value={isOnline ? "Online" : "Offline"} label="Servidores" isText onClick={() => setServidoresOpen(true)} />
        <MockStatCard icon={<Shield className="h-4 w-4" />} value={String(incidenteCount)} label="Incidentes" highlight={incidenteCount > 0} onClick={() => setIncidentesOpen(true)} />
      </div>

      {/* Logs em tempo real — audit_logs */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Logs do sistema em tempo real
          </h2>
          {recentLogs.length > 0 ? recentLogs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-10">{fmtTime(log.created_at)}</span>
              <div className={`h-2 w-2 rounded-full shrink-0 ${
                logTipo(log.action) === "error" ? "bg-destructive"
                : logTipo(log.action) === "warning" ? "bg-yellow-500"
                : logTipo(log.action) === "success" ? "bg-green-500"
                : "bg-blue-500"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{log.action}</p>
                <p className="text-[10px] text-muted-foreground">{log.userName}</p>
              </div>
            </div>
          )) : (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma atividade registrada</p>
          )}
        </CardContent>
      </Card>

      {/* BottomSheet — Gabinetes (dados reais) */}
      <Sheet open={gabineteOpen} onOpenChange={setGabineteOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" /> Gabinetes ativos
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {gabinetes.filter((g) => g.is_active).map((g) => (
              <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{g.full_name ?? "Gabinete sem nome"}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{g.id.slice(0, 8)}…</p>
                </div>
                <span className="w-2 h-2 rounded-full shrink-0 ml-3 bg-green-500" />
              </div>
            ))}
            {gabinetes.filter((g) => !g.is_active).map((g) => (
              <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 opacity-50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{g.full_name ?? "Gabinete sem nome"}</p>
                  <p className="text-xs text-muted-foreground">Inativo</p>
                </div>
                <span className="w-2 h-2 rounded-full shrink-0 ml-3 bg-slate-400" />
              </div>
            ))}
            {gabinetes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum gabinete encontrado</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Backup (backup_exclusoes) */}
      <Sheet open={backupOpen} onOpenChange={setBackupOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> Dados arquivados
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-muted/40 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Arquivamento seguro</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {archivedCount} registro{archivedCount !== 1 ? "s" : ""} preservado{archivedCount !== 1 ? "s" : ""} com segurança
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground px-1">
              Registros excluídos são preservados automaticamente antes da remoção definitiva, garantindo rastreabilidade e possibilidade de recuperação.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Servidores (saúde derivada das queries) */}
      <Sheet open={servidoresOpen} onOpenChange={setServidoresOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Status dos servidores
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {[
              { nome: "API principal", regiao: "sa-east-1", uptime: "99,98%", online: isOnline },
              { nome: "Banco de dados", regiao: "sa-east-1", uptime: "99,99%", online: isOnline },
              { nome: "Storage (arquivos)", regiao: "sa-east-1", uptime: "100%", online: isOnline },
              { nome: "CDN (assets)", regiao: "Global", uptime: "100%", online: true },
              { nome: "Queue (jobs)", regiao: "sa-east-1", uptime: "99,95%", online: isOnline },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{s.nome}</p>
                  <p className="text-xs text-muted-foreground">{s.regiao} · uptime {s.uptime}</p>
                </div>
                <Badge className={`text-[10px] ${s.online ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                  {s.online ? "Online" : "Offline"}
                </Badge>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Incidentes (error_logs reais) */}
      <Sheet open={incidentesOpen} onOpenChange={setIncidentesOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Incidentes — últimas 24h
            </SheetTitle>
          </SheetHeader>
          {recentIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
              <p className="text-base font-medium text-foreground">Nenhum incidente</p>
              <p className="text-sm text-muted-foreground mt-1">Todos os sistemas estão operando normalmente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentIncidents.map((inc) => (
                <div key={inc.id} className="p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                  <p className="text-sm font-medium text-foreground">{inc.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">{inc.context || "Sistema"}</p>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <p className="text-[10px] font-mono text-muted-foreground tabular-nums">{fmtTime(inc.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MockStatCard({ icon, value, label, highlight, isText, onClick }: {
  icon: React.ReactNode; value: string; label: string; highlight?: boolean; isText?: boolean; onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={onClick ? "cursor-pointer active:scale-95 transition-transform touch-manipulation select-none" : ""}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${highlight ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
          {icon}
        </div>
        <div>
          <p className={`${isText ? "text-sm" : "text-lg"} font-medium text-foreground whitespace-nowrap`}>{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const Index = () => {
  const { role, simulatedLevel, loading } = useAuth();

  if (loading) return null;

  // When simulating a specific level, show the appropriate dashboard
  if (simulatedLevel !== null) {
    switch (simulatedLevel) {
      case 1: return <DashboardAssessor />;
      case 2: return <DashboardSecretaria />;
      case 3: return <Dashboard />;
      case 4: return <Dashboard />;
      case 5: return <Dashboard />;
    }
  }

  // Normal routing based on actual role
  if (role === "assessor") return <DashboardAssessor />;
  if (role === "super_admin") return <Dashboard />;
  if (role === "vereador") return <Dashboard />;
  if (role === "lider_politico") return <Dashboard />;
  return <Dashboard />;
};

export default Index;
