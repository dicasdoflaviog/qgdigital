CREATE OR REPLACE FUNCTION public.get_gabinete_stats(v_gabinete_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_eleitores', (SELECT count(*) FROM eleitores WHERE gabinete_id = v_gabinete_id),
        'cadastros_mes_atual', (SELECT count(*) FROM eleitores WHERE gabinete_id = v_gabinete_id AND created_at >= date_trunc('month', now())),
        'cadastros_mes_passado', (SELECT count(*) FROM eleitores WHERE gabinete_id = v_gabinete_id AND created_at >= date_trunc('month', now() - interval '1 month') AND created_at < date_trunc('month', now())),
        'demandas_resolvidas_perc', (
            SELECT CASE WHEN count(*) = 0 THEN 0 ELSE round((count(*) FILTER (WHERE status = 'Resolvida')::float / count(*)::float * 100)::numeric, 1) END
            FROM demandas WHERE gabinete_id = v_gabinete_id
        ),
        'total_demandas', (SELECT count(*) FROM demandas WHERE gabinete_id = v_gabinete_id),
        'demandas_pendentes', (SELECT count(*) FROM demandas WHERE gabinete_id = v_gabinete_id AND status = 'Pendente'),
        'demandas_resolvidas', (SELECT count(*) FROM demandas WHERE gabinete_id = v_gabinete_id AND status = 'Resolvida'),
        'categoria_top', (
            SELECT categoria FROM demandas 
            WHERE gabinete_id = v_gabinete_id AND categoria IS NOT NULL
            GROUP BY categoria ORDER BY count(*) DESC LIMIT 1
        ),
        'bairros_alcancados', (SELECT count(DISTINCT bairro) FROM eleitores WHERE gabinete_id = v_gabinete_id AND bairro != '')
    ) INTO result;
    RETURN result;
END;
$$;