import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Eleitor {
  id: string;
  nome: string;
  whatsapp: string;
  bairro: string;
  cidade: string | null;
  estado: string | null;
  gabinete_id: string | null;
  data_nascimento: string | null;
  situacao: string;
  is_leader: boolean;
  assessor_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EleitorInsert {
  nome: string;
  whatsapp?: string;
  bairro?: string;
  data_nascimento?: string | null;
  situacao?: string;
  is_leader?: boolean;
  assessor_id?: string | null;
  latitude?: number;
  longitude?: number;
}

const PAGE_SIZE = 30;

export function useVoters(filters?: {
  search?: string;
  bairro?: string;
  situacao?: string;
}) {
  const { role, roleLevel } = useAuth();

  return useQuery({
    queryKey: ["eleitores", filters, role],
    queryFn: async () => {
      // N4 (líder político) não acessa lista individual de eleitores
      if (roleLevel === 4) return [] as Eleitor[];

      let query = supabase
        .from("eleitores")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (filters?.bairro && filters.bairro !== "todos") {
        query = query.eq("bairro", filters.bairro);
      }
      if (filters?.situacao && filters.situacao !== "todos") {
        query = query.eq("situacao", filters.situacao);
      }
      if (filters?.search) {
        query = query.ilike("nome", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Eleitor[];
    },
  });
}

/**
 * Fetch ALL eleitores (up to 1000) for map heatmap rendering.
 * N4 (líder político): retorna apenas campos não sensíveis (sem whatsapp, bairro, cidade, data_nascimento).
 */
export function useVotersForMap() {
  const { role, roleLevel } = useAuth();

  return useQuery({
    queryKey: ["eleitores_map", role],
    queryFn: async () => {
      // N4: seleciona apenas campos não sensíveis para o mapa
      const columns = roleLevel === 4
        ? "id, situacao, gabinete_id, is_leader, assessor_id, created_at, latitude, longitude"
        : "id, bairro, cidade, gabinete_id, situacao, is_leader, assessor_id, created_at, latitude, longitude";

      const { data, error } = await supabase
        .from("eleitores")
        .select(columns)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      return (data ?? []) as (Pick<Eleitor, "id" | "situacao" | "gabinete_id" | "is_leader" | "assessor_id" | "created_at"> & { bairro?: string; cidade?: string | null; latitude?: number; longitude?: number })[];
    },
    staleTime: 60_000,
  });
}

export function useVotersPaginated(filters?: {
  search?: string;
  bairro?: string;
  situacao?: string;
}) {
  const { role, roleLevel } = useAuth();
  const [page, setPage] = useState(0);
  const [allData, setAllData] = useState<Eleitor[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(async (pageNum: number, reset = false) => {
    // N4 não acessa lista individual
    if (roleLevel === 4) {
      setAllData([]);
      setHasMore(false);
      return;
    }

    setLoading(true);
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("eleitores")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filters?.bairro && filters.bairro !== "todos") {
        query = query.eq("bairro", filters.bairro);
      }
      if (filters?.situacao && filters.situacao !== "todos") {
        query = query.eq("situacao", filters.situacao);
      }
      if (filters?.search) {
        query = query.ilike("nome", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as Eleitor[];
      setHasMore(rows.length === PAGE_SIZE);
      setAllData((prev) => reset ? rows : [...prev, ...rows]);
      setPage(pageNum);
    } finally {
      setLoading(false);
    }
  }, [filters?.bairro, filters?.situacao, filters?.search, roleLevel]);

  // Reset when filters change
  useEffect(() => {
    setAllData([]);
    setHasMore(true);
    fetchPage(0, true);
  }, [filters?.bairro, filters?.situacao, filters?.search, roleLevel]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPage(page + 1);
    }
  };

  return { data: allData, loading, hasMore, loadMore };
}

export function useVoterStats() {
  return useQuery({
    queryKey: ["eleitores-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eleitores")
        .select("id, bairro, situacao, data_nascimento, created_at");

      if (error) throw error;
      const eleitores = data ?? [];

      const total = eleitores.length;

      // Novos últimos 7 dias
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const novos7d = eleitores.filter(
        (e) => new Date(e.created_at) >= weekAgo
      ).length;

      // Bairro stats
      const bairroCount: Record<string, number> = {};
      eleitores.forEach((e) => {
        bairroCount[e.bairro] = (bairroCount[e.bairro] || 0) + 1;
      });
      const bairroStats = Object.entries(bairroCount)
        .map(([bairro, total]) => ({ bairro, total }))
        .sort((a, b) => b.total - a.total);

      const topBairro = bairroStats[0] ?? { bairro: "—", total: 0 };

      // Aniversariantes de hoje
      const today = new Date();
      const aniversariantes = eleitores.filter((e) => {
        if (!e.data_nascimento) return false;
        const dn = new Date(e.data_nascimento + "T12:00:00");
        return dn.getMonth() === today.getMonth() && dn.getDate() === today.getDate();
      });

      return { total, novos7d, bairroStats, topBairro, aniversariantes };
    },
  });
}

export function useCreateVoter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (voter: EleitorInsert) => {
      const { data, error } = await supabase
        .from("eleitores")
        .insert(voter)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eleitores"] });
      qc.invalidateQueries({ queryKey: ["eleitores-stats"] });
    },
  });
}

export function useUpdateVoter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Eleitor> & { id: string }) => {
      const { data, error } = await supabase
        .from("eleitores")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eleitores"] });
      qc.invalidateQueries({ queryKey: ["eleitores-stats"] });
    },
  });
}

export function useDeleteVoter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete: set excluido = true instead of removing
      const { error } = await supabase
        .from("eleitores")
        .update({ excluido: true } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eleitores"] });
      qc.invalidateQueries({ queryKey: ["eleitores-stats"] });
    },
  });
}
