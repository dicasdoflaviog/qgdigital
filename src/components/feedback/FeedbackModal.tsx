import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Send, Edit3, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Stage = "idle" | "recording" | "review" | "sending" | "success";

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const fullTranscriptRef = useRef("");

  const supported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const cleanup = useCallback(() => {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      cleanup();
      setStage("idle");
      setTranscript("");
      setInterimText("");
      fullTranscriptRef.current = "";
    }
  }, [open, cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  const handleStartRecording = useCallback(() => {
    if (!supported) {
      toast({ title: "Não suportado", description: "Seu navegador não suporta reconhecimento de voz.", variant: "destructive" });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + " ";
        } else {
          interim += t;
        }
      }
      if (final) fullTranscriptRef.current += final;
      setTranscript(fullTranscriptRef.current.trim());
      setInterimText(interim);
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try { recognition.start(); } catch {
          isListeningRef.current = false;
          setStage("review");
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "denied") {
        toast({ title: "Microfone bloqueado", description: "Permita o acesso ao microfone nas configurações.", variant: "destructive" });
        isListeningRef.current = false;
        setStage("idle");
      } else if (event.error !== "no-speech") {
        isListeningRef.current = false;
        setStage("review");
      }
    };

    recognitionRef.current = recognition;
    fullTranscriptRef.current = "";
    setTranscript("");
    setInterimText("");
    isListeningRef.current = true;
    setStage("recording");
    recognition.start();
  }, [supported]);

  const handleStop = useCallback(() => {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    setStage("review");
    setInterimText("");
  }, []);

  const handleSend = useCallback(async () => {
    const finalText = transcript.trim();
    if (!finalText) {
      toast({ title: "Texto vazio", description: "Grave ou digite sua sugestão antes de enviar.", variant: "destructive" });
      return;
    }
    if (!user) return;

    setStage("sending");

    const { error } = await supabase.from("feedbacks").insert({
      user_id: user.id,
      content: finalText,
      status: "pendente",
    });

    if (error) {
      console.error("Feedback insert error:", error);
      toast({ title: "Erro ao enviar", description: "Tente novamente em instantes.", variant: "destructive" });
      setStage("review");
      return;
    }

    setStage("success");
    setTimeout(() => onOpenChange(false), 2000);
  }, [transcript, user, onOpenChange]);

  const handleReset = useCallback(() => {
    cleanup();
    fullTranscriptRef.current = "";
    setTranscript("");
    setInterimText("");
    setStage("idle");
  }, [cleanup]);

  const displayText = transcript + (interimText ? ` ${interimText}` : "");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto pb-safe">
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4 mt-1" />
        <SheetHeader>
          <SheetTitle className="text-base font-medium">
            Sugerir melhoria
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Grave sua sugestão por voz ou digite abaixo
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pt-2">
          {/* Idle state */}
          {stage === "idle" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <button
                type="button"
                onClick={handleStartRecording}
                className={cn(
                  "relative flex items-center justify-center h-20 w-20 rounded-full transition-all duration-500 cursor-pointer",
                  "bg-gradient-to-br from-blue-500 via-primary to-violet-600 text-white",
                  "shadow-[0_0_20px_rgba(59,130,246,0.5)]",
                  "hover:shadow-[0_0_35px_rgba(59,130,246,0.7),0_0_60px_rgba(139,92,246,0.3)]",
                  "hover:scale-110 active:scale-95"
                )}
              >
                <span className="absolute inset-[-3px] rounded-full bg-gradient-to-br from-blue-400 via-primary to-violet-500 opacity-60 animate-pulse -z-10" />
                <Mic className="h-8 w-8 relative z-10" />
              </button>
              <p className="text-sm text-muted-foreground font-medium">Toque para gravar</p>

              <div className="w-full border-t border-border pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-xs font-medium text-muted-foreground"
                  onClick={() => setStage("review")}
                >
                  <Edit3 className="h-3.5 w-3.5" /> Prefiro digitar
                </Button>
              </div>
            </div>
          )}

          {/* Recording state */}
          {stage === "recording" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative flex items-center justify-center h-20 w-20">
                <span className="absolute inset-0 rounded-full animate-ping bg-destructive/30" />
                <span className="absolute inset-[-6px] rounded-full animate-pulse border-2 border-destructive/40" />
                <span className="absolute inset-[-12px] rounded-full animate-pulse border border-destructive/20" style={{ animationDelay: "150ms" }} />
                <button
                  type="button"
                  onClick={handleStop}
                  className="relative flex items-center justify-center h-20 w-20 rounded-full bg-destructive text-destructive-foreground shadow-[0_0_20px_hsl(var(--destructive)/0.5)] cursor-pointer z-10"
                >
                  <MicOff className="h-8 w-8 animate-pulse" />
                </button>
              </div>
              <p className="text-sm text-destructive font-medium animate-pulse">Gravando...</p>

              {displayText && (
                <div className="w-full bg-muted/50 border border-border rounded-2xl p-3 max-h-32 overflow-y-auto">
                  <p className="text-sm text-foreground leading-relaxed">
                    {transcript}
                    {interimText && <span className="text-muted-foreground italic"> {interimText}</span>}
                  </p>
                </div>
              )}

              <Button
                onClick={handleStop}
                className="w-full gap-2 font-medium text-xs min-h-[44px]"
                variant="outline"
              >
                Parar e Revisar
              </Button>
            </div>
          )}

          {/* Review state */}
          {stage === "review" && (
            <div className="space-y-4">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Digite ou edite sua sugestão aqui..."
                className="min-h-[120px] text-sm resize-none"
                autoFocus={false}
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-medium text-xs min-h-[44px]"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Regravar
                </Button>
                <Button
                  className="flex-1 gap-2 font-medium text-xs min-h-[44px]"
                  onClick={handleSend}
                >
                  <Send className="h-4 w-4" /> Enviar Sugestão
                </Button>
              </div>
            </div>
          )}

          {/* Sending state */}
          {stage === "sending" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Enviando sugestão...</p>
            </div>
          )}

          {/* Success state */}
          {stage === "success" && (
            <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Sugestão enviada!</p>
                <p className="text-xs text-muted-foreground mt-1">Obrigado pelo feedback. Vamos analisar em breve.</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}