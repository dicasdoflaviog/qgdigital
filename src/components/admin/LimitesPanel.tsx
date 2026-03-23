import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Database, HardDrive, Users, Shield, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LIMITS = {
  db: 500, // MB
  storage: 1024, // MB (1GB)
  users: 50000,
};

export function LimitesPanel() {
  const [dbUsage, setDbUsage] = useState(0);
  const [storageUsage, setStorageUsage] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        // Count active users from profiles
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true);

        setUserCount(count || 0);

        // Estimate DB usage from eleitores count (rough heuristic)
        const { count: eleitorCount } = await supabase
          .from("eleitores")
          .select("id", { count: "exact", head: true });

        // ~1KB per record estimate
        setDbUsage(Math.round(((eleitorCount || 0) * 1) / 1024 * 100) / 100);

        // Estimate storage from demandas-fotos bucket
        const { data: files } = await supabase.storage
          .from("demandas-fotos")
          .list("demandas", { limit: 1000 });

        const totalStorageMB = (files || []).reduce((acc, f) => {
          return acc + ((f.metadata as any)?.size || 500000) / (1024 * 1024);
        }, 0);
        setStorageUsage(Math.round(totalStorageMB * 100) / 100);
      } catch {
        // Silent fail - estimates are best-effort
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  const items = [
    {
      label: "Banco de Dados",
      icon: Database,
      used: dbUsage,
      limit: LIMITS.db,
      unit: "MB",
    },
    {
      label: "Storage (Fotos/Áudios)",
      icon: HardDrive,
      used: storageUsage,
      limit: LIMITS.storage,
      unit: "MB",
    },
    {
      label: "Usuários Ativos",
      icon: Users,
      used: userCount,
      limit: LIMITS.users,
      unit: "",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Painel de Limites
            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
              Super Admin
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {items.map((item) => {
            const pct = Math.min((item.used / item.limit) * 100, 100);
            const color = pct > 80 ? "text-destructive" : pct > 50 ? "text-warning" : "text-primary";
            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-bold">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </div>
                  <span className={`text-xs font-bold ${color}`}>
                    {item.unit ? `${item.used} ${item.unit}` : item.used} / {item.unit ? `${item.limit} ${item.unit}` : item.limit.toLocaleString()}
                  </span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Estratégia de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Backup semestral para Google Drive de 2TB recomendado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
