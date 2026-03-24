import { Crown, Award, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PLAN_LABELS, PLAN_BG, type SubscriptionPlan } from "@/hooks/useSubscription";

interface PlanBadgeProps {
  plan: SubscriptionPlan;
  className?: string;
}

const PLAN_ICON: Record<SubscriptionPlan, React.ElementType> = {
  bronze: Award,
  silver: Star,
  gold: Crown,
};

export function PlanBadge({ plan, className = "" }: PlanBadgeProps) {
  const Icon = PLAN_ICON[plan];
  return (
    <Badge
      className={`${PLAN_BG[plan]} text-foreground text-[10px] font-medium gap-1 ${className}`}
      variant="outline"
    >
      <Icon className="h-3 w-3" />
      {PLAN_LABELS[plan]}
    </Badge>
  );
}
