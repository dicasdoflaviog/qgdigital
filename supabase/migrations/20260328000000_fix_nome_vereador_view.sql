-- Fix: nome_vereador estava retornando "Nome - Partido" (do campo nome_mandato).
-- Agora extrai apenas o nome, antes do separador " - ".
-- Isso elimina a duplicação nos cards de gabinete (ex: "Jonatas" e "Jonatas - MDB").

CREATE OR REPLACE VIEW public.resumo_gabinetes_por_cidade AS
SELECT
  gc.gabinete_id,
  -- Extrai só o nome, ignorando " - PARTIDO" que seed-demo inclui em nome_mandato
  COALESCE(
    NULLIF(split_part(gc.nome_mandato, ' - ', 1), ''),
    p.full_name
  ) AS nome_vereador,
  -- Partido fica acessível separadamente para quem precisar
  CASE
    WHEN gc.nome_mandato LIKE '% - %'
    THEN split_part(gc.nome_mandato, ' - ', 2)
    ELSE NULL
  END AS partido,
  COALESCE(
    NULLIF(split_part(gc.cidade_estado, ' - ', 1), ''),
    gc.cidade_estado,
    ''
  ) AS cidade,
  COUNT(DISTINCT e.id) AS total_eleitores,
  COUNT(DISTINCT CASE WHEN LOWER(d.status) IN ('pendente', 'em andamento', 'em_andamento') THEN d.id END) AS demandas_pendentes,
  COUNT(DISTINCT CASE WHEN LOWER(d.status) IN ('resolvida', 'ofício gerado', 'oficio gerado') THEN d.id END) AS demandas_resolvidas,
  COUNT(DISTINCT d.id) AS total_demandas
FROM public.gabinete_config gc
JOIN public.profiles p ON p.id = gc.gabinete_id
LEFT JOIN public.eleitores e ON e.gabinete_id = gc.gabinete_id AND e.excluido = false
LEFT JOIN public.demandas d ON d.gabinete_id = gc.gabinete_id
GROUP BY gc.gabinete_id, gc.nome_mandato, gc.cidade_estado, p.full_name;

GRANT SELECT ON public.resumo_gabinetes_por_cidade TO authenticated;
