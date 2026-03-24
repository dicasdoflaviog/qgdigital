import { useState } from "react";
import { Brain, Sparkles, ShieldCheck, PenLine, MapPin, FileText, Mic, ChevronRight, ChevronLeft, Lock, BadgeCheck, Loader2, Zap, Handshake, Swords, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface IAPersonality {
  perfil: "diplomata" | "direto" | "antifragil";
  rigor: "formal" | "sincero";
  linguagem: "institucional" | "informal";
}

interface OnboardingIAModalProps {
  open: boolean;
  onComplete: (iaName: string, personality: IAPersonality) => void;
  level: number;
}

const STEPS = [
  { id: "impact" },
  { id: "examples" },
  { id: "lgpd" },
  { id: "baptism" },
  { id: "personality" },
] as const;

const NAME_SUGGESTIONS = ["Estrategista", "Atena", "Conselheiro", "Analista 01", "Falcão", "Mentor"];

const DNA_PREVIEWS: Record<string, Record<string, string>> = {
  diplomata: {
    formal:   "Entendo sua preocupação. Baseado nos dados do território, sugiro que priorizemos a escuta ativa antes de qualquer comunicado público — isso constrói confiança duradoura.",
    sincero:  "Com todo o respeito, os números desta semana ficaram abaixo do esperado. Sugiro uma revisão honesta da estratégia antes de qualquer comunicado externo.",
  },
  direto: {
    formal:   "Resultado em 3 pontos: (1) o problema existe, (2) temos os dados, (3) precisamos agir esta semana. Qual etapa quer detalhar?",
    sincero:  "Sem enrolação: isso precisa ser resolvido hoje. Me diga quem decide e eu te dou o script exato para a conversa.",
  },
  antifragil: {
    formal:   "Cada obstáculo é dado de campo. Mapeei 3 pontos de resistência — e em cada um há uma abertura que seus concorrentes não enxergam.",
    sincero:  "Adversidade é combustível. Vou te mostrar como transformar essa crítica em narrativa de vitória — mas precisamos agir antes de 48h.",
  },
};

const PERSONALITY_LABELS: Record<string, string> = {
  diplomata: "Diplomata",
  direto: "Direto ao Ponto",
  antifragil: "Antifrágil",
};

const RIGOR_LABELS: Record<string, string> = {
  formal: "Formal",
  sincero: "Sincero ao Extremo",
};

const PERFIL_OPTIONS = [
  { value: "diplomata" as const, label: "Diplomata", desc: "Polido, formal e cauteloso", icon: Handshake, color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" },
  { value: "direto" as const, label: "Direto ao Ponto", desc: "Sem rodeios, focado em números e resultados", icon: Swords, color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  { value: "antifragil" as const, label: "Antifrágil", desc: "Questiona, aponta falhas e exige mais produtividade", icon: Shield, color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
];

const RIGOR_OPTIONS = [
  { value: "formal" as const, label: "Institucional", desc: "Segue normas cultas, tom profissional" },
  { value: "sincero" as const, label: "Sincero ao Extremo", desc: "Sem papas na língua sobre produtividade e problemas" },
];

const LINGUAGEM_OPTIONS = [
  { value: "institucional" as const, label: "Institucional", desc: "Linguagem culta e técnica" },
  { value: "informal" as const, label: "Informal", desc: "Linguagem do povo, gírias regionais" },
];

export function OnboardingIAModal({ open, onComplete, level }: OnboardingIAModalProps) {
  const [step, setStep] = useState(0);
  const [iaName, setIaName] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [personality, setPersonality] = useState<IAPersonality>({
    perfil: "diplomata",
    rigor: "formal",
    linguagem: "institucional",
  });

  const levelLabel = level >= 5 ? "Master" : level >= 4 ? "Líder" : "Vereador";

  const handleFinish = async (e?: React.MouseEvent) => {
    // Prevent default for Safari/iOS compatibility
    e?.preventDefault();
    e?.stopPropagation();
    if (!iaName.trim() || isActivating) return;
    setIsActivating(true);
    try {
      await new Promise(r => setTimeout(r, 2200));
      onComplete(iaName.trim(), personality);
    } catch {
      // Parent handles errors
    } finally {
      setIsActivating(false);
    }
  };

  const canAdvanceFromBaptism = iaName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-lg p-0 bg-slate-950 border-slate-800 overflow-hidden gap-0 [&>button]:hidden"
        style={{
          // iOS Safari: usa dvh (dynamic viewport height) para descontar a barra do browser
          maxHeight: "min(90dvh, 90vh)",
          display: "flex",
          flexDirection: "column",
        }}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Activation overlay */}
        {isActivating && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm animate-fade-in">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 flex items-center justify-center border border-amber-500/20">
                <Zap className="h-10 w-10 text-amber-400 animate-pulse" />
              </div>
              <div className="absolute -inset-3 rounded-3xl border border-amber-500/10 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-white mb-1">Sincronizando Dados do Gabinete</p>
            <p className="text-[11px] text-slate-500">Preparando {iaName} para operar...</p>
            <div className="mt-4 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
              <span className="text-xs text-slate-400">Conectando ao ambiente seguro</span>
            </div>
          </div>
        )}

        {/* Progress dots — fixo no topo, não rola */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2 shrink-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-amber-400" : i < step ? "w-4 bg-amber-400/40" : "w-4 bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Área scrollável — cresce até o limite do modal, empurra botões para baixo */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pt-2 min-h-0">
          {/* Step 1: Impact */}
          {step === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 animate-fade-in">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
                <Brain className="h-10 w-10 text-amber-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-medium text-white">
                  Seu Gabinete agora tem um<br />
                  <span className="text-amber-400">Cérebro Digital</span>
                </h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Uma inteligência artificial que analisa seus eleitores, demandas e bairros em tempo real — 
                  transformando dados em <strong className="text-slate-300">decisões estratégicas</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] text-slate-400">Conectado ao seu gabinete · Nível {level}</span>
              </div>
            </div>
          )}

          {/* Step 2: Examples */}
          {step === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 animate-fade-in">
              <h2 className="text-lg font-medium text-white">O que a IA pode fazer por você?</h2>
              <p className="text-xs text-slate-500 -mt-3">Toque em um exemplo para ver</p>
              <div className="w-full space-y-3 max-w-sm">
                {[
                  { icon: MapPin, color: "text-blue-400", bg: "bg-blue-500/15", title: "Analisar Bairros", desc: "\"Quais bairros têm mais demandas pendentes?\"" },
                  { icon: FileText, color: "text-emerald-400", bg: "bg-emerald-500/15", title: "Resumir Demandas", desc: "\"Me dê um resumo das pendências do gabinete\"" },
                  { icon: Mic, color: "text-qg-blue-400", bg: "bg-qg-blue-500/15", title: "Criar Ofícios por Voz", desc: "\"Transcreva meu áudio e transforme em ofício\"" },
                ].map((item) => (
                  <button key={item.title} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/30 transition-all text-left group">
                    <div className={`shrink-0 h-10 w-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Privacy & Security */}
          {step === 2 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 animate-fade-in">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 flex items-center justify-center border border-emerald-500/25 shadow-[0_0_30px_-5px_hsl(160,80%,40%,0.15)]">
                <ShieldCheck className="h-10 w-10 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-medium text-white">Privacidade e Segurança Absoluta</h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  A IA foi projetada para ser uma extensão privada do seu cérebro estratégico. 
                  Cada dado processado é <strong className="text-slate-300">criptografado</strong> e permanece dentro do ambiente restrito do seu mandato.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                {[
                  { icon: ShieldCheck, text: "Ambiente exclusivo — seus dados nunca saem do seu mandato" },
                  { icon: Lock, text: "Criptografia de ponta — CPF, RG e dados sensíveis bloqueados por padrão" },
                  { icon: BadgeCheck, text: "Conformidade total com a Lei Geral de Proteção de Dados (LGPD)" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <div className="shrink-0 h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <span className="text-xs text-slate-300 text-left">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-center gap-1.5 opacity-50">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] text-slate-500 tracking-wider uppercase font-medium">Certificado de Segurança QG Digital</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Baptism */}
          {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 animate-fade-in">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 flex items-center justify-center border border-amber-500/20">
                <PenLine className="h-10 w-10 text-amber-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-medium text-white">Dê um nome ao seu Assistente de Gabinete</h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Esse será o nome da inteligência que trabalha exclusivamente para o seu mandato, {levelLabel}.
                </p>
              </div>
              <Input
                value={iaName}
                onChange={e => setIaName(e.target.value)}
                placeholder="Digite o nome do assistente..."
                className="bg-slate-800 border-slate-700 text-white max-w-xs text-center text-lg font-medium placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20"
                maxLength={30}
                autoFocus
              />
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-xs">
                {NAME_SUGGESTIONS.map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setIaName(suggestion)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      iaName === suggestion
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-amber-500/30 hover:text-slate-300"
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Personality DNA */}
          {step === 4 && (
            <div className="flex-1 flex flex-col space-y-5 animate-fade-in overflow-y-auto overscroll-contain pb-2">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-medium text-white">Personalidade do {iaName || "Assistente"}</h2>
                <p className="text-xs text-slate-500">Defina como a IA vai se comunicar com você</p>
              </div>

              {/* Perfil */}
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 font-medium">Postura Estratégica</p>
                <div className="space-y-2">
                  {PERFIL_OPTIONS.map(opt => {
                    const selected = personality.perfil === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setPersonality(p => ({ ...p, perfil: opt.value }))}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          selected
                            ? `bg-slate-800 ${opt.border}`
                            : "bg-slate-800/40 border-slate-700/30 hover:border-slate-600"
                        }`}
                      >
                        <div className={`shrink-0 h-9 w-9 rounded-lg ${opt.bg} flex items-center justify-center`}>
                          <opt.icon className={`h-5 w-5 ${opt.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${selected ? "text-white" : "text-slate-300"}`}>{opt.label}</p>
                          <p className="text-[11px] text-slate-500 truncate">{opt.desc}</p>
                        </div>
                        {selected && (
                          <div className="shrink-0 h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rigor */}
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 font-medium">Nível de Rigor</p>
                <div className="grid grid-cols-2 gap-2">
                  {RIGOR_OPTIONS.map(opt => {
                    const selected = personality.rigor === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setPersonality(p => ({ ...p, rigor: opt.value }))}
                        className={`p-3 rounded-xl border transition-all text-left ${
                          selected
                            ? "bg-slate-800 border-amber-500/30"
                            : "bg-slate-800/40 border-slate-700/30 hover:border-slate-600"
                        }`}
                      >
                        <p className={`text-xs font-medium ${selected ? "text-white" : "text-slate-300"}`}>{opt.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Linguagem */}
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 font-medium">Linguagem</p>
                <div className="grid grid-cols-2 gap-2">
                  {LINGUAGEM_OPTIONS.map(opt => {
                    const selected = personality.linguagem === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setPersonality(p => ({ ...p, linguagem: opt.value }))}
                        className={`p-3 rounded-xl border transition-all text-left ${
                          selected
                            ? "bg-slate-800 border-amber-500/30"
                            : "bg-slate-800/40 border-slate-700/30 hover:border-slate-600"
                        }`}
                      >
                        <p className={`text-xs font-medium ${selected ? "text-white" : "text-slate-300"}`}>{opt.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview dinâmico por DNA */}
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-3">
                <p className="text-[10px] text-slate-500 mb-2">
                  Prévia — como {iaName || "sua IA"} vai responder
                </p>
                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <span className="text-amber-400 text-[10px] font-medium">
                      {(iaName || "IA").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-800 rounded-xl rounded-tl-sm px-3 py-2">
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{DNA_PREVIEWS[personality.perfil]?.[personality.rigor] ?? "Configure o perfil acima para ver a prévia."}"
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 text-center">
                  {PERSONALITY_LABELS[personality.perfil]} · {RIGOR_LABELS[personality.rigor]}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Navegação — fora da área scrollável, sempre visível no bottom (Safari iOS safe) */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0 border-t border-slate-800/60 bg-slate-950"
          style={{
            // Garante que fique acima do virtual keyboard no iOS
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0 || isActivating}
            className="text-slate-400 hover:text-white min-h-[44px] px-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>

          {step < 3 ? (
            <Button
              size="sm"
              onClick={() => setStep(s => s + 1)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium min-h-[44px] px-5 shadow-[0_0_16px_-2px_hsl(38,92%,50%,0.4)] hover:shadow-[0_0_24px_-2px_hsl(38,92%,50%,0.55)] transition-shadow"
            >
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : step === 3 ? (
            <Button
              size="sm"
              onClick={() => setStep(4)}
              disabled={!canAdvanceFromBaptism}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium min-h-[44px] px-5 shadow-[0_0_16px_-2px_hsl(38,92%,50%,0.4)] hover:shadow-[0_0_24px_-2px_hsl(38,92%,50%,0.55)] transition-shadow disabled:opacity-40 disabled:shadow-none"
            >
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={(e) => handleFinish(e)}
              disabled={isActivating}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium min-h-[44px] px-5 shadow-[0_0_16px_-2px_hsl(38,92%,50%,0.4)] hover:shadow-[0_0_24px_-2px_hsl(38,92%,50%,0.55)] transition-shadow disabled:opacity-40 disabled:shadow-none"
            >
              <Sparkles className="h-4 w-4 mr-1" /> Finalizar e Ativar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
