import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  Users, Cake, MessageCircle, BookOpen,
  ChevronRight, Target, Clock, FileText, CheckCircle2, AlertTriangle,
  Phone, Star, Plus, CalendarDays, MapPin, Trophy, X, Award,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useMyEleitores, useMyMonthlyCount, useMyTopBairro } from "@/hooks/useDashboardData";
import { CadastroModal } from "@/components/eleitores/CadastroModal";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { MinhasSugestoes } from "@/components/dashboard/MinhasSugestoes";

import { eleitores as mockEleitores } from "@/data/mockData";
import { oficios as mockOficios, isAtrasado, OFICIO_STATUS_CONFIG } from "@/data/oficiosData";

const META_MENSAL = 50;

interface ContatoFavorito {
  id: string;
  nome: string;
  cargo_funcao: string | null;
  instituicao: string | null;
  whatsapp: string;
  categoria: string;
}

export default function DashboardAssessor() {
  const { profile, isImpersonating } = useAuth();
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState<ContatoFavorito[]>([]);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const celebrationFired = useRef(false);
  const { data: meusEleitoresReais = [] } = useMyEleitores();
  const { data: monthlyCount = 0 } = useMyMonthlyCount();
  const { data: topBairro } = useMyTopBairro();

  const useMock = isImpersonating || meusEleitoresReais.length === 0;

  const meusEleitores = useMock
    ? mockEleitores.filter((e) => e.assessorId === "a1")
    : meusEleitoresReais;

  const cadastrosEsteMes = useMock
    ? (() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return mockEleitores.filter((e) => e.assessorId === "a1" && new Date(e.criadoEm) >= startOfMonth).length;
      })()
    : monthlyCount;

  const progressPercent = Math.min((cadastrosEsteMes / META_MENSAL) * 100, 100);
  const metaBatida = cadastrosEsteMes >= META_MENSAL;

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ["#1e3a5f", "#2563eb", "#f59e0b", "#10b981"], zIndex: 9999 });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ["#1e3a5f", "#2563eb", "#f59e0b", "#10b981"], zIndex: 9999 });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  useEffect(() => {
    if (metaBatida && !celebrationFired.current) {
      const monthKey = `qg-meta-celebrated-${new Date().getFullYear()}-${new Date().getMonth()}`;
      if (!localStorage.getItem(monthKey)) {
        celebrationFired.current = true;
        localStorage.setItem(monthKey, "true");
        setTimeout(() => { setCelebrationOpen(true); fireConfetti(); }, 600);
      }
    }
  }, [metaBatida, fireConfetti]);

  const bairroPrincipal = useMock ? "Centro" : (topBairro ?? "sua região");

  const aniversariantes = useMemo(() => {
    const today = new Date();
    const m = today.getMonth();
    const d = today.getDate();
    return meusEleitores.filter((e: any) => {
      const dateField = e.dataNascimento || e.data_nascimento;
      if (!dateField) return false;
      const dn = new Date(dateField + "T12:00:00");
      return dn.getMonth() === m && dn.getDate() === d;
    });
  }, [meusEleitores]);

  const minhasDemandas = useMock ? mockOficios.slice(0, 5) : [];
  const pendencias = minhasDemandas.filter((o) => o.status !== "resolvido").length;
  const oficiosGerados = minhasDemandas.length;

  useEffect(() => {
    supabase
      .from("contatos_estrategicos")
      .select("id, nome, cargo_funcao, instituicao, whatsapp, categoria")
      .limit(3)
      .then(({ data }) => { if (data) setFavoritos(data as ContatoFavorito[]); });
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] || "Assessor";

  return (
    <div className="p-4 md:p-6 space-y-5 pb-28">
      {/* ── HEADER ── */}
      <div className="animate-fade-in text-center pt-2">
        <div className="flex items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground font-medium">
            Olá, {firstName}! 👋
          </p>
          {metaBatida && (
            <Badge className="text-[9px] px-1.5 py-0 bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0 font-bold uppercase tracking-wider gap-0.5 animate-fade-in">
              <Award className="h-2.5 w-2.5" />
              Destaque
            </Badge>
          )}
        </div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mt-1">
          Meu Painel
        </h1>
        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
          <MapPin className="h-3 w-3" />
          Bom trabalho hoje em <span className="font-semibold text-foreground">{bairroPrincipal}</span>
        </p>
      </div>

      {/* ── META CARD ── */}
      <Card className="bg-card rounded-2xl shadow-sm border-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Sua Meta Mensal
            </span>
            <span className="text-xs font-bold text-foreground">
              {cadastrosEsteMes}/{META_MENSAL}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5 rounded-full" />
        </CardContent>
      </Card>

      {/* ── BOTÃO DE ÁUDIO ── */}
      <div className="flex justify-center animate-fade-up" style={{ animationDelay: "200ms" }}>
        <CadastroModal />
      </div>

      {/* ── AÇÕES RÁPIDAS ── */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "300ms" }}>
        {[
          { icon: Plus, label: "Novo Cadastro", route: "/eleitores" },
          { icon: BookOpen, label: "Guia Soluções", route: "/guia" },
          { icon: CalendarDays, label: "Agenda", route: "/agenda" },
        ].map(({ icon: Icon, label, route }) => (
          <Card
            key={label}
            className="bg-card rounded-2xl shadow-sm border-0 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(route)}
          >
            <CardContent className="p-4 flex flex-col items-center gap-2.5 text-center">
              <Icon className="h-6 w-6 text-primary" />
              <span className="text-[11px] font-medium text-foreground leading-tight">
                {label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── MÉTRICAS ── */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "400ms" }}>
        {[
          { value: meusEleitores.length, label: "Meus Cadastros" },
          { value: pendencias, label: "Pendências", alert: pendencias > 0 },
          { value: oficiosGerados, label: "Ofícios Gerados" },
        ].map(({ value, label, alert }) => (
          <Card key={label} className="bg-card rounded-2xl shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
              {alert && (
                <span className="text-[8px] font-semibold text-destructive mt-1 block">Atenção</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── ANIVERSARIANTES ── */}
      {aniversariantes.length > 0 && (
        <Card className="animate-fade-up rounded-2xl shadow-sm border-0 bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Cake className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">
                {aniversariantes.length} aniversariante{aniversariantes.length > 1 ? "s" : ""} hoje!
              </p>
              <p className="text-[10px] text-muted-foreground">Envie uma mensagem de parabéns 🎂</p>
            </div>
            <span className="text-[10px] font-semibold text-primary">Hoje</span>
          </CardContent>
        </Card>
      )}

      {/* ── DEMANDAS ── */}
      {minhasDemandas.length > 0 && (
        <div className="animate-fade-up space-y-2.5">
          {minhasDemandas.map((o) => {
            const statusConf = OFICIO_STATUS_CONFIG[o.status];
            const atrasado = isAtrasado(o);
            const step = statusConf?.step || 0;
            const totalSteps = Object.keys(OFICIO_STATUS_CONFIG).length;
            const demandaProgress = (step / totalSteps) * 100;

            return (
              <Card
                key={o.id}
                className="rounded-2xl shadow-sm border-0 bg-card"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold truncate text-foreground">{o.titulo}</p>
                        <Badge className="text-[8px] font-medium rounded-full bg-primary/10 text-primary border-0 px-2 py-0.5 shrink-0">
                          {atrasado && <AlertTriangle className="h-2 w-2 mr-0.5" />}
                          {o.status === "resolvido" && <CheckCircle2 className="h-2 w-2 mr-0.5" />}
                          {statusConf?.label || o.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-2.5 w-2.5" />
                        Nº {o.numero} · {o.bairro}
                      </p>
                    </div>
                  </div>
                  <Progress value={demandaProgress} className="h-1.5 rounded-full" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── FAVORITOS ── */}
      {favoritos.length > 0 && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" /> Contatos Favoritos
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] text-muted-foreground font-medium h-6 px-2"
              onClick={() => navigate("/guia")}
            >
              Ver todos <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>
          <div className="grid gap-2.5">
            {favoritos.map((c) => (
              <Card key={c.id} className="rounded-2xl shadow-sm border-0 bg-card">
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate text-foreground">{c.nome}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {c.cargo_funcao}{c.cargo_funcao && c.instituicao ? " · " : ""}{c.instituicao}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.whatsapp && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" asChild>
                        <a
                          href={`https://wa.me/55${c.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Olá ${c.nome}, aqui é ${profile?.full_name || "o assessor"} do Gabinete do Vereador. Preciso de um auxílio rápido, pode me ajudar?`
                          )}`}
                          target="_blank" rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-4 w-4 text-primary" />
                        </a>
                      </Button>
                    )}
                    {c.whatsapp && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" asChild>
                        <a href={`tel:+55${c.whatsapp.replace(/\D/g, "")}`}>
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── SUGESTÕES ── */}
      <MinhasSugestoes firstName={firstName} />

      {/* ── ÚLTIMOS CADASTROS ── */}
      <div className="animate-fade-up">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Últimos Cadastros
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] text-muted-foreground font-medium h-6 px-2"
            onClick={() => navigate("/eleitores")}
          >
            Ver todos <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>
        <div className="space-y-2.5">
          {meusEleitores.slice(0, 5).map((e: any) => (
            <Card
              key={e.id}
              className="rounded-2xl shadow-sm border-0 bg-card"
            >
              <CardContent className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center bg-primary/10 text-primary rounded-full shrink-0 text-[10px] font-bold uppercase">
                    {(e.nome || "?").charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate text-foreground">{e.nome}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {e.bairro} · {e.situacao}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl" asChild>
                  <a href={`https://wa.me/${(e.whatsapp || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-3.5 w-3.5 text-primary" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
          {meusEleitores.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum cadastro ainda. Comece agora!</p>
          )}
        </div>
      </div>

      {/* ── CELEBRAÇÃO ── */}
      <Dialog open={celebrationOpen} onOpenChange={setCelebrationOpen}>
        <DialogContent className="max-w-sm text-center rounded-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-20 w-20 items-center justify-center bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full animate-scale-in shadow-lg">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <DialogHeader className="text-center space-y-2">
              <DialogTitle className="text-xl font-semibold text-foreground">
                🏅 Meta Batida!
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground leading-relaxed px-2">
              Parabéns, <span className="font-semibold text-foreground">{firstName}</span>! Você atingiu seu objetivo de campo este mês.
            </p>
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0 font-semibold uppercase tracking-wider gap-1 px-3 py-1">
              <Award className="h-3.5 w-3.5" />
              Destaque do Mês
            </Badge>
            <Button
              className="w-full mt-2 h-12 font-semibold text-sm rounded-xl"
              onClick={() => setCelebrationOpen(false)}
            >
              Continuar Trabalhando 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
