import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Loader2, ShieldCheck, Eye, Users, CheckCircle2 } from "lucide-react";
import type { TeamMember } from "@/hooks/useTeamMembers";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Vereador / Admin",
  secretaria: "Gestor de Gabinete",
  assessor: "Assessor de Campo",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-destructive/10 text-destructive border-destructive/20",
  admin: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  secretaria: "bg-info/10 text-info border-info/20",
  assessor: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
};

const CHANGEABLE_ROLES: { value: AppRole; label: string }[] = [
  { value: "assessor", label: "Assessor de Campo" },
  { value: "secretaria", label: "Gestor de Gabinete" },
];

type ViewMode = "default" | "l3" | "l4";

interface Props {
  members: TeamMember[];
  onToggleActive: (userId: string, isActive: boolean) => void;
  onChangeRole: (userId: string, role: AppRole) => void;
  togglingId: string | null;
  currentUserId?: string;
  viewMode?: ViewMode;
}

export default function TeamTable({ members, onToggleActive, onChangeRole, togglingId, currentUserId, viewMode = "default" }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-medium text-[11px] text-muted-foreground">
              {viewMode === "l4" ? "Vereador" : "Membro"}
            </TableHead>
            {viewMode === "l4" ? (
              <>
                <TableHead className="font-medium text-[11px] text-muted-foreground hidden md:table-cell">Cidade</TableHead>
                <TableHead className="font-medium text-[11px] text-muted-foreground">Equipe</TableHead>
                <TableHead className="font-medium text-[11px] text-muted-foreground">Alcance</TableHead>
                <TableHead className="font-medium text-[11px] text-muted-foreground text-right">Ações</TableHead>
              </>
            ) : viewMode === "l3" ? (
              <>
                <TableHead className="font-medium text-[11px] text-muted-foreground">Cargo</TableHead>
                <TableHead className="font-medium text-[11px] text-muted-foreground">Eleitores</TableHead>
                <TableHead className="font-medium text-[11px] text-muted-foreground hidden md:table-cell">Demandas</TableHead>
                <TableHead className="font-medium text-[11px] text-muted-foreground">Status</TableHead>
                <TableHead className="font-medium text-[11px] text-muted-foreground text-right">Ações</TableHead>
              </>
            ) : (
              <>
                <TableHead className="font-medium text-[11px] text-muted-foreground hidden md:table-cell">E-mail</TableHead>
                <TableHead className="font-medium text-[11px] text-muted-foreground">Cargo</TableHead>
                <TableHead className="font-medium text-[11px] text-muted-foreground">Status</TableHead>
                <TableHead className="font-medium text-[11px] text-muted-foreground text-right">Ações</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => {
            const isSelf = m.id === currentUserId;
            const isAdmin = m.role === "admin" || m.role === "super_admin";
            const initials = m.full_name
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            if (viewMode === "l4") {
              return (
                <TableRow key={m.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl">
                        <AvatarImage src={m.avatar_url ?? undefined} className="rounded-xl" />
                        <AvatarFallback className="rounded-xl text-xs font-medium bg-blue-500/10 text-blue-600">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.full_name}</p>
                        <Badge variant="outline" className="text-[10px] font-medium rounded-full px-2 bg-blue-500/10 text-blue-600 border-blue-500/20">
                          Vereador
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{m.cidade || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{m.tamanho_equipe || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-medium text-foreground">{(m.alcance_eleitoral || 0).toLocaleString("pt-BR")}</span>
                      <span className="text-xs text-muted-foreground">eleitores</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs font-medium rounded-full"
                      onClick={() => navigate(`/gestao-base?gabinete=${m.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Visualizar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            }

            // L3 view with performance columns
            if (viewMode === "l3") {
              return (
                <TableRow key={m.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl">
                        <AvatarImage src={m.avatar_url ?? undefined} className="rounded-xl" />
                        <AvatarFallback className="rounded-xl text-xs font-medium bg-cyan-500/10 text-cyan-600">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.full_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Desde {new Date(m.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isSelf ? (
                      <Badge variant="outline" className={`text-[10px] font-medium rounded-full px-3 ${ROLE_COLORS[m.role] ?? ""}`}>
                        {ROLE_LABELS[m.role] ?? m.role}
                      </Badge>
                    ) : (
                      <Select value={m.role} onValueChange={(v) => onChangeRole(m.id, v as AppRole)}>
                        <SelectTrigger className="h-7 w-auto min-w-[140px] text-[11px] font-medium rounded-full border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANGEABLE_ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-3.5 w-3.5 text-cyan-500" />
                      <span className="font-medium">{m.total_eleitores ?? 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-medium">{m.demandas_atendidas ?? 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {m.is_active ? (
                      <Badge className="rounded-full px-3 text-[10px] font-medium bg-success/10 text-success border border-success/20 hover:bg-success/10">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge className="rounded-full px-3 text-[10px] font-medium bg-warning/10 text-warning border border-warning/20 hover:bg-warning/10">
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground italic">Você</span>
                    ) : togglingId === m.id ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto text-muted-foreground" />
                    ) : !m.is_active ? (
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 text-xs font-medium rounded-full bg-success hover:bg-success/90 text-success-foreground"
                        onClick={() => onToggleActive(m.id, true)}
                      >
                        <Check className="h-3 w-3" /> Aprovar
                      </Button>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">Ativo</span>
                        <Switch checked={m.is_active} onCheckedChange={(checked) => onToggleActive(m.id, checked)} />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            }

            // Default view (L5/super_admin)
            return (
              <TableRow key={m.id} className="group hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-xl">
                      <AvatarImage src={m.avatar_url ?? undefined} className="rounded-xl" />
                      <AvatarFallback className="rounded-xl text-xs font-medium bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.full_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Desde {new Date(m.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">{m.whatsapp || "—"}</span>
                </TableCell>
                <TableCell>
                  {isAdmin || isSelf ? (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium rounded-full px-3 ${ROLE_COLORS[m.role] ?? ""}`}
                    >
                      {ROLE_LABELS[m.role] ?? m.role}
                    </Badge>
                  ) : (
                    <Select value={m.role} onValueChange={(v) => onChangeRole(m.id, v as AppRole)}>
                      <SelectTrigger className="h-7 w-auto min-w-[140px] text-[11px] font-medium rounded-full border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANGEABLE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {m.is_active ? (
                    <Badge className="rounded-full px-3 text-[10px] font-medium bg-success/10 text-success border border-success/20 hover:bg-success/10">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge className="rounded-full px-3 text-[10px] font-medium bg-warning/10 text-warning border border-warning/20 hover:bg-warning/10">
                      Pendente
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isSelf ? (
                    <span className="text-xs text-muted-foreground italic">Você</span>
                  ) : togglingId === m.id ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto text-muted-foreground" />
                  ) : !m.is_active ? (
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 text-xs font-medium rounded-full bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => onToggleActive(m.id, true)}
                    >
                      <Check className="h-3 w-3" /> Aprovar
                    </Button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">
                        {m.is_active ? "Ativo" : "Bloqueado"}
                      </span>
                      <Switch checked={m.is_active} onCheckedChange={(checked) => onToggleActive(m.id, checked)} />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                {viewMode === "l4" ? "Nenhum vereador encontrado" : "Nenhum membro encontrado"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
