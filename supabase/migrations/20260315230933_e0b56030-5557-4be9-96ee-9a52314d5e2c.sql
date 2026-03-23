
-- Inserir dados fictícios para o Observatório Legislativo
-- Usar gabinetes de Nível 3

INSERT INTO public.documentos_legislativos (titulo, tipo, status, gabinete_id, descricao, created_at)
SELECT
  t.tipo || ' nº ' || floor(random() * 1000)::int || '/2026',
  t.tipo,
  t.status,
  g.id,
  'Texto mockup para descrição do documento legislativo focado em melhorias para a cidade.',
  now() - (random() * interval '60 days')
FROM (
  SELECT p.id
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE ur.role_level = 3
) g
CROSS JOIN LATERAL (
  SELECT
    (ARRAY['Projeto de Lei', 'Indicação', 'Requerimento', 'Moção'])[1 + floor(random() * 4)::int] AS tipo,
    (ARRAY['Aprovado', 'Em Tramitação', 'Aguardando', 'Arquivado'])[1 + floor(random() * 4)::int] AS status
  FROM generate_series(1, 8)
) t;
