import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to realtime changes on instituicoes & emendas tables.
 * Call this once at page/layout level, NOT inside query hooks.
 */
export function useRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "instituicoes" }, () => {
        qc.invalidateQueries({ queryKey: ["instituicoes"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "emendas" }, () => {
        qc.invalidateQueries({ queryKey: ["emendas"] });
        qc.invalidateQueries({ queryKey: ["emendas-stats"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
