import { useState } from "react";
import {
  LayoutDashboard, Users, MapPin, Trophy, CalendarDays, CalendarRange,
  FileText, Settings, Zap, BookOpen, X, LogOut, MessageSquarePlus, Database,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import { usePendingFeedbacks } from "@/hooks/usePendingFeedbacks";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem { title: string; url: string; icon: React.ElementType; roles: string[]; }

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin", "super_admin", "assessor", "secretaria"] },
  { title: "Eleitores", url: "/eleitores", icon: Users, roles: ["admin", "super_admin", "secretaria", "assessor"] },
  { title: "Mapa de Calor", url: "/mapa", icon: MapPin, roles: ["admin", "super_admin"] },
  { title: "Equipe", url: "/equipe", icon: Trophy, roles: ["admin", "super_admin"] },
  { title: "Agenda", url: "/agenda", icon: CalendarDays, roles: ["admin", "super_admin", "secretaria", "assessor"] },
  { title: "Calendário", url: "/calendario", icon: CalendarRange, roles: ["admin", "super_admin", "secretaria"] },
  { title: "Ofícios", url: "/oficios", icon: FileText, roles: ["admin", "super_admin", "secretaria"] },
  { title: "Guia de Soluções", url: "/guia", icon: BookOpen, roles: ["admin", "super_admin", "secretaria", "assessor"] },
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["admin", "super_admin"] },
  { title: "Gestão de Base", url: "/gestao-base", icon: Database, roles: ["super_admin"] },
  { title: "Log de Sugestões", url: "/sugestoes", icon: MessageSquarePlus, roles: ["super_admin"] },
];

interface MobileDrawerProps { open: boolean; onOpenChange: (open: boolean) => void; }

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const location = useLocation();
  const { role, roleLevel, profile, signOut } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const pendingFeedbacks = usePendingFeedbacks();

  const visibleItems = navItems.filter((item) =>
    role ? item.roles.includes(role) : item.roles.includes("admin")
  );

  const handleLogout = async () => { onOpenChange(false); await signOut(); };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <SheetHeader className="border-b p-4 mt-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <SheetTitle className="text-sm font-medium text-foreground tracking-tight text-left">QG Digital</SheetTitle>
              <span className="text-[10px] text-muted-foreground">CRM Eleitoral</span>
            </div>
          </div>
        </SheetHeader>

        {profile && (() => {
          const initials = (profile.full_name || "U")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const roleBadge = (() => {
            switch (roleLevel) {
              case 5: return { label: "System Master", cls: "bg-qg-blue-600 text-white" };
              case 4: return { label: "Líder Regional", cls: "bg-blue-600 text-white" };
              case 3: return { label: "Vereador", cls: "bg-emerald-600 text-white" };
              case 2: return { label: "Secretária", cls: "bg-amber-500 text-black" };
              case 1: return { label: "Assessor", cls: "bg-cyan-500 text-black" };
              default: return null;
            }
          })();
          return (
            <div className="px-4 py-3 border-b flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] font-medium bg-slate-700 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{profile.full_name}</p>
                {roleBadge && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit mt-0.5 ${roleBadge.cls}`}>
                    {roleBadge.label}
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        <nav className="flex-1 overflow-auto px-2 py-3">
          <p className="px-3 mb-2 text-[10px] font-medium text-muted-foreground">Menu</p>
          <div className="space-y-0.5">
            {visibleItems.map((item) => {
              const active = location.pathname === item.url;
              return (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end={item.url === "/"}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] ${
                    active ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  activeClassName=""
                  onClick={() => onOpenChange(false)}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.title}</span>
                  {item.url === "/sugestoes" && pendingFeedbacks > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium px-1">
                      {pendingFeedbacks}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <Separator />
        <div className="px-3 pt-2">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sm text-muted-foreground hover:text-foreground h-11" onClick={() => { onOpenChange(false); setTimeout(() => setFeedbackOpen(true), 300); }}>
            <MessageSquarePlus className="h-4 w-4" /> Sugerir Melhoria
          </Button>
        </div>
        <div className="p-3 pt-0">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sm text-muted-foreground hover:text-destructive h-11" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </SheetContent>
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </Sheet>
  );
}
