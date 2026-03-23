import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userId: string;
}

export function WelcomeModal({ open, onClose, userName, userId }: WelcomeModalProps) {
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      await supabase
        .from("profiles")
        .update({ first_login: false } as any)
        .eq("id", userId);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleStart()}>
      <DialogContent
        className="
          max-w-sm mx-auto
          bg-card/95 backdrop-blur-xl
          border border-border
          shadow-[0_24px_80px_rgba(0,0,0,0.25)]
          z-[200]
          p-6
        "
        style={{
          paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <div className="flex h-14 w-14 items-center justify-center bg-primary text-primary-foreground rounded-2xl shadow-lg animate-scale-in">
            <Zap className="h-7 w-7" />
          </div>
        </div>

        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-xl font-black tracking-tight text-foreground">
            Olá, {userName}! 🚀
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Bem-vindo ao time de elite do Vereador. O seu mandato agora está na palma da sua mão.
            Registre demandas com fotos e GPS para fortalecermos nossa base!
          </DialogDescription>
        </DialogHeader>

        <Button
          onClick={handleStart}
          disabled={loading}
          className="w-full mt-4 font-bold uppercase tracking-wider min-h-[48px] text-sm"
        >
          Começar Missão
        </Button>
      </DialogContent>
    </Dialog>
  );
}
