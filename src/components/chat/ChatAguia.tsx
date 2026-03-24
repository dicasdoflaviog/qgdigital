import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, Loader2, Mic, MicOff, Trash2, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import { useGabineteConfig } from "@/hooks/useGabineteConfig";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { OnboardingIAModal, type IAPersonality } from "./OnboardingIAModal";

type Msg = { role: "user" | "assistant"; content: string; created_at?: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-aguia`;

function getSuggestions(level: number): { label: string; message: string }[] {
  if (level >= 5) {
    return [
      { label: "📊 Métricas de Uso", message: "Quais são as métricas de uso do sistema hoje? Quantos gabinetes ativos, eleitores cadastrados e MRR atual?" },
      { label: "🏛️ Status dos Gabinetes", message: "Qual o status de todos os gabinetes cadastrados? Algum está inativo ou sem atividade recente?" },
      { label: "🔧 Ajuda com Config", message: "Me ajude com as configurações globais do sistema. Quais parâmetros preciso revisar?" },
    ];
  }
  if (level >= 4) {
    return [
      { label: "📈 Desempenho Comparado", message: "Quais cidades do Extremo Sul estão com mais demandas resolvidas este mês? Compare a performance dos vereadores." },
      { label: "⚠️ Alerta de Inatividade", message: "Quais gabinetes não cadastraram novos eleitores nesta semana? Identifique os inativos." },
      { label: "🗺️ Tendências Regionais", message: "Qual o problema mais recorrente na região de Itamaraju e Prado no momento? Me dê estatísticas agregadas." },
    ];
  }
  return [
    { label: "☀️ Resumo do Dia", message: "Quais são as 3 demandas mais críticas hoje e quem são os eleitores envolvidos? Me dê um resumo executivo." },
    { label: "🏘️ Análise de Solo", message: "Em qual bairro tive menos atividade nos últimos 30 dias? Sugira ações para esse bairro." },
    { label: "📋 Preparação de Reunião", message: "Vou me reunir com o Secretário de Obras. Me dê um relatório de todas as demandas de infraestrutura pendentes." },
    { label: "💡 Engajamento", message: "Me dê dicas de engajamento com eleitores baseadas nos dados do meu gabinete." },
  ];
}

function getWelcome(level: number, iaName: string): string {
  const levelLabel = level >= 5 ? "Master" : level >= 4 ? "Líder" : "Vereador";
  return `Olá ${levelLabel}, eu sou a **${iaName}**, sua nova assistente. O que vamos conquistar hoje? 🚀\n\n🔒 Seus dados estão protegidos pela LGPD.`;
}

function InteractiveMarkdown({ content }: { content: string }) {
  const navigate = useNavigate();

  const handleLinkClick = (href: string) => {
    if (href.startsWith("demanda://")) {
      navigate(`/dashboard?demanda=${href.replace("demanda://", "")}`);
    } else if (href.startsWith("eleitor://")) {
      navigate(`/eleitores?perfil=${href.replace("eleitor://", "")}`);
    }
  };

  return (
    <div className="prose prose-sm prose-invert max-w-none">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            if (href && (href.startsWith("demanda://") || href.startsWith("eleitor://"))) {
              return (
                <button
                  onClick={() => handleLinkClick(href)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-medium transition-colors border border-amber-500/30 no-underline"
                >
                  {children}
                </button>
              );
            }
            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function ChatAguia() {
  const { roleLevel, simulatedLevel, session, user, profile, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const effectiveLevel = simulatedLevel ?? roleLevel;
  const { config: gabConfig, upsert: upsertConfig, gabineteId } = useGabineteConfig();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false); // Optimistic guard to prevent loop
  const [isRecording, setIsRecording] = useState(false);
  const [pendingTranscription, setPendingTranscription] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const iaName = gabConfig?.ia_nome || profile?.assistant_name || "Assistente";
  const isNamed = !!gabConfig?.ia_nome
    || !!profile?.assistant_name
    || !!profile?.onboarding_ia_completed
    || onboardingDone;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Load chat history when opening
  useEffect(() => {
    if (!open || historyLoaded || !user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("chat_messages" as any)
        .select("role, content, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data && (data as any[]).length > 0) {
        setMessages((data as any[]).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content, created_at: m.created_at })));
      }
      setHistoryLoaded(true);
    })();
  }, [open, historyLoaded, user?.id]);

  // Show onboarding when chat opens and AI not named yet
  // Guard duplo: onboardingDone (sessão) + onboarding_ia_completed (banco)
  useEffect(() => {
    if (profile?.onboarding_ia_completed) return;
    if (open && effectiveLevel >= 3 && !isNamed && !onboardingDone) {
      setShowOnboarding(true);
    }
  }, [open, effectiveLevel, isNamed, onboardingDone, profile?.onboarding_ia_completed]);

  if (effectiveLevel < 3) return null;

  const handleOpenChat = () => {
    if (!isNamed) {
      setShowOnboarding(true);
      setOpen(true);
    } else {
      setOpen(true);
    }
  };

  const handleOnboardingComplete = async (name: string, personality: IAPersonality) => {
    if (!user?.id) {
      toast({ title: "Sessão inválida", description: "Recarregue a página e tente novamente.", variant: "destructive" });
      return;
    }

    // Optimistic: fecha imediatamente para não entrar em loop
    setOnboardingDone(true);
    setShowOnboarding(false);

    try {
      const personalityJson = JSON.stringify(personality);

      // Estratégia L5 (System Master): usa roleLevel REAL, não effectiveLevel
      // Garante que L5 simulando L3 ainda salve pelo caminho correto (sem gabinete_id)
      if (roleLevel >= 5) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            assistant_name: name,
            assistant_personality: personalityJson,
            onboarding_ia_completed: true,
          } as any)
          .eq("id", user.id);

        if (profileError) throw profileError;

        // Tenta salvar em gabinete_config também (usando user.id como gabinete_id)
        // Se falhar, ignora — profiles já foi salvo
        try {
          await upsertConfig.mutateAsync({
            gabinete_id: user.id,
            ia_nome: name,
            ia_perfil: personality.perfil,
            ia_rigor: personality.rigor,
            ia_linguagem: personality.linguagem,
          } as any);
        } catch (gabErr: unknown) {
          const msg = gabErr instanceof Error ? gabErr.message : String(gabErr);
          console.warn("[ChatAguia] gabinete_config upsert falhou para L5 (não crítico):", msg);
        }
      } else {
        // L3/L4: usa gabinete_id normalmente
        const targetGabineteId = gabConfig?.gabinete_id ?? gabineteId ?? profile?.gabinete_id ?? null;

        if (!targetGabineteId) {
          throw new Error("Gabinete não encontrado. Entre em contato com o administrador.");
        }

        await upsertConfig.mutateAsync({
          gabinete_id: targetGabineteId,
          ia_nome: name,
          ia_perfil: personality.perfil,
          ia_rigor: personality.rigor,
          ia_linguagem: personality.linguagem,
        } as any);

        // Salva também em profiles para consistência
        await supabase
          .from("profiles")
          .update({
            assistant_name: name,
            assistant_personality: personalityJson,
            onboarding_ia_completed: true,
          } as any)
          .eq("id", user.id);
      }

      // Optimistic UI: atualiza o estado local imediatamente para evitar re-abertura do modal
      updateProfile({
        assistant_name: name,
        assistant_personality: personality as unknown as Record<string, unknown>,
        onboarding_ia_completed: true,
      });

      queryClient.invalidateQueries({ queryKey: ["gabinete_config"] });

      toast({ title: `✨ ${name} ativado!`, description: "Seu assistente de gabinete está operacional." });

      const levelLabel = effectiveLevel >= 5 ? "Master" : effectiveLevel >= 4 ? "Líder" : "Vereador";
      const welcome: Msg = {
        role: "assistant",
        content: `Olá ${levelLabel}, eu sou o **${name}**. Estou pronto para ser sua extensão estratégica. O que vamos analisar primeiro?\n\n🔒 Seus dados estão protegidos e são exclusivos do seu mandato.`,
      };
      setMessages([welcome]);
      await saveMessage("assistant", welcome.content);
    } catch (err: any) {
      // Rollback optimistic state
      setOnboardingDone(false);
      setShowOnboarding(true);
      toast({ title: "Falha ao registrar batismo. Tente novamente.", description: err?.message || "Erro desconhecido", variant: "destructive" });
    }
  };

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!user?.id) return;
    await supabase.from("chat_messages" as any).insert({ user_id: user.id, role, content } as any);
  };

  const clearHistory = async () => {
    if (!user?.id) return;
    await supabase.from("chat_messages" as any).delete().eq("user_id", user.id);
    setMessages([]);
    toast({ title: "Histórico limpo" });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setPendingTranscription(null);
    setIsLoading(true);

    await saveMessage("user", text.trim());

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        const errMsg = `❌ ${err.error || "Erro ao processar"}`;
        setMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
        await saveMessage("assistant", errMsg);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* ignore */ }
        }
      }

      if (assistantSoFar) {
        await saveMessage("assistant", assistantSoFar);
      }
    } catch (e) {
      console.error("Chat error:", e);
      const errMsg = "❌ Erro de conexão. Tente novamente.";
      setMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
      await saveMessage("assistant", errMsg);
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        toast({ title: "Processando áudio..." });
        const formData = new FormData();
        formData.append("audio", blob, `recording.${mimeType.includes("webm") ? "webm" : "mp4"}`);

        try {
          const { data, error } = await supabase.functions.invoke("process-voice", { body: formData });
          if (data?.text) {
            setPendingTranscription(data.text);
            setInput(data.text);
            toast({ title: "Transcrição pronta — confirme antes de enviar" });
          } else {
            toast({ title: "Não foi possível transcrever", description: error?.message, variant: "destructive" });
          }
        } catch {
          toast({ title: "Erro na transcrição", variant: "destructive" });
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      toast({ title: "Gravando... Clique novamente para parar." });
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast({ title: "Microfone bloqueado", description: "Permita o acesso ao microfone nas configurações do navegador.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao acessar microfone", variant: "destructive" });
      }
    }
  };

  const confirmTranscription = () => {
    if (pendingTranscription) sendMessage(pendingTranscription);
  };

  const discardTranscription = () => {
    setPendingTranscription(null);
    setInput("");
  };

  const suggestions = getSuggestions(effectiveLevel);

  return (
    <>
      {/* Onboarding Modal */}
      <OnboardingIAModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        level={effectiveLevel}
      />

      {/* FAB Button */}
      {!open && (
        <button
          onClick={handleOpenChat}
          className="fixed bottom-20 md:bottom-6 right-4 z-chat-fab flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900 text-white shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 border border-slate-700"
          aria-label="Abrir Chat IA"
        >
          <Sparkles className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-medium hidden sm:inline">{iaName} IA</span>
        </button>
      )}

      {/* Chat Panel - fullscreen on mobile */}
      {open && isNamed && !showOnboarding && (
        <div className="fixed inset-0 md:inset-auto md:bottom-4 md:right-4 z-chat-fab w-full md:w-[420px] h-[100dvh] md:h-[600px] flex flex-col bg-slate-950 border-0 md:border md:border-slate-800 md:rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{iaName}</h3>
                <p className="text-[10px] text-slate-400">Inteligência de Gabinete · L{effectiveLevel}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={clearHistory} className="text-slate-500 hover:text-red-400 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Limpar histórico">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-slate-800/50 md:bg-transparent">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex gap-3">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none text-slate-300 text-sm">
                    <ReactMarkdown>{getWelcome(effectiveLevel, iaName)}</ReactMarkdown>
                  </div>
                </div>
                <div className="space-y-2 pl-11">
                  <p className="text-[10px] text-slate-500 font-medium mb-1">Gatilhos de Inteligência</p>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.message)}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs transition-colors border border-slate-700/50 hover:border-amber-500/30"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-slate-800/60 text-slate-200"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <InteractiveMarkdown content={msg.content} />
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  {msg.created_at && (
                    <p className="text-[9px] text-slate-500 mt-1">
                      {new Date(msg.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
                <div className="bg-slate-800/60 rounded-xl px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
          </div>

          {/* Voice confirmation bar */}
          {pendingTranscription && (
            <div className="shrink-0 border-t border-amber-500/30 bg-amber-500/10 px-3 py-2 flex items-center gap-2">
              <p className="flex-1 text-xs text-amber-200 truncate">"{pendingTranscription}"</p>
              <button onClick={confirmTranscription} className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-green-600/80 hover:bg-green-600 text-white text-[10px] font-medium transition-colors" title="Confirmar e enviar">
                <Check className="h-3 w-3" /> Enviar
              </button>
              <button onClick={discardTranscription} className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-medium transition-colors" title="Descartar">
                <RotateCcw className="h-3 w-3" /> Refazer
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="shrink-0 border-t border-slate-800 bg-slate-900 p-3">
            <div className="flex gap-2">
              <button
                onClick={handleToggleRecording}
                className={`shrink-0 flex items-center justify-center h-11 w-11 rounded-lg transition-colors ${
                  isRecording
                    ? "bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse"
                    : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                }`}
                title={isRecording ? "Parar gravação" : "Gravar áudio"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <textarea
                value={input}
                onChange={e => { setInput(e.target.value); if (pendingTranscription) setPendingTranscription(null); }}
                onKeyDown={handleKeyDown}
                placeholder={`Pergunte ao ${iaName}...`}
                rows={1}
                className="flex-1 resize-none bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-amber-500/50 placeholder:text-slate-500"
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-900"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[9px] text-slate-600 text-center mt-2">Powered by {BRAND.name} AI · 🔒 LGPD</p>
          </div>
        </div>
      )}
    </>
  );
}
