import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
      <div className="bg-primary rounded-lg -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-6 pt-8 pb-10 mb-2">
        <h1 className="text-2xl md:text-3xl font-medium text-primary-foreground">Painel da secretaria</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">Agenda e gestão do gabinete</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MockStatCard icon={<CalendarDays className="h-4 w-4" />} value="3" label="Reuniões Hoje" />
        <MockStatCard icon={<FileText className="h-4 w-4" />} value="5" label="Ofícios Pendentes" highlight />
        <MockStatCard icon={<Users className="h-4 w-4" />} value="328" label="Eleitores Ativos" />
        <MockStatCard icon={<CheckCircle2 className="h-4 w-4" />} value="12" label="Ofícios Concluídos" />
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Agenda de hoje
          </h2>
          {[
            { hora: "09:00", titulo: "Reunião com líder comunitário - Bairro Centro", tipo: "Reunião" },
            { hora: "11:30", titulo: "Entrega de ofício na Câmara Municipal", tipo: "Protocolo" },
            { hora: "14:00", titulo: "Atendimento ao público - Gabinete", tipo: "Atendimento" },
          ].map((item, i) => (
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
          {[
            { numero: "OF-2026/045", titulo: "Solicitação de iluminação - Bairro Jardim", dias: 3 },
            { numero: "OF-2026/046", titulo: "Requerimento de poda de árvores - Centro", dias: 2 },
            { numero: "OF-2026/047", titulo: "Pedido de recapeamento - Vila Nova", dias: 1 },
            { numero: "OF-2026/048", titulo: "Solicitação de sinalização - Av. Principal", dias: 5 },
            { numero: "OF-2026/049", titulo: "Requerimento de limpeza - Praça Central", dias: 1 },
          ].map((item, i) => (
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
    </div>
  );
}

/** Mock dashboard for Vereador (Level 3) simulation */
function DashboardVereador() {
  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
      <div className="bg-primary rounded-lg -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-6 pt-8 pb-10 mb-2">
        <h1 className="text-2xl md:text-3xl font-medium text-primary-foreground">Dashboard do vereador</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">Performance e emendas do mandato</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MockStatCard icon={<Landmark className="h-4 w-4" />} value="R$ 2M" label="Investimento Total" isText />
        <MockStatCard icon={<Trophy className="h-4 w-4" />} value="João" label="1º Ranking" isText />
        <MockStatCard icon={<Users className="h-4 w-4" />} value="1.250" label="Base Total" />
        <MockStatCard icon={<FileText className="h-4 w-4" />} value="48" label="Ofícios Protocolados" />
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Ranking de assessores
          </h2>
          {[
            { nome: "João Silva", cadastros: 312, posicao: 1 },
            { nome: "Maria Santos", cadastros: 287, posicao: 2 },
            { nome: "Pedro Costa", cadastros: 245, posicao: 3 },
          ].map((a) => (
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
          {[
            { titulo: "Reforma da UBS Centro", valor: "R$ 500.000", status: "Em execução" },
            { titulo: "Pavimentação Rua das Flores", valor: "R$ 350.000", status: "Empenhada" },
            { titulo: "Equipamentos para Escola Municipal", valor: "R$ 200.000", status: "Indicada" },
          ].map((e, i) => (
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
    </div>
  );
}

/** Mock dashboard for Super Admin Level 4 simulation */
function DashboardSuperAdmin() {
  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
      <div className="bg-primary rounded-lg -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-6 pt-8 pb-10 mb-2">
        <h1 className="text-2xl md:text-3xl font-medium text-primary-foreground">Observatório regional</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">Dados consolidados da rede política</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MockStatCard icon={<MapPin className="h-4 w-4" />} value="5" label="Cidades Monitoradas" />
        <MockStatCard icon={<Users className="h-4 w-4" />} value="12.000" label="Eleitores na Rede" />
        <MockStatCard icon={<AlertTriangle className="h-4 w-4" />} value="3" label="Alertas de Crise" highlight />
        <MockStatCard icon={<Shield className="h-4 w-4" />} value="8" label="Gabinetes Ativos" />
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Alertas de crise regionais
          </h2>
          {[
            { cidade: "Cidade A", alerta: "Falta de água - Bairro Norte", severidade: "Alta" },
            { cidade: "Cidade B", alerta: "Queda de energia recorrente - Centro", severidade: "Média" },
            { cidade: "Cidade C", alerta: "Alagamento após chuvas - Vila Sul", severidade: "Alta" },
          ].map((a, i) => (
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
          {[
            { cidade: "Cidade A", eleitores: 3500, gabinetes: 2 },
            { cidade: "Cidade B", eleitores: 2800, gabinetes: 2 },
            { cidade: "Cidade C", eleitores: 2200, gabinetes: 1 },
            { cidade: "Cidade D", eleitores: 1800, gabinetes: 2 },
            { cidade: "Cidade E", eleitores: 1700, gabinetes: 1 },
          ].map((c, i) => (
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
    </div>
  );
}

/** Mock dashboard for Deus Level 5 simulation */
function DashboardDeus() {
  const [gabineteOpen, setGabineteOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [servidoresOpen, setServidoresOpen] = useState(false);
  const [incidentesOpen, setIncidentesOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
      <div className="bg-primary rounded-lg -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-6 pt-8 pb-10 mb-2">
        <h1 className="text-2xl md:text-3xl font-medium text-primary-foreground">Painel de controle SaaS</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">System Master — visão completa da infraestrutura</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MockStatCard icon={<Server className="h-4 w-4" />} value="12" label="Gabinetes ativos" onClick={() => setGabineteOpen(true)} />
        <MockStatCard icon={<Database className="h-4 w-4" />} value="100%" label="Backup OK" onClick={() => setBackupOpen(true)} />
        <MockStatCard icon={<Activity className="h-4 w-4" />} value="Online" label="Servidores" isText onClick={() => setServidoresOpen(true)} />
        <MockStatCard icon={<Shield className="h-4 w-4" />} value="0" label="Incidentes" onClick={() => setIncidentesOpen(true)} />
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Logs do sistema em tempo real
          </h2>
          {[
            { hora: "14:32", acao: "Backup automático concluído", user: "Sistema", tipo: "info" },
            { hora: "14:15", acao: "Novo gabinete registrado: Vereador Marcos", user: "Admin", tipo: "success" },
            { hora: "13:58", acao: "Eleitor excluído por assessor (ID: a3)", user: "João Silva", tipo: "warning" },
            { hora: "13:42", acao: "Login falho detectado (3 tentativas)", user: "IP: 192.168.1.x", tipo: "error" },
            { hora: "13:30", acao: "Sincronização de dados concluída", user: "Sistema", tipo: "info" },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-10">{log.hora}</span>
              <div className={`h-2 w-2 rounded-full shrink-0 ${
                log.tipo === "error" ? "bg-destructive" : log.tipo === "warning" ? "bg-yellow-500" : log.tipo === "success" ? "bg-green-500" : "bg-blue-500"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{log.acao}</p>
                <p className="text-[10px] text-muted-foreground">{log.user}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* BottomSheet — Gabinetes ativos */}
      <Sheet open={gabineteOpen} onOpenChange={setGabineteOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" /> Gabinetes ativos
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {[
              { nome: "Vereador Marcos Silva", cidade: "Cidade A", eleitores: 1250, status: "online" },
              { nome: "Vereadora Ana Costa", cidade: "Cidade B", eleitores: 980, status: "online" },
              { nome: "Vereador Pedro Santos", cidade: "Cidade C", eleitores: 820, status: "online" },
              { nome: "Vereador Carlos Lima", cidade: "Cidade A", eleitores: 740, status: "online" },
              { nome: "Vereadora Rita Souza", cidade: "Cidade D", eleitores: 610, status: "offline" },
            ].map((g, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{g.nome}</p>
                  <p className="text-xs text-muted-foreground">{g.cidade} · {g.eleitores.toLocaleString("pt-BR")} eleitores</p>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ml-3 ${g.status === "online" ? "bg-green-500" : "bg-slate-400"}`} />
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Backup */}
      <Sheet open={backupOpen} onOpenChange={setBackupOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> Histórico de backups
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {[
              { data: "Hoje 14:32", tipo: "Automático", tamanho: "2,4 GB", status: "ok" },
              { data: "Ontem 14:30", tipo: "Automático", tamanho: "2,3 GB", status: "ok" },
              { data: "22/03 14:31", tipo: "Automático", tamanho: "2,3 GB", status: "ok" },
              { data: "21/03 14:29", tipo: "Manual", tamanho: "2,2 GB", status: "ok" },
              { data: "20/03 14:33", tipo: "Automático", tamanho: "2,2 GB", status: "ok" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{b.data}</p>
                  <p className="text-xs text-muted-foreground">{b.tipo} · {b.tamanho}</p>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Servidores */}
      <Sheet open={servidoresOpen} onOpenChange={setServidoresOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Status dos servidores
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {[
              { nome: "API Principal", regiao: "sa-east-1", uptime: "99,98%", status: "online" },
              { nome: "Banco de dados", regiao: "sa-east-1", uptime: "99,99%", status: "online" },
              { nome: "Storage (arquivos)", regiao: "sa-east-1", uptime: "100%", status: "online" },
              { nome: "CDN (assets)", regiao: "Global", uptime: "100%", status: "online" },
              { nome: "Queue (jobs)", regiao: "sa-east-1", uptime: "99,95%", status: "online" },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{s.nome}</p>
                  <p className="text-xs text-muted-foreground">{s.regiao} · uptime {s.uptime}</p>
                </div>
                <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">Online</Badge>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* BottomSheet — Incidentes */}
      <Sheet open={incidentesOpen} onOpenChange={setIncidentesOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-medium flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Incidentes
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-base font-medium text-foreground">Nenhum incidente ativo</p>
            <p className="text-sm text-muted-foreground mt-1">Todos os sistemas estão operando normalmente</p>
          </div>
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
      case 3: return <DashboardVereador />;
      case 4: return <DashboardSuperAdmin />;
      case 5: return <DashboardDeus />;
    }
  }

  // Normal routing based on actual role
  if (role === "assessor") return <DashboardAssessor />;
  if (role === "super_admin") return <DashboardDeus />;
  return <Dashboard />;
};

export default Index;
