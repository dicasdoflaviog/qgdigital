import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type FaixaEtaria =
  | "Menor de 18"
  | "18 a 24"
  | "25 a 34"
  | "35 a 44"
  | "45 a 59"
  | "60 ou mais"
  | "Não informado";

export interface DemographicFilters {
  gabineteId?: string | null; // null = todos (N4+)
  sexo?: "M" | "F" | "O" | null;
  faixaEtaria?: FaixaEtaria | null;
  situacao?: string | null;
  bairro?: string | null;
  cidade?: string | null;
}

interface EleitorDemographic {
  id: string;
  sexo: string | null;
  data_nascimento: string | null;
  bairro: string;
  situacao: string;
  gabinete_id: string | null;
  cidade: string | null;
  created_at: string;
}

function calcAge(dataNascimento: string): number {
  const today = new Date();
  const birth = new Date(dataNascimento + "T12:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getFaixa(dataNascimento: string | null): FaixaEtaria {
  if (!dataNascimento) return "Não informado";
  const age = calcAge(dataNascimento);
  if (age < 18) return "Menor de 18";
  if (age <= 24) return "18 a 24";
  if (age <= 34) return "25 a 34";
  if (age <= 44) return "35 a 44";
  if (age <= 59) return "45 a 59";
  return "60 ou mais";
}

export const FAIXAS_ETARIAS: FaixaEtaria[] = [
  "Menor de 18",
  "18 a 24",
  "25 a 34",
  "35 a 44",
  "45 a 59",
  "60 ou mais",
  "Não informado",
];

export const FAIXAS_ETARIAS_FILTRO = FAIXAS_ETARIAS.filter((f) => f !== "Não informado");

// N4 (líder político): campos seguros apenas — dados sensíveis omitidos.
// A view eleitores_n4_view mascara no DB; o frontend não seleciona colunas sensíveis.
const N4_SAFE_COLUMNS = "id, sexo, situacao, gabinete_id, created_at" as const;
const FULL_COLUMNS    = "id, sexo, data_nascimento, bairro, situacao, gabinete_id, cidade, created_at" as const;

function useEleitorDemographics(gabineteId?: string | null, isN4 = false) {
  return useQuery({
    queryKey: ["voter-demographics", gabineteId ?? "all", isN4],
    queryFn: async () => {
      let query = supabase
        .from("eleitores")
        .select(isN4 ? N4_SAFE_COLUMNS : FULL_COLUMNS)
        .eq("excluido", false);

      // gabineteId === null → todos os gabinetes (N4+), undefined → usa RLS
      if (gabineteId) {
        query = query.eq("gabinete_id", gabineteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as EleitorDemographic[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVoterDemographics(filters: DemographicFilters = {}) {
  const { roleLevel } = useAuth();
  const isN4 = roleLevel === 4;
  const { data: raw = [], isLoading, error } = useEleitorDemographics(filters.gabineteId, isN4);

  const filtered = useMemo(() => {
    let data = raw;

    if (filters.sexo) data = data.filter((e) => e.sexo === filters.sexo);
    if (filters.situacao) data = data.filter((e) => e.situacao === filters.situacao);
    if (filters.bairro) data = data.filter((e) => e.bairro === filters.bairro);
    if (filters.cidade) data = data.filter((e) => (e.cidade || "Teixeira de Freitas") === filters.cidade);
    if (filters.faixaEtaria) {
      data = data.filter((e) => getFaixa(e.data_nascimento) === filters.faixaEtaria);
    }

    return data;
  }, [raw, filters.sexo, filters.situacao, filters.bairro, filters.cidade, filters.faixaEtaria]);

  const stats = useMemo(() => {
    const total = filtered.length;

    // --- Sexo distribution ---
    const sexoCount = { M: 0, F: 0, O: 0, null: 0 };
    filtered.forEach((e) => {
      if (e.sexo === "M") sexoCount.M++;
      else if (e.sexo === "F") sexoCount.F++;
      else if (e.sexo === "O") sexoCount.O++;
      else sexoCount.null++;
    });

    // --- Faixa etária distribution ---
    const faixaCount: Record<FaixaEtaria, number> = {
      "Menor de 18": 0,
      "18 a 24": 0,
      "25 a 34": 0,
      "35 a 44": 0,
      "45 a 59": 0,
      "60 ou mais": 0,
      "Não informado": 0,
    };
    let ageSum = 0;
    let ageCount = 0;
    filtered.forEach((e) => {
      const faixa = getFaixa(e.data_nascimento);
      faixaCount[faixa]++;
      if (e.data_nascimento) {
        ageSum += calcAge(e.data_nascimento);
        ageCount++;
      }
    });

    // --- Situação distribution ---
    const situacaoCount: Record<string, number> = {};
    filtered.forEach((e) => {
      situacaoCount[e.situacao] = (situacaoCount[e.situacao] || 0) + 1;
    });

    // --- Bairro distribution (top 10) ---
    const bairroCount: Record<string, number> = {};
    filtered.forEach((e) => {
      if (e.bairro) bairroCount[e.bairro] = (bairroCount[e.bairro] || 0) + 1;
    });
    const topBairros = Object.entries(bairroCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([bairro, count]) => ({ bairro, count }));

    // --- Crescimento mensal (últimos 6 meses) ---
    const now = new Date();
    const monthlyGrowth: { mes: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mes = d.toLocaleString("pt-BR", { month: "short", year: "2-digit" });
      const total = filtered.filter((e) => {
        const c = new Date(e.created_at);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      }).length;
      monthlyGrowth.push({ mes, total });
    }

    return {
      total,
      sexo: {
        masculino: sexoCount.M,
        feminino: sexoCount.F,
        outro: sexoCount.O,
        naoInformado: sexoCount.null,
        pctMasculino: total > 0 ? Math.round((sexoCount.M / total) * 100) : 0,
        pctFeminino: total > 0 ? Math.round((sexoCount.F / total) * 100) : 0,
      },
      faixaEtaria: FAIXAS_ETARIAS.map((faixa) => ({
        faixa,
        total: faixaCount[faixa],
        pct: total > 0 ? Math.round((faixaCount[faixa] / total) * 100) : 0,
      })),
      mediaIdade: ageCount > 0 ? Math.round(ageSum / ageCount) : null,
      situacaoCount,
      topBairros,
      monthlyGrowth,
    };
  }, [filtered]);

  // Unique filter options derived from raw data
  const options = useMemo(() => ({
    situacoes: [...new Set(raw.map((e) => e.situacao).filter(Boolean))].sort(),
    bairros: [...new Set(raw.map((e) => e.bairro).filter(Boolean))].sort(),
    cidades: [...new Set(raw.map((e) => e.cidade || "Teixeira de Freitas"))].sort(),
  }), [raw]);

  return { stats, isLoading, error, options };
}
