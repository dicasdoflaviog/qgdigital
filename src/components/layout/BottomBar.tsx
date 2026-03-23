import { useState } from "react";
import { LayoutDashboard, MapPin, Plus, Trophy, Sparkles, FileText, CalendarDays, Radio, Users, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CadastroModal } from "@/components/eleitores/CadastroModal";

interface BottomItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: string[];
}

const allItems: BottomItem[] = [
  { title: "Painel", url: "/", icon: LayoutDashboard, roles: ["admin", "super_admin", "assessor", "secretaria"] },
  { title: "Mapa", url: "/mapa", icon: MapPin, roles: ["admin", "super_admin"] },
  { title: "Guia", url: "/guia", icon: BookOpen, roles: ["assessor", "secretaria"] },
  { title: "Ofícios", url: "/oficios", icon: FileText, roles: ["admin", "super_admin", "secretaria"] },
  { title: "Agenda", url: "/agenda", icon: CalendarDays, roles: ["assessor"] },
  { title: "Radar", url: "/", icon: Radio, roles: ["secretaria"] },
  { title: "Eleitores", url: "/eleitores", icon: Users, roles: ["assessor"] },
  { title: "Ranking", url: "/equipe", icon: Trophy, roles: ["admin", "super_admin"] },
];

function NavItem({ item, active }: { item: BottomItem; active: boolean }) {
  return (
    <NavLink
      to={item.url}
      end={item.url === "/"}
      className="flex flex-col items-center gap-0.5 py-1 transition-colors flex-1 min-w-0"
      activeClassName=""
    >
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${active ? "bg-primary/10" : ""}`}>
        <item.icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
        {item.title}
      </span>
    </NavLink>
  );
}

export function BottomBar() {
  const location = useLocation();
  const { role } = useAuth();
  const [cadastroOpen, setCadastroOpen] = useState(false);

  const filterByRole = (items: BottomItem[]) =>
    items.filter((item) => (role ? item.roles.includes(role) : item.roles.includes("admin")));

  const visibleItems = filterByRole(allItems);
  const left = visibleItems.slice(0, 2);
  const right = visibleItems.slice(2, 4);

  const isActive = (url: string) =>
    location.pathname === url || (url === "/" && location.pathname === "/");

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-bottombar flex items-end justify-around bg-card/95 backdrop-blur-md border-t border-border/60 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] pt-1 px-2 md:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 0.25rem)' }}
      >
        {left.map((item) => (
          <NavItem key={item.title} item={item} active={isActive(item.url)} />
        ))}

        <div className="flex flex-col items-center justify-end flex-1 min-w-0 py-1">
          <button
            onClick={() => setCadastroOpen(true)}
            className="flex items-center justify-center h-14 w-14 -mt-4 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 active:scale-95 transition-transform"
            aria-label="Novo Cadastro"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </button>
        </div>

        {right.map((item) => (
          <NavItem key={item.title} item={item} active={isActive(item.url)} />
        ))}
      </nav>

      <div className="md:hidden">
        <CadastroModal externalOpen={cadastroOpen} onExternalOpenChange={setCadastroOpen} hideTrigger />
      </div>
    </>
  );
}
