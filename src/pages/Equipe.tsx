import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Search, Users, ShieldCheck, Clock, UserCheck, Building2, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMembers, useToggleMemberActive, useUpdateMemberRole } from "@/hooks/useTeamMembers";
import { toast } from "@/hooks/use-toast";
import InviteMemberModal from "@/components/equipe/InviteMemberModal";
import TeamTable from "@/components/equipe/TeamTable";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_OPTIONS_L3 = [
  { value: "todos", label: "Todos os Cargos" },
  { value: "assessor", label: "Assessor de Campo" },
  { value: "secretaria", label: "Gestor de Gabinete" },
];

const ROLE_OPTIONS_DEFAULT = [
  { value: "todos", label: "Todos os Cargos" },
  { value: "admin", label: "Vereador / Admin" },
  { value: "assessor", label: "Assessor de Campo" },
  { value: "secretaria", label: "Gestor de Gabinete" },
  { value: "super_admin", label: "Super Admin" },
];

export default function Equipe() {
  const { role, user, roleLevel } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isL4 = roleLevel === 4;
  const isL3 = roleLevel === 3;

  // L3: only assessors/secretárias from their gabinete
  // L4: only vereadores (L3)
  // L5: all
  const gabineteId = isL3 ? (user?.id ?? null) : undefined;
  const roleLevels = isL3 ? [1, 2] : isL4 ? [3] : undefined;

  const { data: members, isLoading } = useTeamMembers({
    search,
    role: roleFilter,
    gabineteId: gabineteId || undefined,
    roleLevels,
  });
  const toggleActive = useToggleMemberActive();
  const updateRole = useUpdateMemberRole();

  if (role !== "admin" && role !== "super_admin" && role !== "secretaria") {
    return <Navigate to="/" replace />;
  }

  const handleToggle = async (userId: string, isActive: boolean) => {
    setTogglingId(userId);
    try {
      await toggleActive.mutateAsync({ userId, isActive });
      toast({ title: isActive ? "Acesso aprovado com sucesso!" : "Acesso bloqueado" });
    } catch {
      toast({ title: "Erro ao alterar status", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      toast({ title: "Cargo atualizado com sucesso!" });
    } catch {
      toast({ title: "Erro ao alterar cargo", variant: "destructive" });
    }
  };

  const totalCount = members?.length ?? 0;
  const activeCount = members?.filter((m) => m.is_active).length ?? 0;
  const pendingCount = members?.filter((m) => !m.is_active).length ?? 0;

  // L4 specific stats
  const totalAlcance = isL4
    ? members?.reduce((s, m) => s + (m.alcance_eleitoral || 0), 0) ?? 0
    : 0;
  const mediaProducao = isL4 && totalCount > 0
    ? Math.round(totalAlcance / totalCount)
    : 0;

  const pageTitle = isL4 ? "Vereadores Aliados" : "Gestão de Equipa";
  const pageDesc = isL4
    ? "Gerencie os vereadores da sua rede política"
    : "Gerencie os membros da sua equipa e controle acessos";
  const inviteLabel = isL4 ? "Adicionar Vereador" : "Convidar Assessor";
  const roleOptions = isL3 ? ROLE_OPTIONS_L3 : ROLE_OPTIONS_DEFAULT;

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl">
            {pageTitle}
          </h1>
          <p className="label-ui mt-1">{pageDesc}</p>
        </div>
        {!isL4 && (
          <Button
            className="gap-2 font-bold uppercase tracking-wider text-sm h-12 shrink-0 rounded-full"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            {inviteLabel}
          </Button>
        )}
      </div>

      {/* Stats cards */}
      {isL4 ? (
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-2xl shadow-sm border-border bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-medium tabular-nums whitespace-nowrap">{totalCount}</p>
                <p className="text-[10px] text-slate-400 font-medium">Gabinetes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm border-border bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-medium tabular-nums whitespace-nowrap">{totalAlcance.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-slate-400 font-medium">Alcance total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm border-border bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-medium tabular-nums whitespace-nowrap">{mediaProducao}</p>
                <p className="text-[10px] text-slate-400 font-medium">Média/vereador</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-2xl shadow-sm border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-medium tabular-nums whitespace-nowrap">{totalCount}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-medium tabular-nums whitespace-nowrap">{activeCount}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-medium tabular-nums whitespace-nowrap">{pendingCount}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Pendentes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isL4 ? "Buscar vereador ou cidade..." : "Buscar por nome ou e-mail..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        {!isL4 && (
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="sm:w-52 rounded-xl">
              <UserCheck className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <TeamTable
          members={members ?? []}
          onToggleActive={handleToggle}
          onChangeRole={handleRoleChange}
          togglingId={togglingId}
          currentUserId={user?.id}
          viewMode={isL4 ? "l4" : isL3 ? "l3" : "default"}
        />
      )}

      <InviteMemberModal open={inviteOpen} onOpenChange={setInviteOpen} callerRoleLevel={roleLevel} />
    </div>
  );
}
