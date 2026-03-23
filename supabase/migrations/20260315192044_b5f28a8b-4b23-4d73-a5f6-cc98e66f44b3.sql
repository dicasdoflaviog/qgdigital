
-- Drop the user's problematic policies if they exist (safe idempotent)
DROP POLICY IF EXISTS "Deus pode tudo" ON public.eleitores;
DROP POLICY IF EXISTS "Deus pode tudo demandas" ON public.demandas;

-- The existing policies "Super admins can manage all eleitores" and
-- "Super admins can manage all demandas" already use has_role() which is safe.
-- We just need to ensure they have WITH CHECK clauses for write operations.

-- Recreate super_admin policy on eleitores with proper WITH CHECK
DROP POLICY IF EXISTS "Super admins can manage all eleitores" ON public.eleitores;
CREATE POLICY "Super admins can manage all eleitores"
ON public.eleitores
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Recreate super_admin policy on demandas with proper WITH CHECK
DROP POLICY IF EXISTS "Super admins can manage all demandas" ON public.demandas;
CREATE POLICY "Super admins can manage all demandas"
ON public.demandas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
