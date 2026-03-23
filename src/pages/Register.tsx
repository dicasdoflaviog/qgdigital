import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Zap, Lock, Mail, Loader2, Eye, EyeOff, User, ChevronRight } from "lucide-react";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" }); return; }
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      const isHIBP = error.message?.toLowerCase().includes("leaked") || error.message?.toLowerCase().includes("compromised") || error.message?.toLowerCase().includes("pwned") || error.message?.toLowerCase().includes("breach");
      toast({
        title: isHIBP ? "Senha comprometida" : "Erro ao criar conta",
        description: isHIBP ? "Esta senha foi encontrada em vazamentos globais. Por segurança, escolha outra." : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Conta criada com sucesso!", description: "Verifique seu e-mail para confirmar o cadastro." });
      navigate("/login", { replace: true });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary-foreground/20 bg-primary-foreground/10"><Zap className="h-5 w-5" /></div>
            <span className="text-lg font-semibold tracking-tight">QG Digital</span>
          </div>
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-bold leading-tight">Junte-se ao QG Digital.</h1>
            <p className="text-lg text-primary-foreground/60 leading-relaxed">Crie sua conta e faça parte da equipe.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-primary-foreground/40"><Lock className="h-3 w-3" /><span>Conexão criptografada · Acesso restrito</span></div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Zap className="h-5 w-5" /></div>
            <span className="text-lg font-semibold tracking-tight">QG Digital</span>
          </div>
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold">Criar sua conta</h2>
            <p className="text-sm text-muted-foreground">Preencha os dados abaixo para se cadastrar</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" className="pl-9 min-h-[44px]" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-9 min-h-[44px]" autoComplete="email" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-9 pr-10 min-h-[44px]" autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full min-h-[48px] text-sm font-medium gap-1" disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando conta...</> : <>Criar Conta <ChevronRight className="h-4 w-4" /></>}
            </Button>
          </form>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Já tem uma conta?{" "}<Link to="/login" className="text-primary hover:underline font-medium">Faça login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
