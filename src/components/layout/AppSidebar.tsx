// Sidebar v2 - consolidated L5 menu
import {
  LayoutDashboard, Users, MapPin, Trophy, CalendarDays, CalendarRange, FileText, Settings,
  Zap, Radio, BookOpen, CloudOff, Database, MessageSquarePlus, Building2, Landmark,
  Archive, Server, Scale, ShieldCheck, DollarSign, Lock, BarChart3, LogOut, Paintbrush,
  CreditCard,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import { BRAND } from "@/lib/brand";
import { usePendingFeedbacks } from "@/hooks/usePendingFeedbacks";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOffline } from "@/contexts/OfflineContext";
import { useSkillsMatrix, ROUTE_TO_SKILL } from "@/hooks/useSkillsMatrix";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";


type MenuGroup = "inteligencia" | "operacional" | "estrategico" | "sistema" | "saas_admin" | "saas_seguranca" | "saas_visao";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: string[];
  minLevel?: number;
  exactLevels?: number[];
  group?: MenuGroup;
  tab?: string; // when set, matches ?tab=<value> for active state
}

// ── TOPO: Inteligência (Dashboard, Mapa, Observatório) ──
const inteligenciaNavItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin", "super_admin", "assessor", "secretaria"], group: "inteligencia" },
  { title: "Mapa de Calor", url: "/mapa", icon: MapPin, roles: ["admin", "super_admin"], group: "inteligencia" },
  { title: "Observatório BI", url: "/observatorio-bi", icon: BarChart3, roles: ["admin", "super_admin"], exactLevels: [3, 4, 5], group: "inteligencia" },
];

// ── MEIO: Operacional (Eleitores, Ofícios, Agenda, etc.) ──
const operacionalNavItems: NavItem[] = [
  { title: "Eleitores", url: "/eleitores", icon: Users, roles: ["admin", "super_admin", "secretaria", "assessor"], group: "operacional" },
  { title: "Equipe", url: "/equipe", icon: Trophy, roles: ["admin", "super_admin", "secretaria"], group: "operacional" },
  { title: "Agenda", url: "/agenda", icon: CalendarDays, roles: ["admin", "super_admin", "secretaria", "assessor"], group: "operacional" },
  { title: "Calendário", url: "/calendario", icon: CalendarRange, roles: ["admin", "super_admin", "secretaria"], group: "operacional" },
  { title: "Ofícios", url: "/oficios", icon: FileText, roles: ["admin", "super_admin", "secretaria"], group: "operacional" },
  { title: "Guia de Soluções", url: "/guia", icon: BookOpen, roles: ["admin", "super_admin", "secretaria", "assessor"], group: "operacional" },
  { title: "Plano", url: "/plano", icon: CreditCard, roles: ["admin", "super_admin"], group: "operacional" },
  { title: "Instituições", url: "/instituicoes", icon: Building2, roles: ["admin", "super_admin"], group: "operacional" },
  { title: "Emendas", url: "/emendas", icon: Landmark, roles: ["admin", "super_admin"], group: "operacional" },
  { title: "Identidade", url: "/configuracao-gabinete", icon: Paintbrush, roles: ["admin"], exactLevels: [3], group: "operacional" },
];

// ── L4 Estratégico ──
const estrategicoNavItems: NavItem[] = [
  { title: "Observatório", url: "/observatorio", icon: Scale, roles: ["super_admin"], exactLevels: [4, 5], group: "estrategico" },
  { title: "Gestão de Base", url: "/gestao-base", icon: Database, roles: ["super_admin"], exactLevels: [4, 5], group: "estrategico" },
];

// ── L5 EXCLUSIVE: Administração SaaS ──
const saasAdminNavItems: NavItem[] = [
  { title: "Painel Master", url: "/admin/system-master", icon: Server, roles: ["super_admin"], exactLevels: [5], group: "saas_admin" },
  { title: "Clientes (Nível 4)", url: "/admin/system-master", tab: "clientes", icon: Users, roles: ["super_admin"], exactLevels: [5], group: "saas_admin" },
  { title: "Habilidades (Skills)", url: "/admin/system-master", tab: "skills", icon: ShieldCheck, roles: ["super_admin"], exactLevels: [5], group: "saas_admin" },
  { title: "Financeiro (MRR)", url: "/admin/system-master", tab: "mrr", icon: DollarSign, roles: ["super_admin"], exactLevels: [5], group: "saas_admin" },
  { title: "Chamados de Melhoria", url: "/sugestoes", icon: MessageSquarePlus, roles: ["super_admin"], exactLevels: [5], group: "saas_admin" },
];

// ── L5 EXCLUSIVE: Segurança e Dados ──
const saasSegurancaNavItems: NavItem[] = [
  { title: "Logs de Auditoria", url: "/sistema", icon: Lock, roles: ["super_admin"], exactLevels: [5], group: "saas_seguranca" },
  { title: "Lixeira (Recuperação)", url: "/central-recuperacao", icon: Archive, roles: ["super_admin"], exactLevels: [5], group: "saas_seguranca" },
];

