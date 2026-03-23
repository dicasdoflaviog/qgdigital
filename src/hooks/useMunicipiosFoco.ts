import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MunicipioFoco {
  id: string;
  nome: string;
  estado: string;
  latitude: number;
  longitude: number;
  zoom_ideal: number;
}

export function useMunicipiosFoco(estado?: string | null) {
  return useQuery({
    queryKey: ["municipios_foco", estado],
    queryFn: async () => {
      let query = supabase
        .from("municipios_foco" as any)
        .select("*")
        .order("nome");
      if (estado) query = query.eq("estado", estado);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MunicipioFoco[];
    },
  });
}
