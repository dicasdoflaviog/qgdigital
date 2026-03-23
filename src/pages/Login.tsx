import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Zap, Lock, Mail, Loader2, Eye, EyeOff, ChevronRight, ShieldCheck, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const HCAPTCHA_SITE_KEY = "554ea854-5ec6-4a82-b860-b46c3b9c3dd2";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0);
  const [showCaptchaReload, setShowCaptchaReload] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!captchaReady) setShowCaptchaReload(true);
    }, 7000);

    return () => window.clearTimeout(timer);
  }, [captchaReady, captchaRenderKey]);

  const reloadCaptcha = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaError(false);
    setCaptchaReady(false);
    setShowCaptchaReload(false);
    setCaptchaRenderKey((prev) => prev + 1);
  }, []);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
    setCaptchaError(false);
  }, []);

  const handleCaptchaError = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaReady(false);
    setCaptchaError(true);
    setShowCaptchaReload(true);
    toast({
      title: "Verificação necessária",
      description: "Por favor, complete a verificação de segurança.",
      variant: "destructive",
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setCaptchaError(true);
      toast({ title: "Verificação necessária", description: "Por favor, complete a verificação de segurança.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const { error } = await signIn(email, password, captchaToken);
    if (error) {
      toast({
        title: "Erro ao acessar",
        description: error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
        variant: "destructive",
      });
      setCaptchaToken(null);
      setCaptchaError(false);
      captchaRef.current?.resetCaptcha();
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/", { replace: true });
      setIsLoading(false);
      return;
    }

    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("gabinete_id, first_login, is_active").eq("id", session.user.id).single(),
      supabase.from("user_roles").select("role").eq("user_id", session.user.id).limit(1).single(),
    ]);

    const profile = profileRes.data;
    const userRole = roleRes.data?.role;
    const isSuperAdmin = userRole === "super_admin";

    if (!isSuperAdmin && !profile?.gabinete_id) {
      await supabase.auth.signOut();
      toast({ title: "Acesso restrito", description: "Solicite o seu convite ao administrador do gabinete.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      toast({ title: "Conta desativada", description: "O seu acesso foi desativado pelo administrador.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (profile?.first_login) {
      navigate("/reset-password?first_access=true", { replace: true });
      setIsLoading(false);
      return;
    }

    if (isSuperAdmin) navigate("/admin/system-master", { replace: true });
    else if (userRole === "secretaria") navigate("/", { replace: true });
    else if (userRole === "assessor") navigate("/eleitores", { replace: true });
    else navigate("/", { replace: true });

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary-foreground/20 bg-primary-foreground/10">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-lg font-medium tracking-tight">QG Digital</span>
          </div>
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-medium leading-tight">Gerencie seu mandato com inteligência.</h1>
            <p className="text-lg text-primary-foreground/60 leading-relaxed">Central de Inteligência Política — dados, demandas e equipe em um só lugar.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-primary-foreground/40">
            <Lock className="h-3 w-3" />
            <span>Conexão criptografada · Acesso restrito por convite</span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 lg:w-1/2 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Zap className="h-5 w-5" /></div>
            <span className="text-lg font-medium tracking-tight">QG Digital</span>
          </div>
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-medium">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">Acesse com suas credenciais autorizadas</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-9 min-h-[44px]" autoComplete="email" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 pr-10 min-h-[44px]" autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* hCaptcha — z-modal (z-80) para não ficar sob overlays no iOS Safari */}
            <div className="relative my-2 min-h-[84px] w-full z-[80]">
              {!captchaReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 pointer-events-none z-[81]">
                  <Skeleton className="h-[65px] w-[300px] max-w-full rounded-md" />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Carregando verificação…
                  </span>
                </div>
              )}

              {/* Wrapper garante max-width:100% e centralização sem overflow no iPhone */}
              <div
                className="flex justify-center w-full"
                style={{ maxWidth: "100%", overflowX: "hidden" }}
              >
                <div style={{ maxWidth: "100%", transform: "scale(1)", transformOrigin: "center top" }}>
                  <HCaptcha
                    key={captchaRenderKey}
                    ref={captchaRef}
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={handleCaptchaVerify}
                    onExpire={() => setCaptchaToken(null)}
                    onError={handleCaptchaError}
                    onChalExpired={() => setCaptchaToken(null)}
                    onLoad={() => {
                      setCaptchaReady(true);
                      setShowCaptchaReload(false);
                    }}
                    cleanup={false}
                    loadAsync
                  />
                </div>
              </div>
            </div>

            {showCaptchaReload && !captchaReady && (
              <div className="flex justify-center">
                <Button type="button" variant="outline" className="min-h-[44px] gap-2" onClick={reloadCaptcha}>
                  <RotateCcw className="h-4 w-4" /> Recarregar verificação
                </Button>
              </div>
            )}

            {captchaError && (
              <p className="text-xs text-destructive text-center">
                Por favor, complete a verificação de segurança.
              </p>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full min-h-[48px] text-sm font-medium gap-1" disabled={isLoading || !captchaToken}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Acessando...</> : <>Entrar no Sistema <ChevronRight className="h-4 w-4" /></>}
              </Button>
            </div>
          </form>
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">
              Esqueceu a senha?{" "}
              <Link to="/forgot-password" className="text-primary hover:underline font-medium">Recuperar acesso</Link>
            </p>
            <p className="text-xs text-muted-foreground">Acesso exclusivo por convite do administrador do gabinete.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
