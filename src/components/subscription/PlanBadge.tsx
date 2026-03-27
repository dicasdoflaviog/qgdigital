import { Crown, Zap, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PLAN_LABELS, PLAN_BG, PLAN_COLORS, type PlanKey } from "@/hooks/useSubscription";

interface PlanBadgeProps {
  plan: PlanKey;
  className?: string;
}

const PLAN_ICON: Record<PlanKey, React.ElementType> = {
  bronze: Star,
  silver: Zap,
  gold: Crown,
};

export function PlanBadge({ plan, className = "" }: PlanBadgeProps) {
  const Icon = PLAN_ICON[plan];
  return (
    <Badge
      className={`${PLAN_BG[plan]} ${PLAN_COLORS[plan]} text-[10px] font-medium gap-1 ${className}`}
      variant="outline"
    >
      <Icon className="h-3 w-3" />
      {PLAN_LABELS[plan]}
    </Badge>
  );
}
