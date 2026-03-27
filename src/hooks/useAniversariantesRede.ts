import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { detectarSexo } from "@/lib/detectarSexo";

export interface AniversarianteRede {
  id: string;
  full_name: string;
  whatsapp: string | null;
  birth_date: string;
  genero: "M" | "F" | "O" | null;
  gabinete_id: string | null;
  role: string;
  avatar_url: string | null;
  diasParaAniversario: number;
  idade: number | null;
  nomeGabinete?: string;
  voice_clone_id?: string | null;
  voice_provider?: string | null;
  voice_configured?: boolean;
}

export interface AniversariantesFilters {
  gabineteId?: string | null;
  cargo?: "admin" | "assessor" | "secretaria" | "all";
  genero?: "M" | "F" | "all";
  diasAhead?: number;
}

export function useAniversariantesRede(filters: AniversariantesFilters = {}) {
  return useQuery({
    queryKey: ["aniversariantes-rede", filters],
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select("id, full_name, whatsapp, birth_date, genero, gabinete_id, avatar_url")
        .not("birth_date", "is", null)
        .eq("is_active", true);

      if (filters.gabineteId) {
        q = q.eq("gabinete_id", filters.gabineteId);
      }

      const { data: profiles, error } = await (q as any);
      if (error) throw error;

      const ids = (profiles ?? []).map((p: any) => p.id);
      const { data: roles } = ids.length > 0
        ? await supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", ids)
        : { data: [] };

      const roleMap = Object.fromEntries((roles ?? []).map((r: any) => [r.user_id, r.role]));

      const gabineteIds = [...new Set((profiles ?? []).map((p: any) => p.gabinete_id).filter(Boolean))];
      const { data: voiceConfigs } = gabineteIds.length > 0
        ? await (supabase
            .from("gabinete_config")
            .select("gabinete_id, voice_clone_id, voice_provider")
            .in("gabinete_id", gabineteIds) as any)
        : { data: [] };

      const voiceMap = Object.fromEntries(
        (voiceConfigs ?? []).map((v: any) => [v.gabinete_id, v])
      );

      const today = new Date();
      const diasAhead = filters.diasAhead ?? 30;

      const result: AniversarianteRede[] = (profiles ?? [])
        .map((p: any) => {
          const birth = new Date(p.birth_date + "T12:00:00");
          const thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
          let diff = Math.round((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diff < 0) diff += 365;

          const idade = today.getFullYear() - birth.getFullYear() - (today < thisYear ? 1 : 0);
          const genero = p.genero ?? detectarSexo(p.full_name.split(" ")[0]) ?? null;
          const voice = voiceMap[p.gabinete_id ?? ""] ?? null;

          return {
            ...p,
            genero: genero as "M" | "F" | "O" | null,
            role: roleMap[p.id] ?? "assessor",
            diasParaAniversario: diff,
            idade,
            voice_clone_id: voice?.voice_clone_id ?? null,
            voice_provider: voice?.voice_provider ?? null,
            voice_configured: Boolean(voice?.voice_clone_id),
          };
        })
        .filter((p: AniversarianteRede) => p.diasParaAniversario <= diasAhead)
        .filter((p: AniversarianteRede) => !filters.cargo || filters.cargo === "all" || p.role === filters.cargo)
        .filter((p: AniversarianteRede) => !filters.genero || filters.genero === "all" || p.genero === filters.genero)
        .sort((a: AniversarianteRede, b: AniversarianteRede) => a.diasParaAniversario - b.diasParaAniversario);

      return result;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useAniversariantesAmanha() {
  return useAniversariantesRede({ diasAhead: 1 });
}
