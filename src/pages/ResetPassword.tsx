import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, Lock, Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for first_access query param (from login redirect)
    if (searchParams.get("first_access") === "true") {
      setIsRecovery(true);
      setIsFirstAccess(true);
      return;
    }

    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Senhas não coincidem", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      const isHIBP = error.message?.toLowerCase().includes("leaked") || error.message?.toLowerCase().includes("compromised") || error.message?.toLowerCase().includes("pwned") || error.message?.toLowerCase().includes("breach");
      toast({
        title: isHIBP ? "Senha comprometida" : "Erro",
        description: isHIBP ? "Esta senha foi encontrada em vazamentos globais. Por segurança, escolha outra." : error.message,
        variant: "destructive",
      });
    } else {
      // Mark first_login as false
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ first_login: false }).eq("id", user.id);
      }
      toast({ title: isFirstAccess ? "Senha definida com sucesso! 🔒" : "Senha atualizada! ✅" });
      navigate("/", { replace: true });
    }
    setIsLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-background">
        <p className="text-muted-foreground">Link de recuperação inválido ou expirado.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            {isFirstAccess ? "Defina sua senha" : "Nova Senha"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isFirstAccess
              ? "Por segurança, crie uma senha pessoal para substituir a temporária."
              : "Defina sua nova senha de acesso"}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Nova Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 min-h-[44px]"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirmar Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="pl-9 min-h-[44px]"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full min-h-[48px]" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFirstAccess ? "Definir Senha" : "Atualizar Senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
