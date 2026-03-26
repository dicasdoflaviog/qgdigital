import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BirthdayModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
}

// CSS confetti pieces
function Confetti() {
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--destructive))",
    "hsl(216, 79%, 60%)",
    "hsl(45, 100%, 55%)",
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {Array.from({ length: 30 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 2.5 + Math.random() * 2;
        const size = 6 + Math.random() * 6;
        const color = colors[i % colors.length];
        const rotation = Math.random() * 360;
        return (
          <span
            key={i}
            className="absolute animate-confetti-fall"
            style={{
              left: `${left}%`,
              top: "-10%",
              width: `${size}px`,
              height: `${size * 0.6}px`,
              backgroundColor: color,
              borderRadius: "2px",
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

export function BirthdayModal({ open, onClose, userName }: BirthdayModalProps) {
  const handleClose = () => {
    // Mark as shown today
    localStorage.setItem("qg-birthday-shown", new Date().toDateString());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="
          max-w-sm mx-auto
          bg-card/95 backdrop-blur-xl
          border border-border
          shadow-[0_24px_80px_rgba(0,0,0,0.25)]
          z-80
          p-6
          overflow-hidden
        "
        style={{
          paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <Confetti />

        <div className="relative z-10">
          {/* Emoji */}
          <div className="flex justify-center mb-2">
            <span className="text-5xl animate-scale-in">🎂</span>
          </div>

          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-xl font-medium tracking-tight text-foreground">
              Parabéns, {userName}! 🎈
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              O mandato agradece toda a sua dedicação em Teixeira de Freitas.
              Desejamos um feliz aniversário e muito sucesso!
            </DialogDescription>
          </DialogHeader>

          <Button
            onClick={handleClose}
            className="w-full mt-4 font-medium min-h-[48px] text-sm"
          >
            Obrigado! 🎉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
