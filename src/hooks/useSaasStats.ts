import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface SaasLog {
  id: string;
  action: string;
  user_id: string;
  created_at: string;
  userName: string;
}

export interface SaasGabinete {
  id: string;
  full_name: string | null;
  is_active: boolean;
}

export interface SaasIncident {
  id: string;
  message: string;
  context: string;
  created_at: string;
  userName: string;
}

export function useSaasStats() {
  // Active gabinete count: user_roles(admin) → profiles(is_active)
  const { data: gabineteData, isSuccess: gabSuccess } = useQuery({
    queryKey: ["saas-gabinetes"],
    queryFn: async () => {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (!adminRoles?.length) return { count: 0, gabinetes: [] as SaasGabinete[] };
      const adminIds = adminRoles.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, is_active")
        .in("id", adminIds);
      const all = (profiles ?? []) as SaasGabinete[];
      return { count: all.filter((g) => g.is_active).length, gabinetes: all };
    },
    staleTime: 30_000,
  });

  // Incident count: error_logs in last 24h (super_admin only)
  const { data: incidenteCount = 0 } = useQuery({
    queryKey: ["saas-incidents"],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("error_logs" as any)
        .select("id", { count: "exact", head: true })
        .gte("created_at", since);
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  // Archived records: backup_exclusoes total (proxy for data safety)
  const { data: archivedCount = 0 } = useQuery({
    queryKey: ["saas-archived"],
    queryFn: async () => {
      const { count } = await supabase
        .from("backup_exclusoes")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  // Recent audit logs for the live feed
  const { data: recentLogs = [] } = useQuery<SaasLog[]>({
    queryKey: ["saas-audit-logs"],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from("audit_logs")
        .select("id, action, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (!logs?.length) return [];
      const userIds = [...new Set(logs.map((l: any) => l.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const nameMap: Record<string, string> = {};
      (profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name ?? "Usuário"; });
      return logs.map((l: any) => ({
        id: l.id,
        action: l.action as string,
        user_id: l.user_id,
        created_at: l.created_at,
        userName: nameMap[l.user_id] ?? "Sistema",
      }));
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // Recent error logs for incidents sheet
  const { data: recentIncidents = [] } = useQuery<SaasIncident[]>({
    queryKey: ["saas-error-logs"],
    queryFn: async () => {
      const { data: errors } = await supabase
        .from("error_logs" as any)
        .select("id, message, context, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(10);
      if (!errors?.length) return [];
      const userIds = [...new Set((errors as any[]).map((e) => e.user_id).filter(Boolean))];
      const nameMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds as string[]);
        (profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name ?? "Usuário"; });
      }
      return (errors as any[]).map((e) => ({
        id: e.id,
        message: e.message as string,
        context: (e.context as string) || "",
        created_at: e.created_at,
        userName: nameMap[e.user_id] ?? "Sistema",
      }));
    },
    staleTime: 60_000,
  });

  const fmtTime = (d: string) => {
    try { return format(new Date(d), "HH:mm", { locale: ptBR }); }
    catch { return "--:--"; }
  };

  const logTipo = (action: string): "info" | "success" | "warning" | "error" => {
    const a = action.toLowerCase();
    if (a.includes("error") || a.includes("fail") || a.includes("falh")) return "error";
    if (a.includes("delete") || a.includes("exclu") || a.includes("remov")) return "warning";
    if (a.includes("insert") || a.includes("creat") || a.includes("novo") || a.includes("register")) return "success";
    return "info";
  };

  return {
    gabineteCount: gabineteData?.count ?? 0,
    gabinetes: gabineteData?.gabinetes ?? [],
    incidenteCount,
    archivedCount,
    recentLogs,
    recentIncidents,
    isOnline: gabSuccess,
    fmtTime,
    logTipo,
  };
}
