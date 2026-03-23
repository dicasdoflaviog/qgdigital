import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Shield } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useFeatureFlags, type FeatureKey } from "@/hooks/useFeatureFlags";
import { useSkillsMatrix, ROUTE_TO_SKILL } from "@/hooks/useSkillsMatrix";

/** Routes restricted to specific levels (strict match) */
const levelRestrictedRoutes: Record<string, number[]> = {
  "/sistema": [5],
  "/admin/system-master": [5],
  "/master/admin": [5],
  "/central-recuperacao": [5],
  "/sugestoes": [5],
  "/gestao-base": [4, 5],
  "/observatorio": [4, 5],
};

/** Map routes to feature flag keys for L4 contract enforcement */
const featureFlagRoutes: Record<string, FeatureKey> = {
  "/mapa": "mapa_calor",
  "/observatorio": "observatorio",
  "/gestao-base": "gestao_base",
};

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, roleLevel, role, user } = useAuth();
  const location = useLocation();
  const toastShown = useRef<string | null>(null);

  // Feature flags for current user (L4 contract check)
  const { isFeatureEnabled, isLoading: flagsLoading } = useFeatureFlags(
    roleLevel === 4 && user?.id ? user.id : undefined
  );

  // Skills matrix (global level-based permissions)
  const { isSkillEnabled, isLoading: skillsLoading } = useSkillsMatrix();

  const path = location.pathname;

  // Skills matrix check: is the feature enabled for this level?
  const skillKey = ROUTE_TO_SKILL[path];
  const isSkillBlocked = skillKey && !isSkillEnabled(skillKey, roleLevel);

  // Check feature flag for L4 (contract-based)
  const featureKey = featureFlagRoutes[path];
  const isFeatureBlocked = roleLevel === 4 && featureKey && !isFeatureEnabled(featureKey);

  useEffect(() => {
    if (isSkillBlocked && toastShown.current !== path) {
      toastShown.current = path;
      toast.warning("Acesso restrito", {
        description: "Este módulo não está habilitado para o seu nível de acesso.",
      });
    }
    if (isFeatureBlocked && toastShown.current !== path) {
      toastShown.current = path;
      toast.warning("Recurso não contratado", {
        description: "Este recurso não está incluído no seu contrato. Contate o administrador.",
      });
    }
  }, [isSkillBlocked, isFeatureBlocked, path]);

  if (loading || (roleLevel === 4 && flagsLoading) || skillsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Shield className="h-8 w-8 text-primary animate-pulse" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Verificando acesso...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Check level-restricted routes
  const allowedLevels = levelRestrictedRoutes[path];
  if (allowedLevels && !allowedLevels.includes(roleLevel)) {
    return <Navigate to="/" replace />;
  }

  // Block by skills matrix
  if (isSkillBlocked) {
    return <Navigate to="/" replace />;
  }

  // Block L4 from disabled features (contract)
  if (isFeatureBlocked) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
