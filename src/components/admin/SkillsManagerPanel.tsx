import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Lock, Brain, Briefcase, TrendingUp, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSkillsMatrix, ALL_SKILLS, L5_EXCLUSIVE_FEATURES, type SkillGroup } from "@/hooks/useSkillsMatrix";

const LEVEL_LABELS = [
  { level: 1, label: "Assessor",   short: "N1", color: "text-blue-500",    bg: "bg-blue-500/10" },
  { level: 2, label: "Secretária", short: "N2", color: "text-cyan-500",    bg: "bg-cyan-500/10" },
  { level: 3, label: "Vereador",   short: "N3", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { level: 4, label: "Líder",      short: "N4", color: "text-amber-500",   bg: "bg-amber-500/10" },
  { level: 5, label: "Master",     short: "N5", color: "text-qg-blue-500", bg: "bg-qg-blue-500/10" },
];

const GROUP_META: Record<SkillGroup, { label: string; icon: React.ElementType; color: string; border: string }> = {
  inteligencia: { label: "Inteligência",  icon: Brain,       color: "text-purple-600",    border: "border-purple-200" },
  operacional:  { label: "Operacional",   icon: Briefcase,   color: "text-emerald-600",   border: "border-emerald-200" },
  estrategico:  { label: "Estratégico",   icon: TrendingUp,  color: "text-amber-600",     border: "border-amber-200" },
  ia:           { label: "IA & Relatórios", icon: Sparkles,  color: "text-qg-blue-600",   border: "border-qg-blue-200" },
};

const GROUPS: SkillGroup[] = ["inteligencia", "operacional", "estrategico", "ia"];

export function SkillsManagerPanel() {
  const { isLoading, toggleSkill, isSkillEnabled } = useSkillsMatrix();

  const handleToggle = async (featureKey: string, roleLevel: number, currentEnabled: boolean) => {
    if (L5_EXCLUSIVE_FEATURES.includes(featureKey as any) && roleLevel < 5) {
      toast({ title: "🔒 Recurso protegido", description: "Exclusivo do Nível 5.", variant: "destructive" });
      return;
    }
    if (roleLevel === 5 && L5_EXCLUSIVE_FEATURES.includes(featureKey as any)) {
      toast({ title: "🔒 Proteção ativa", description: "Recursos do System Master não podem ser desativados.", variant: "destructive" });
      return;
    }
    try {
      await toggleSkill.mutateAsync({ featureKey, roleLevel, enabled: !currentEnabled });
      const skill = ALL_SKILLS.find((s) => s.key === featureKey);
      const level = LEVEL_LABELS.find((l) => l.level === roleLevel);
      toast({
        title: !currentEnabled ? "✅ Poder concedido" : "❌ Poder removido",
        description: `${skill?.label} → ${level?.label}`,
      });
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando matriz de poderes…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-qg-blue-500/10 flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5 text-qg-blue-500" />
        </div>
        <div>
          <h3 className="text-sm font-medium">Controle de poderes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ative ou desative funcionalidades por nível de acesso. Mudanças refletem instantaneamente no menu lateral de todos os usuários.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-2">
        {LEVEL_LABELS.map((l) => {
          const total = ALL_SKILLS.filter((s) => !L5_EXCLUSIVE_FEATURES.includes(s.key as any) || l.level === 5).length;
          const enabled = ALL_SKILLS.filter((s) => isSkillEnabled(s.key, l.level)).length;
          return (
            <div key={l.level} className={`rounded-xl p-3 border ${l.bg} border-transparent text-center`}>
              <p className={`text-lg font-medium ${l.color} whitespace-nowrap`}>{enabled}</p>
              <p className="text-[10px] text-muted-foreground">{l.short} · {l.label}</p>
              <p className="text-[10px] text-muted-foreground/60">de {total}</p>
            </div>
          );
        })}
      </div>

      {/* Matrix by group */}
      {GROUPS.map((group) => {
        const groupSkills = ALL_SKILLS.filter((s) => s.group === group);
        const meta = GROUP_META[group];
        const Icon = meta.icon;

        return (
          <Card key={group} className={`border ${meta.border} overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${meta.border} flex items-center gap-2`}>
              <Icon className={`h-4 w-4 ${meta.color}`} />
              <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
              <Badge variant="outline" className="ml-auto text-[10px]">
                {groupSkills.length} funcionalidades
              </Badge>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground sticky left-0 bg-muted/30 z-10 min-w-[200px]">
                        Funcionalidade
                      </th>
                      {LEVEL_LABELS.map((l) => (
                        <th key={l.level} className="px-3 py-2 text-center min-w-[80px]">
                          <span className={`font-medium ${l.color}`}>{l.short}</span>
                          <p className="text-[9px] text-muted-foreground font-normal">{l.label}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupSkills.map((skill, idx) => (
                      <tr key={skill.key} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3 sticky left-0 bg-card z-10 border-r border-border">
                          <p className="font-medium text-foreground">{skill.label}</p>
                          {skill.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{skill.description}</p>
                          )}
                        </td>
                        {LEVEL_LABELS.map((l) => {
                          const enabled = isSkillEnabled(skill.key, l.level);
                          const isL5Exclusive = L5_EXCLUSIVE_FEATURES.includes(skill.key as any);
                          const isProtected = isL5Exclusive && l.level < 5;
                          const isL5Fixed = isL5Exclusive && l.level === 5;

                          return (
                            <td key={l.level} className="px-3 py-3 text-center">
                              {isProtected ? (
                                <div className="flex justify-center">
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground/30" />
                                </div>
                              ) : isL5Fixed ? (
                                <div className="flex justify-center">
                                  <Shield className="h-3.5 w-3.5 text-qg-blue-400" />
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <Switch
                                    checked={enabled}
                                    disabled={toggleSkill.isPending}
                                    onCheckedChange={() => handleToggle(skill.key, l.level, enabled)}
                                    className="scale-90"
                                  />
                                  {enabled ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-muted-foreground/30" />
                                  )}
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
        );
      })}

      <p className="text-[10px] text-muted-foreground text-center">
        🔒 Recursos protegidos do System Master (Auditoria, Recuperação, Sistema) são exclusivos do N5 e não podem ser alterados.
      </p>
    </div>
  );
}
