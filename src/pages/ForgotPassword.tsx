import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto" />
            <h2 className="text-xl font-bold">E-mail enviado!</h2>
            <p className="text-sm text-muted-foreground">
              Verifique sua caixa de entrada para redefinir a senha.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full min-h-[44px]">
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Login
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold tracking-tight">Recuperar Senha</h2>
              <p className="text-sm text-muted-foreground">
                Informe seu e-mail para receber o link de recuperação
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-9 min-h-[44px]"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full min-h-[48px]" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Link"}
              </Button>
            </form>
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Voltar ao Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
