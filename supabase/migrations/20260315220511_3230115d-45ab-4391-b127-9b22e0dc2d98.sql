-- Add missing columns to existing audit_logs table
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS usuario_nome TEXT,
ADD COLUMN IF NOT EXISTS role_level INTEGER,
ADD COLUMN IF NOT EXISTS gabinete_nome TEXT,
ADD COLUMN IF NOT EXISTS acao TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_acao ON public.audit_logs(acao);

-- Create SECURITY DEFINER function to safely get role_level (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role_level()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role_level FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_role_level FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role_level TO authenticated;

-- Drop old policies and create new L5-only policy using the safe function
DROP POLICY IF EXISTS "Super admins can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Super admins can read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Apenas Nível 5 vê logs" ON public.audit_logs;

CREATE POLICY "L5 pode visualizar audit_logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.get_user_role_level() = 5);

CREATE POLICY "Authenticated podem inserir audit_logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);