import React, { createContext, useContext } from "react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

interface OfflineContextType {
  isOnline: boolean;
  pendingCount: number;
  syncing: boolean;
  refreshCount: () => Promise<void>;
  syncAll: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  pendingCount: 0,
  syncing: false,
  refreshCount: async () => {},
  syncAll: async () => {},
});

export const useOffline = () => useContext(OfflineContext);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const sync = useOfflineSync();

  return (
    <OfflineContext.Provider value={sync}>
      {children}
    </OfflineContext.Provider>
  );
}
