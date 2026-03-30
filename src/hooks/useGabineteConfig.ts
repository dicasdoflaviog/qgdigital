import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GabineteConfig } from "@/types/gabinete";
import { useAuth } from "@/contexts/AuthContext";

async function fetchGabineteConfig(): Promise<GabineteConfig | null> {
  const { data, error } = await supabase
    .from("gabinete_config" as any)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data as GabineteConfig | null;
}

async function updateGabineteConfig(
  id: string,
  updates: Partial<Omit<GabineteConfig, "id" | "gabinete_id">>
): Promise<void> {
  const { error } = await supabase
    .from("gabinete_config" as any)
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

async function uploadLogo(file: File, gabinete_id: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${gabinete_id}/logo.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("gabinetes")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("gabinetes").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export function useGabineteConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["gabinete_config", user?.id],
    queryFn: fetchGabineteConfig,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // update: atualiza por id (para SPEC-B / useGerarOficio)
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<GabineteConfig> }) =>
      updateGabineteConfig(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gabinete_config"] }),
  });

  // upsert: mantido para compatibilidade com ConfiguracaoGabinete.tsx
  const upsertMutation = useMutation({
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gabinete_config"] }),
  });

  // uploadLogo: para SPEC-B
  const uploadLogoMutation = useMutation({
    mutationFn: ({ file, gabinete_id, config_id }: { file: File; gabinete_id: string; config_id: string }) =>
      uploadLogo(file, gabinete_id).then(async (url) => {
        await updateGabineteConfig(config_id, { logo_url: url });
        return url;
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gabinete_config"] }),
  });

  return {
    config: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    // Para ConfiguracaoGabinete.tsx (compat)
    upsert: upsertMutation,
    isUpdating: upsertMutation.isPending,
    // Para SPEC-B
    update: updateMutation.mutateAsync,
    uploadLogo: uploadLogoMutation.mutateAsync,
    isUploadingLogo: uploadLogoMutation.isPending,
  };
}
