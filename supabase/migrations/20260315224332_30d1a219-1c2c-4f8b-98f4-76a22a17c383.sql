
-- Drop the view (can't apply RLS to views directly)
DROP VIEW IF EXISTS public.admin_global_stats;

-- Create a security definer function instead (only L5 gets data)
CREATE OR REPLACE FUNCTION public.get_admin_global_stats()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Only L5 can access
  IF (SELECT role_level FROM user_roles WHERE user_id = auth.uid() LIMIT 1) != 5 THEN
    RETURN '{}'::json;
  END IF;

  SELECT json_build_object(
    'total_gabinetes', (SELECT count(*) FROM user_roles WHERE role_level = 3),
    'total_eleitores_global', (SELECT count(*) FROM eleitores WHERE excluido = false),
    'mrr_estimado', (SELECT COALESCE(sum(valor_por_gabinete), 0) FROM config_faturamento)
  ) INTO result;
  
  RETURN result;
END;
$$;
