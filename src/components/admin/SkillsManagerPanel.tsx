import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSkillsMatrix, ALL_SKILLS, L5_EXCLUSIVE_FEATURES } from "@/hooks/useSkillsMatrix";

const LEVEL_LABELS = [
  { level: 1, label: "L1 · Assessor", color: "text-blue-500" },
  { level: 2, label: "L2 · Secretária", color: "text-cyan-500" },
  { level: 3, label: "L3 · Vereador", color: "text-emerald-500" },
  { level: 4, label: "L4 · Líder", color: "text-amber-500" },
  { level: 5, label: "L5 · Master", color: "text-qg-blue-500" },
];

export function SkillsManagerPanel() {
  const { skills, isLoading, toggleSkill, isSkillEnabled } = useSkillsMatrix();

  const handleToggle = async (featureKey: string, roleLevel: number, currentEnabled: boolean) => {
    // Block toggling L5 features for lower levels
    if (L5_EXCLUSIVE_FEATURES.includes(featureKey as any) && roleLevel < 5) {
      toast({
        title: "🔒 Recurso protegido",
        description: "Este recurso é exclusivo do Nível 5 e não pode ser alterado.",
        variant: "destructive",
      });
      return;
    }
    // Block disabling L5 features for L5
    if (roleLevel === 5 && L5_EXCLUSIVE_FEATURES.includes(featureKey as any)) {
      toast({
        title: "🔒 Proteção ativa",
        description: "Recursos do System Master não podem ser desativados.",
        variant: "destructive",
      });
      return;
    }

    try {
      await toggleSkill.mutateAsync({ featureKey, roleLevel, enabled: !currentEnabled });
      toast({
        title: !currentEnabled ? "✅ Habilitado" : "❌ Desabilitado",
        description: `${ALL_SKILLS.find((s) => s.key === featureKey)?.label} para ${LEVEL_LABELS.find((l) => l.level === roleLevel)?.label}`,
      });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando matriz…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-qg-blue-500" />
        <h3 className="text-sm font-medium">Skills Manager — Matriz de Permissões</h3>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        Controle quais funcionalidades estão disponíveis para cada nível. Mudanças refletem instantaneamente no menu lateral.
        Recursos do System Master (Auditoria, Recuperação, Sistema) são exclusivos do Nível 5 e não podem ser alterados.
      </p>

      <Card className="border-qg-blue-500/20 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-card z-10 min-w-[160px]">
                    Funcionalidade
                  </th>
                  {LEVEL_LABELS.map((l) => (
                    <th key={l.level} className="p-3 text-center min-w-[90px]">
                      <span className={`font-medium ${l.color}`}>{l.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_SKILLS.map((skill, idx) => (
                  <tr key={skill.key} className={`border-b border-border ${idx % 2 === 0 ? "bg-muted/20" : ""}`}>
                    <td className="p-3 font-medium sticky left-0 bg-card z-10 border-r border-border">
                      {skill.label}
                    </td>
                    {LEVEL_LABELS.map((l) => {
                      const enabled = isSkillEnabled(skill.key, l.level);
                      const isL5Exclusive = L5_EXCLUSIVE_FEATURES.includes(skill.key as any);
                      const isProtected = isL5Exclusive && l.level < 5;
                      const isL5Self = isL5Exclusive && l.level === 5;

                      return (
                        <td key={l.level} className="p-3 text-center">
                          {isProtected ? (
                            <div className="flex justify-center">
                              <Lock className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          ) : isL5Self ? (
                            <div className="flex justify-center">
                              <Badge className="bg-qg-blue-500/10 text-qg-blue-600 border-qg-blue-500/20 text-[9px]">
                                <Shield className="h-3 w-3 mr-0.5" /> Fixo
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <Switch
                                checked={enabled}
                                disabled={toggleSkill.isPending}
                                onCheckedChange={() => handleToggle(skill.key, l.level, enabled)}
                              />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
