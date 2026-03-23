import { Eye, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoleSimulator, NIVEIS } from "@/hooks/useRoleSimulator";
import { cn } from "@/lib/utils";

export function RoleSwitcher() {
  const { realRole, currentLevel, isSimulating, simulateLevel, stopSimulation } = useRoleSimulator();

  if (realRole !== "super_admin") return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1.5 h-9 px-2 sm:px-3",
            isSimulating && "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
          )}
        >
          <Eye className="h-4 w-4 shrink-0" />
          <span className="text-xs font-medium hidden sm:inline">N{currentLevel}</span>
          {isSimulating && (
            <Badge className="hidden sm:flex bg-amber-500 text-white border-0 text-[9px] px-1 py-0 font-medium h-4">
              simulando
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
          Simular nível de acesso
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {NIVEIS.map((nivel) => {
          const isActive = currentLevel === nivel.nivel;
          const isReal = nivel.nivel === 5;

          return (
            <DropdownMenuItem
              key={nivel.nivel}
              onClick={() => {
                if (isReal) {
                  stopSimulation();
                } else {
                  simulateLevel(nivel);
                }
              }}
              className={cn("gap-3 cursor-pointer", isActive && "bg-primary/10")}
            >
              <span className="text-base w-5 text-center shrink-0">{nivel.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{nivel.label}</p>
                <p className="text-[10px] text-muted-foreground">Nível {nivel.nivel}</p>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
              {isReal && !isActive && (
                <span className="text-[10px] text-muted-foreground shrink-0">seu nível</span>
              )}
            </DropdownMenuItem>
          );
        })}

        {isSimulating && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={stopSimulation}
              className="gap-2 cursor-pointer text-amber-600 focus:text-amber-600"
            >
              <Eye className="h-4 w-4" />
              <span className="text-sm">Voltar ao meu nível real</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
