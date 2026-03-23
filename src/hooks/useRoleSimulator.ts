import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface SimulatorLevel {
  nivel: number;
  label: string;
  icon: string;
  role: AppRole | null;
  levelArg: number | null;
}

export const NIVEIS: SimulatorLevel[] = [
  { nivel: 5, label: "System Master",   icon: "👑", role: null,           levelArg: null },
  { nivel: 4, label: "Líder Político",  icon: "⚡", role: null,           levelArg: 4 },
  { nivel: 3, label: "Vereador",        icon: "🏛️", role: "admin",        levelArg: 3 },
  { nivel: 2, label: "Secretária",      icon: "📋", role: "secretaria",   levelArg: 2 },
  { nivel: 1, label: "Assessor",        icon: "👤", role: "assessor",     levelArg: 1 },
];

export function useRoleSimulator() {
  const { realRole, simulatedLevel, isImpersonating, impersonateRole } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const currentLevel = simulatedLevel ?? 5;

  const simulateLevel = (nivel: SimulatorLevel) => {
    queryClient.clear();
    impersonateRole(nivel.role, nivel.levelArg);
    navigate("/", { replace: true });
  };

  const stopSimulation = () => {
    queryClient.clear();
    impersonateRole(null, null);
    navigate("/", { replace: true });
  };

  return {
    realRole,
    currentLevel,
    isSimulating: isImpersonating,
    simulateLevel,
    stopSimulation,
  };
}
