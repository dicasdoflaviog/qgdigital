import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GabineteConfig {
  id: string;
  gabinete_id: string;
  logo_url: string | null;
  foto_oficial_url: string | null;
  cor_primaria: string;
  nome_mandato: string | null;
  cidade_estado: string | null;
  endereco_sede: string | null;
  telefone_contato: string | null;
  ia_nome: string | null;
}

export function useGabineteConfig() {
  const { user, roleLevel } = useAuth();
  const queryClient = useQueryClient();

  // Fetch the user's profile to get gabinete_id
  const profileQuery = useQuery({
    queryKey: ["my_profile_gabinete", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("gabinete_id")
        .eq("id", user!.id)
        .single();
      return data?.gabinete_id as string | null;
    },
    enabled: !!user,
  });

  // For L5 users without a gabinete_id, fallback to their own user ID
  // (gabinete_config.gabinete_id FK references profiles.id, so any profile ID works)
  const userGabineteId = profileQuery.data || (roleLevel >= 5 ? user?.id ?? null : null);

  const query = useQuery({
    queryKey: ["gabinete_config", userGabineteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gabinete_config" as any)
        .select("*")
        .eq("gabinete_id", userGabineteId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as GabineteConfig | null;
    },
    enabled: !!user && !!userGabineteId,
  });

  const upsert = useMutation({
    mutationFn: async (values: Partial<GabineteConfig> & { gabinete_id: string }) => {
      const { data: existing } = await supabase
        .from("gabinete_config" as any)
        .select("id")
        .eq("gabinete_id", values.gabinete_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("gabinete_config" as any)
          .update(values)
          .eq("gabinete_id", values.gabinete_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("gabinete_config" as any)
          .insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gabinete_config"] });
    },
  });

  return { config: query.data, isLoading: query.isLoading || profileQuery.isLoading, upsert, gabineteId: userGabineteId };
}
