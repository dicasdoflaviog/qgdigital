import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGabineteConfig } from "@/hooks/useGabineteConfig";
import { BRAND } from "@/lib/brand";

/**
 * Sets document.title dynamically based on gabinete config.
 * Call once in AppLayout.
 */
export function useDocumentTitle(pageLabel?: string) {
  const { profile } = useAuth();
  const { config } = useGabineteConfig();

  useEffect(() => {
    const gabName = config?.nome_mandato || (profile?.full_name ? `Gabinete de ${profile.full_name}` : null);
    const parts: string[] = [];
    if (pageLabel) parts.push(pageLabel);
    if (gabName) parts.push(gabName);
    parts.push(BRAND.name);
    document.title = parts.join(" | ");
  }, [config, profile, pageLabel]);
}
