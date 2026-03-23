
-- 1. Create helper function to get user's gabinete_id (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_gabinete_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT gabinete_id FROM public.profiles WHERE id = auth.uid()
$$;

-- 2. Drop existing eleitores SELECT policies that need updating
DROP POLICY IF EXISTS "Admins can manage all eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Assessores can read their own eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Secretaria can read assigned eleitores" ON public.eleitores;

-- 3. Recreate with proper gabinete-scoped logic

-- L1 (Assessor): Only see eleitores linked to their assessor record
CREATE POLICY "Assessores can read their own eleitores"
ON public.eleitores FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'assessor'::app_role)
  AND assessor_id IN (
    SELECT id FROM public.assessores WHERE user_id = auth.uid()
  )
);

-- L2 (Secretária): See eleitores in same gabinete
CREATE POLICY "Secretaria can read gabinete eleitores"
ON public.eleitores FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'secretaria'::app_role)
  AND gabinete_id = get_user_gabinete_id()
);

-- L3 (Admin/Vereador): See all eleitores in their gabinete
CREATE POLICY "Admins can read gabinete eleitores"
ON public.eleitores FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND gabinete_id = get_user_gabinete_id()
);

-- L3 Admin: can still INSERT/UPDATE/DELETE their gabinete's eleitores
CREATE POLICY "Admins can manage gabinete eleitores"
ON public.eleitores FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND gabinete_id = get_user_gabinete_id()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- L4+ (Super Admin): Full access (already exists, keep it)
-- The existing "Super admins can manage all eleitores" policy is kept as-is