// ── L5 EXCLUSIVE: Visão Operacional ──
const saasVisaoNavItems: NavItem[] = [
  { title: "Mapa Master", url: "/mapa", icon: MapPin, roles: ["super_admin"], exactLevels: [5], group: "saas_visao" },
  { title: "Observatório Master", url: "/observatorio-bi", icon: BarChart3, roles: ["super_admin"], exactLevels: [5], group: "saas_visao" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState("");
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role, roleLevel, realRole, user, profile, isImpersonating, signOut, loading } = useAuth();
  const { pendingCount } = useOffline();
  const pendingFeedbacks = usePendingFeedbacks();
  const { isSkillEnabled } = useSkillsMatrix();
  const { isFeatureEnabled } = useFeatureFlags(
    roleLevel === 4 && user?.id ? user.id : undefined
  );

  const isL5 = roleLevel === 5;
  const isL4 = roleLevel === 4;
  const showConfiguracoes = roleLevel >= 1; // todos os níveis (L1–L5)

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => {
      const roleMatch = role ? item.roles.includes(role) : false;
      if (!roleMatch) return false;
      if (item.exactLevels && !item.exactLevels.includes(roleLevel)) return false;
      return true;
    });

  const getItemState = (item: NavItem): "visible" | "locked" | "hidden" => {
    const skillKey = ROUTE_TO_SKILL[item.url];
    if (!skillKey) return "visible";
    const skillEnabled = isSkillEnabled(skillKey, roleLevel);
    if (!skillEnabled) return "hidden";
    if (roleLevel === 4 && user?.id) {
      const contractEnabled = isFeatureEnabled(skillKey, user.id);
      if (!contractEnabled) return "locked";
    }
    return "visible";
  };

  const handleLockedClick = (title: string) => {
    setLockedFeature(title);
    setUpgradeModalOpen(true);
  };

  const renderItems = (items: NavItem[]) =>
    items.map((item) => {
      const itemState = getItemState(item);
      if (itemState === "hidden") return null;

      // Active detection: for items with a `tab` field, match pathname + ?tab=<value>
      // For items without a tab, match pathname only (ignoring any query params)
      const currentTab = new URLSearchParams(location.search).get("tab");
      const active = location.pathname === item.url && (
        item.tab !== undefined
          ? currentTab === item.tab
          : currentTab === null
      );
      const isLocked = itemState === "locked";

      // Build the href — include ?tab= when the item specifies a tab
      const itemHref = item.tab ? `${item.url}?tab=${item.tab}` : item.url;

      const linkContent = isLocked ? (
        <button
          onClick={() => handleLockedClick(item.title)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all overflow-hidden w-full opacity-50 cursor-not-allowed ${
            collapsed ? "justify-center px-0" : ""
          } text-sidebar-foreground hover:bg-sidebar-accent/30`}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm whitespace-nowrap flex-1">{item.title}</span>
              <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            </>
          )}
        </button>
      ) : (
        <NavLink
          to={itemHref}
          end={itemHref === "/"}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all overflow-hidden ${
            collapsed ? "justify-center px-0" : ""
          } ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"}`}
          activeClassName=""
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-sm whitespace-nowrap flex-1">{item.title}</span>}
          {!collapsed && item.url === "/sugestoes" && pendingFeedbacks > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium px-1">
              {pendingFeedbacks}
            </span>
          )}
        </NavLink>
      );

      return (
        <SidebarMenuItem key={item.title + (item.tab ?? item.url)}>
          <SidebarMenuButton asChild isActive={!isLocked && active} tooltip={collapsed ? item.title : undefined}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {item.title}{isLocked ? " 🔒" : ""}
                </TooltipContent>
              </Tooltip>
            ) : linkContent}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }).filter(Boolean);

  const renderGroup = (label: string, items: NavItem[], colorClass: string) => {
    const filtered = filterByRole(items);
    if (filtered.length === 0) return null;
    return (
      <SidebarGroup>
        {!collapsed && (
          <SidebarGroupLabel className={`text-[10px] font-medium px-3 mb-1 mt-3 ${colorClass}`}>
            {label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu className="space-y-0.5">
            {renderItems(filtered)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  // ── Determine which sections to show ──
  const showOperacional = roleLevel <= 3;
  const showEstrategico = isL4;
  const showSaasMenus = isL5;
  const showInteligencia = roleLevel >= 3 && roleLevel <= 4;

  const inteligencia = filterByRole(inteligenciaNavItems);
  const operacional = filterByRole(operacionalNavItems);

  // Footer link helper
  const renderFooterLink = (icon: React.ElementType, label: string, url: string) => {
    const Icon = icon;
    const active = location.pathname === url;
    const content = (
      <NavLink
        to={url}
        end={url === "/"}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all overflow-hidden ${
          collapsed ? "justify-center px-0" : ""
        } ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"}`}
        activeClassName=""
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="text-xs font-medium whitespace-nowrap">{label}</span>}
      </NavLink>
    );
    return collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    ) : content;
  };

  return (
    <>
      <Sidebar collapsible="icon" className="z-40">
        <SidebarHeader className="border-b p-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div className={`flex flex-col overflow-hidden transition-all ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
              <span className="text-sm font-medium text-foreground tracking-tight whitespace-nowrap">{BRAND.name}</span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {isL5 ? "System Master" : BRAND.tagline}
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3 flex flex-col overflow-y-auto scrollbar-hide">


          {/* ═══════════════════════════════════════ */}
          {/* ── L5: SaaS Management (exclusive)  ── */}
          {/* ═══════════════════════════════════════ */}
          {showSaasMenus && (
            <>
              {renderGroup("Administração", saasAdminNavItems, "text-cyan-500")}
              {renderGroup("Segurança e Dados", saasSegurancaNavItems, "text-rose-500")}
              {renderGroup("Visão Global", saasVisaoNavItems, "text-amber-500")}
            </>
          )}

          {/* ═══════════════════════════════ */}
          {/* ── TOPO: Inteligência        ── */}
          {/* ═══════════════════════════════ */}
          {(showInteligencia || showEstrategico) && inteligencia.length > 0 && (
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] font-medium text-muted-foreground px-3 mb-1">
                  Inteligência
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {renderItems(inteligencia)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* ── L4: Estratégia ── */}
          {showEstrategico && renderGroup("Estratégia", estrategicoNavItems, "text-qg-blue-500")}

          {/* ═══════════════════════════════ */}
          {/* ── MEIO: Operacional          ── */}
          {/* ═══════════════════════════════ */}
          {(showOperacional || showEstrategico) && operacional.length > 0 && (
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] font-medium text-muted-foreground px-3 mb-1 mt-2">
                  Operacional
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {renderItems(operacional)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Pending offline indicator */}
          {pendingCount > 0 && !collapsed && (
            <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs">
              <CloudOff className="h-4 w-4 text-destructive shrink-0" />
              <div>
                <p className="font-medium text-foreground">{pendingCount} pendente{pendingCount > 1 ? "s" : ""}</p>
                <p className="text-[10px] text-muted-foreground">Aguardando conexão</p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ── RODAPÉ: Configurações, Perfil, Sair       ── */}
          {/* ═══════════════════════════════════════════════ */}
          <div className={`mx-2 mt-auto pt-3 border-t border-border/50 space-y-1 pb-2 ${collapsed ? "px-0" : ""}`}>
            {/* Configurações — L3: Gabinete, L5: SaaS */}
            {showConfiguracoes && renderFooterLink(
              Settings,
              roleLevel === 5 ? "Configurações SaaS" : "Configurações",
              roleLevel === 5 ? "/admin/system-master" : "/configuracoes"
            )}

            {/* User Profile Avatar */}
            {loading ? (
              <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center px-0" : ""}`}>
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                {!collapsed && <Skeleton className="h-4 w-24 rounded" />}
              </div>
            ) : (
              (() => {
                const firstName = (profile?.full_name || "Usuário").split(" ")[0];
                const initials = (profile?.full_name || "U")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const active = location.pathname === "/meu-perfil";
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
                const content = (
                  <NavLink
                    to="/meu-perfil"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all overflow-hidden ${
                      collapsed ? "justify-center px-0" : ""
                    } ${active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"}`}
                    activeClassName=""
                  >
                    <Avatar className={`shrink-0 ${collapsed ? "h-7 w-7" : "h-8 w-8"}`}>
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] font-medium bg-slate-700 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium whitespace-nowrap truncate">{firstName}</span>
                        {roleBadge && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit mt-0.5 ${roleBadge.cls}`}>
                            {roleBadge.label}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
                return collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">{firstName}</TooltipContent>
                  </Tooltip>
                ) : content;
              })()
            )}

            {/* Sugerir Melhoria — hidden for L5 */}
            {!isL5 && (
              <button
                onClick={() => setFeedbackOpen(true)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-white transition-all ${collapsed ? "justify-center px-0" : ""}`}
              >
                <MessageSquarePlus className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-xs font-medium whitespace-nowrap">Sugerir Melhoria</span>}
              </button>
            )}

            {/* Sair */}
            <button
              onClick={() => signOut()}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${collapsed ? "justify-center px-0" : ""}`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-xs font-medium whitespace-nowrap">Sair</span>}
            </button>
          </div>
        </SidebarContent>
        <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      </Sidebar>

      {/* Upgrade Modal */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-medium tracking-tight">
              <Lock className="h-4 w-4 text-amber-500" /> Upgrade necessário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              O recurso <span className="font-medium text-foreground">"{lockedFeature}"</span> não está incluído no seu contrato atual.
            </p>
            <p className="text-xs text-muted-foreground">
              Entre em contato com o administrador do sistema para ativar esta funcionalidade.
            </p>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-medium text-amber-600">💡 Dica</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Solicite ao seu administrador Nível 5 que habilite este recurso na aba "Gestão de Clientes" do System Master.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}