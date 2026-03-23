
-- Allow assessores to insert eleitores (they'll be linked via assessor_id)
CREATE POLICY "Assessores can insert eleitores"
ON public.eleitores
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'assessor'::app_role));

-- Allow secretaria to insert eleitores
CREATE POLICY "Secretaria can insert eleitores"
ON public.eleitores
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'secretaria'::app_role));

-- Allow super_admin full access
CREATE POLICY "Super admins can manage all eleitores"
ON public.eleitores
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
