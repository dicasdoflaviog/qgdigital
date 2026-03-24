import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, ToggleRight, CheckCircle, XCircle } from "lucide-react";
import { useFeatureFlags, AVAILABLE_FEATURES } from "@/hooks/useFeatureFlags";
import { toast } from "@/hooks/use-toast";

export function FeatureFlagsPanel() {
  // L4 users
  const { data: l4Users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["l4-users-flags"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_level", 4);
      if (!data?.length) return [];
      const ids = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      return profiles ?? [];
    },
  });

  const { flags, isLoading: loadingFlags, toggleFlag, isFeatureEnabled } = useFeatureFlags();

  const handleToggle = async (clienteId: string, featureKey: string, currentEnabled: boolean) => {
    try {
      await toggleFlag.mutateAsync({ clienteId, featureKey, enabled: !currentEnabled });
      toast({
        title: !currentEnabled ? "✅ Recurso ativado" : "❌ Recurso desativado",
        description: `${AVAILABLE_FEATURES.find((f) => f.key === featureKey)?.label} para ${l4Users.find((u: any) => u.id === clienteId)?.full_name || "cliente"}`,
      });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  if (loadingUsers || loadingFlags) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <ToggleRight className="h-5 w-5 text-qg-blue-500" />
        <h3 className="text-sm font-medium">Editor de Habilidades — Feature Flags</h3>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        Ative ou desative recursos por cliente. Mudanças são aplicadas em tempo real.
      </p>

      {l4Users.length === 0 ? (
        <Card className="border-qg-blue-500/20">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum cliente Nível 4 cadastrado.
          </CardContent>
        </Card>
      ) : (
        l4Users.map((user: any) => (
          <Card key={user.id} className="border-qg-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {user.full_name || user.id.slice(0, 8)}
                <Badge variant="outline" className="text-[9px] border-qg-blue-500/30 text-qg-blue-600">Nível 4</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {AVAILABLE_FEATURES.map((feature) => {
                  const enabled = isFeatureEnabled(feature.key, user.id);
                  return (
                    <div
                      key={feature.key}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        enabled ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {enabled ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{feature.label}</p>
                          <p className="text-[10px] text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={() => handleToggle(user.id, feature.key, enabled)}
                        disabled={toggleFlag.isPending}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
