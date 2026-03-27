-- Recreate resumo_gabinetes_por_cidade view using gabinete_config as base
-- Uses LEFT JOINs so gabinetes with zero eleitores/demandas still appear
-- city name is extracted from cidade_estado (e.g. "Teixeira de Freitas - BA" → "Teixeira de Freitas")

CREATE OR REPLACE VIEW public.resumo_gabinetes_por_cidade AS
SELECT
  gc.gabinete_id,
  COALESCE(gc.nome_mandato, p.full_name) AS nome_vereador,
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

-- Grant read access to authenticated users
GRANT SELECT ON public.resumo_gabinetes_por_cidade TO authenticated;
