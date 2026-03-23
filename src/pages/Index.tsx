import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";
import DashboardAssessor from "./DashboardAssessor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, CalendarDays, FileText, Landmark, MapPin, Server,
  Shield, Database, Activity, AlertTriangle, CheckCircle2, Trophy
} from "lucide-react";

/** Mock dashboard for Secretária (Level 2) simulation */
function DashboardSecretaria() {
  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
      <div className="bg-primary rounded-lg -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-6 pt-8 pb-10 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">Painel da Secretaria</h1>
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
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Agenda de Hoje
          </h2>
          {[
            { hora: "09:00", titulo: "Reunião com líder comunitário - Bairro Centro", tipo: "Reunião" },
            { hora: "11:30", titulo: "Entrega de ofício na Câmara Municipal", tipo: "Protocolo" },
            { hora: "14:00", titulo: "Atendimento ao público - Gabinete", tipo: "Atendimento" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs font-bold text-primary tabular-nums w-12">{item.hora}</span>
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
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Ofícios Pendentes de Assinatura
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
        <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">Dashboard do Vereador</h1>
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
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Ranking de Assessores
          </h2>
          {[
            { nome: "João Silva", cadastros: 312, posicao: 1 },
            { nome: "Maria Santos", cadastros: 287, posicao: 2 },
            { nome: "Pedro Costa", cadastros: 245, posicao: 3 },
          ].map((a) => (
            <div key={a.posicao} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${a.posicao === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
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
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" /> Emendas em Destaque
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
        <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">Observatório Regional</h1>
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
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Alertas de Crise Regionais
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
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Performance por Cidade
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
              <span className="text-xs font-bold text-primary">{c.eleitores.toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/** Mock dashboard for Deus Level 5 simulation */
function DashboardDeus() {
  return (
    <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
      <div className="bg-primary rounded-lg -mx-4 -mt-4 md:-mx-6 md:-mt-6 px-6 pt-8 pb-10 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">Painel de Controle SaaS</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">System Master — Visão completa da infraestrutura</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MockStatCard icon={<Server className="h-4 w-4" />} value="12" label="Gabinetes Ativos" />
        <MockStatCard icon={<Database className="h-4 w-4" />} value="100%" label="Backup OK" />
        <MockStatCard icon={<Activity className="h-4 w-4" />} value="Online" label="Servidores" isText />
        <MockStatCard icon={<Shield className="h-4 w-4" />} value="0" label="Incidentes" />
      </div>
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Logs do Sistema em Tempo Real
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
    </div>
  );
}

function MockStatCard({ icon, value, label, highlight, isText }: {
  icon: React.ReactNode; value: string; label: string; highlight?: boolean; isText?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${highlight ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
          {icon}
        </div>
        <div>
          <p className={`${isText ? "text-sm" : "text-lg"} font-semibold text-foreground`}>{value}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
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
