import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onProcessing?: (loading: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInput({ onTranscript, disabled, className }: VoiceInputProps) {
  const { isListening, toggleListening, supported } = useVoiceInput(onTranscript);

  if (!supported) return null;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={toggleListening}
      title={isListening ? "Parar gravação" : "🎙️ Gravar voz com IA"}
      className={cn(
        "group relative flex items-center justify-center h-11 w-11 shrink-0 rounded-full transition-all duration-500 cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        isListening
          ? [
              "bg-destructive text-destructive-foreground",
              "shadow-[0_0_20px_hsl(var(--destructive)/0.5),0_0_40px_hsl(var(--destructive)/0.2)]",
            ]
          : [
              "bg-gradient-to-br from-blue-500 via-primary to-violet-600 text-white",
              "shadow-[0_0_15px_rgba(59,130,246,0.5)]",
              "hover:shadow-[0_0_25px_rgba(59,130,246,0.7),0_0_50px_rgba(139,92,246,0.3)]",
              "hover:scale-110",
            ],
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* Gradient border ring (idle) */}
      {!isListening && (
        <span className="absolute inset-[-3px] rounded-full bg-gradient-to-br from-blue-400 via-primary to-violet-500 opacity-60 animate-pulse -z-10" />
      )}

      {/* Recording wave rings */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full animate-ping bg-destructive/30" />
          <span className="absolute inset-[-6px] rounded-full animate-pulse border-2 border-destructive/40" />
          <span className="absolute inset-[-12px] rounded-full animate-pulse border border-destructive/20" style={{ animationDelay: "150ms" }} />
        </>
      )}

      {/* Icon */}
      {isListening ? (
        <MicOff className="h-5 w-5 relative z-10 animate-pulse" />
      ) : (
        <Mic className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
      )}
    </button>
  );
}
