
CREATE OR REPLACE VIEW public.resumo_gabinetes_por_cidade AS
SELECT 
    p.id AS gabinete_id,
    p.full_name AS nome_vereador,
    e.cidade,
    count(distinct e.id) as total_eleitores,
    count(distinct d.id) filter (where d.status = 'Pendente') as demandas_pendentes,
    count(distinct d.id) filter (where d.status = 'Resolvido') as demandas_resolvidas,
    count(distinct d.id) as total_demandas
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role_level = 3
JOIN public.eleitores e ON e.gabinete_id = p.id
LEFT JOIN public.demandas d ON d.eleitor_id = e.id
GROUP BY p.id, p.full_name, e.cidade;
