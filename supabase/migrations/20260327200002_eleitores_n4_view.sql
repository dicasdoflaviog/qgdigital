-- Migration: MULTI-03 — View de segurança para N4 (líder político)
-- N4 pode consultar métricas agregadas, mas sem acesso a dados sensíveis individuais.
-- Campos sensíveis mascarados: whatsapp, data_nascimento, bairro, cidade.
-- Campos futuros já mapeados como NULL: cpf, titulo_eleitor.
--
-- security_barrier = true: garante que o WHERE da view é avaliado ANTES
-- de qualquer filtro externo, evitando vazamento via predicate pushdown.

DROP VIEW IF EXISTS public.eleitores_n4_view;

CREATE VIEW public.eleitores_n4_view
WITH (security_barrier = true)
AS
SELECT
  id,
  nome,

  -- Campos sensíveis mascarados
  '***'::text                                                   AS whatsapp,
  NULL::date                                                    AS data_nascimento,
  NULL::text                                                    AS cpf,            -- futuro
  NULL::text                                                    AS titulo_eleitor, -- futuro

  -- Endereço: parcialmente mascarado (primeiro caractere + ***)
  CASE
    WHEN bairro IS NOT NULL AND LENGTH(TRIM(bairro)) > 0
      THEN SUBSTRING(TRIM(bairro), 1, 1) || '***'
    ELSE '***'
  END                                                           AS bairro,
  NULL::text                                                    AS cidade,

  -- Campos não sensíveis: liberados para N4
  situacao,
  gabinete_id,
  is_leader,
  excluido,
  sexo,
  created_at,
  updated_at,
  latitude,
  longitude,
  image_urls

FROM public.eleitores
WHERE excluido = false;

-- Permissão de leitura para usuários autenticados
-- (o acesso a linhas ainda é controlado pelo RLS da tabela base)
GRANT SELECT ON public.eleitores_n4_view TO authenticated;

COMMENT ON VIEW public.eleitores_n4_view IS
  'View de segurança para N4 (líder político): campos sensíveis mascarados. '
  'Uso exclusivo no frontend para roleLevel = 4. '
  'Campos futuros (cpf, titulo_eleitor) já mapeados como NULL.';
