import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { BottomBar } from "./BottomBar";
import { useAuth } from "@/contexts/AuthContext";
import { useOffline } from "@/contexts/OfflineContext";
import { Zap, Eye, Menu, X, Wifi, WifiOff, Loader2, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { WelcomeModal } from "@/components/auth/WelcomeModal";
import { BirthdayModal } from "@/components/auth/BirthdayModal";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { MobileDrawer } from "./MobileDrawer";
import { ChatAguia } from "@/components/chat/ChatAguia";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { toast } from "@/hooks/use-toast";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useGabineteConfig } from "@/hooks/useGabineteConfig";
import { BRAND } from "@/lib/brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const levelLabels: Record<number, string> = {
  1: "Assessor",
  2: "Secretária",
  3: "Vereador",
  4: "Líder Político",
  5: "System Master",
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, realRole, isImpersonating, profile, user, roleLevel, simulatedLevel } = useAuth();
  const currentLabel = levelLabels[roleLevel] ?? `Nível ${roleLevel}`;
  const { isOnline, pendingCount, syncing } = useOffline();
  useRealtimeSync();
  useDocumentTitle("Painel");
  const { config: gabConfig } = useGabineteConfig();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [birthdayOpen, setBirthdayOpen] = useState(false);

  useEffect(() => {
    if (profile && profile.first_login) setWelcomeOpen(true);
  }, [profile]);

  useEffect(() => {
    if (!profile?.birth_date) return;
    const today = new Date();
    const birth = new Date(profile.birth_date + "T12:00:00");
    if (today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth()) {
      const shown = localStorage.getItem("qg-birthday-shown");
      if (shown !== today.toDateString()) {
        setTimeout(() => setBirthdayOpen(true), profile.first_login ? 2000 : 500);
      }
    }
  }, [profile]);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const alreadyWelcomed = localStorage.getItem("qg-standalone-welcomed");
    if (isStandalone && !alreadyWelcomed) {
      localStorage.setItem("qg-standalone-welcomed", "true");
      setTimeout(() => {
        toast({ title: `🚀 Bem-vindo ao ${BRAND.name}!`, description: "O seu mandato agora está na palma da sua mão." });
      }, 1000);
    }
  }, []);

  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <SidebarProvider>
      <div className="h-[100dvh] flex w-full overflow-hidden bg-background">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            ['--party-color' as any]: gabConfig?.cor_primaria || BRAND.defaultColor,
          }}
        >
          {isImpersonating && (
            <div className="shrink-0 z-50 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground px-4 py-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Simulando: {currentLabel}</span>
            </div>
          )}

          <header className="shrink-0 z-40 flex items-center gap-3 bg-card border-b px-4 h-14">
            <SidebarTrigger className="hidden md:flex" />

            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition-colors shrink-0"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </button>
              <div className="flex items-center gap-1.5 shrink-0">
                {gabConfig?.logo_url ? (
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarImage src={gabConfig.logo_url} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs"><Zap className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                    <Zap className="h-4 w-4" />
                  </div>
                )}
                <span className="text-sm font-medium tracking-tight whitespace-nowrap text-foreground">
                  {gabConfig?.nome_mandato
                    ? gabConfig.nome_mandato.length > 20 ? gabConfig.nome_mandato.slice(0, 20) + "…" : gabConfig.nome_mandato
                    : profile?.full_name
                      ? `Gab. ${profile.full_name.split(" ")[0]}`
                      : BRAND.name}
                </span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 shrink-0">
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent active:bg-accent/70 transition-colors shrink-0"
                aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
              >
                {isDark ? <Sun className="h-4.5 w-4.5 text-foreground" /> : <Moon className="h-4.5 w-4.5 text-foreground" />}
              </button>
              <NotificationBell />
              <RoleSwitcher />

              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${
                  isOnline ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground"
                }`}
                title={isOnline ? "Conectado" : "Sem conexão"}
              >
                {syncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isOnline ? (
                  <Wifi className="h-3.5 w-3.5" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
                {pendingCount > 0 && (
                  <span className="hidden md:inline">{pendingCount} pendente{pendingCount > 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          </header>

          <InstallBanner />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            {children}
            <footer className="py-2 md:py-4 px-4 text-center space-y-0.5">
              <p className="text-[10px] text-slate-500 font-medium">{BRAND.footerCredit}</p>
              <p className="text-[10px] text-muted-foreground/40">{BRAND.name} v{BRAND.version}</p>
            </footer>
          </main>
        </div>
      </div>
      <BottomBar />
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <ChatAguia />
      <WelcomeModal
        open={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        userName={profile?.full_name || user?.user_metadata?.full_name || "Usuário"}
        userId={user?.id || ""}
      />
      <BirthdayModal
        open={birthdayOpen}
        onClose={() => setBirthdayOpen(false)}
        userName={profile?.full_name?.split(" ")[0] || "Usuário"}
      />
    </SidebarProvider>
  );
}
