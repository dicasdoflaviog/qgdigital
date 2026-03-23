import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAllPending, removePending, getPendingCount, PendingCadastro } from "@/lib/offlineQueue";
import { toast } from "@/hooks/use-toast";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB may not be available
    }
  }, []);

  const syncOne = async (item: PendingCadastro): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("eleitores")
        .insert({
          nome: item.nome,
          whatsapp: item.whatsapp,
          bairro: item.bairro,
          data_nascimento: item.data_nascimento,
          situacao: item.situacao,
          is_leader: item.is_leader,
        });

      if (error) throw error;

      // Clean up after success
      await removePending(item.id);
      return true;
    } catch {
      return false;
    }
  };

  const syncAll = useCallback(async () => {
    if (syncing || !navigator.onLine) return;
    setSyncing(true);

    try {
      const pending = await getAllPending();
      if (pending.length === 0) return;

      let synced = 0;
      for (const item of pending) {
        const ok = await syncOne(item);
        if (ok) synced++;
        else break; // Stop on first failure (likely still offline)
      }

      if (synced > 0) {
        toast({
          title: "✅ Dados de campo sincronizados com sucesso!",
          description: `${synced} cadastro(s) enviado(s) ao servidor.`,
        });
      }
    } finally {
      setSyncing(false);
      await refreshCount();
    }
  }, [syncing, refreshCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncAll();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync attempt + count
    refreshCount();
    if (navigator.onLine) syncAll();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncAll, refreshCount]);

  return { isOnline, pendingCount, syncing, refreshCount, syncAll };
}
