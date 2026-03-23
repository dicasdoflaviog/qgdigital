import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePendingFeedbacks() {
  const { role } = useAuth();

  const { data: count = 0 } = useQuery({
    queryKey: ["pending-feedbacks-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("feedbacks")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");
      if (error) return 0;
      return count || 0;
    },
    enabled: role === "super_admin",
    refetchInterval: 30000, // refresh every 30s
  });

  return count;
}