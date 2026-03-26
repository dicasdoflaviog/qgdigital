import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, X, Shield, UserCheck, FileText, Users, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleLevel {
  level: number;
  value: AppRole;
  label: string;
  description: string;
  icon: React.ElementType;
  menus: string;
}

const roleLevels: RoleLevel[] = [
  { level: 1, value: "assessor", label: "Assessor", description: "Cadastro de eleitores e minhas demandas", icon: Users, menus: "Cadastro · Demandas" },
  { level: 2, value: "secretaria", label: "Secretária", description: "Agenda, eleitores e ofícios do gabinete", icon: FileText, menus: "Agenda · Eleitores · Ofícios · Radar" },
  { level: 3, value: "admin", label: "Vereador", description: "Gestão do gabinete, equipe, emendas e relatórios", icon: UserCheck, menus: "Dashboard · Equipe · Emendas" },
  { level: 4, value: "lider_politico", label: "Líder Político", description: "Estratégia regional, mapa de calor, performance de gabinetes", icon: Shield, menus: "Observatório · Mapa · Gestão Base" },
  { level: 5, value: "super_admin", label: "System Master", description: "MRR, faturamento, gestão de clientes e auditoria global", icon: Crown, menus: "Financeiro · Contratos · Sistema · Backup" },
];

export function RoleSimulatorFAB() {
  const { realRole, simulatedLevel, impersonateRole } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (realRole !== "super_admin") return null;

  const currentLevel = simulatedLevel ?? 5;

  const handleSelect = (rl: RoleLevel) => {
    queryClient.clear();

    if (rl.level === 5) {
      impersonateRole(null, null);
    } else {
      impersonateRole(rl.value, rl.level);
    }

    setOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-36 right-4 md:bottom-[4.5rem] md:right-4 z-role-fab flex h-12 w-12 items-center justify-center rounded-full bg-qg-blue-600 text-white shadow-lg shadow-purple-600/30 hover:bg-qg-blue-700 active:scale-95 transition-all"
        title="Olho Roxo — Simulador de Papéis"
      >
        {open ? <X className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-[13rem] right-4 md:bottom-[7.5rem] md:right-4 z-role-fab w-80 rounded-xl border border-qg-blue-500/30 bg-card shadow-2xl shadow-purple-900/20 animate-fade-up overflow-hidden">
          <div className="px-4 py-3 border-b border-qg-blue-500/20 bg-qg-blue-500/5">
            <p className="text-xs font-medium text-qg-blue-600 dark:text-qg-blue-400 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Olho Roxo — Hierarquia Suprema
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Nível atual: <span className="font-medium text-foreground">{currentLevel}</span> — Hard Reset ao trocar.
            </p>
          </div>

          <div className="p-2 space-y-1 max-h-[55vh] overflow-y-auto">
            {roleLevels.map((rl) => {
              const isActive = rl.level === currentLevel;
              return (
                <button
                  key={rl.level}
                  onClick={() => handleSelect(rl)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? "bg-qg-blue-500/10 border border-qg-blue-500/30"
                      : "hover:bg-accent border border-transparent"
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 text-xs font-medium ${
                    isActive ? "bg-qg-blue-600 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {rl.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground">{rl.label}</span>
                      {isActive && (
                        <Badge className="bg-qg-blue-600 text-white text-[8px] px-1 py-0 font-medium">ATIVO</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{rl.description}</p>
                    <p className="text-[9px] text-qg-blue-500/70 mt-0.5 truncate">{rl.menus}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {currentLevel !== 5 && (
            <div className="px-2 pb-2">
              <button
                onClick={() => {
                  queryClient.clear();
                  impersonateRole(null, null);
                  setOpen(false);
                  navigate("/", { replace: true });
                }}
                className="w-full flex items-center justify-center gap-1.5 text-[10px] text-destructive font-medium py-2 rounded-lg border border-destructive/20 hover:bg-destructive/5 transition-colors"
              >
                <X className="h-3 w-3" />
                Voltar ao System Master (Nível 5)
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
