
-- View de inteligência global (sem tabela demandas que não existe)
CREATE OR REPLACE VIEW public.view_inteligencia_global
WITH (security_invoker = on) AS
SELECT 
    gabinete_id,
    COUNT(id) as total_eleitores,
    COUNT(CASE WHEN is_leader THEN 1 END) as total_lideres,
    MAX(created_at) as ultima_atividade
FROM public.eleitores
WHERE gabinete_id IS NOT NULL
GROUP BY gabinete_id;

-- RLS já protege a tabela eleitores. Com security_invoker=on,
-- apenas super_admin (que tem ALL na tabela eleitores) verá todos os dados.
