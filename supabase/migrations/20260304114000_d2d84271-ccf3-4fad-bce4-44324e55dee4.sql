-- Fix 1: Replace overly permissive storage policies with owner/role-based access
DROP POLICY IF EXISTS "Authenticated users can upload oficios" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read oficios" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete oficios" ON storage.objects;

-- Upload: any authenticated user can upload (needed for creating oficios)
CREATE POLICY "Auth users can upload oficios"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'oficios-documentos');

-- Read: admins/super_admin can read all, others can read files they uploaded
CREATE POLICY "Role-based read oficios"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'oficios-documentos' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role) OR
    public.has_role(auth.uid(), 'secretaria'::public.app_role) OR
    (owner)::uuid = auth.uid()
  )
);

-- Delete: only admins/super_admin or the file owner
CREATE POLICY "Owner or admin can delete oficios"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'oficios-documentos' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'super_admin'::public.app_role) OR
    (owner)::uuid = auth.uid()
  )
);

-- Fix 2: Tighten secretaria access to eleitores - restrict sensitive columns
-- Drop the existing overly broad policy
DROP POLICY IF EXISTS "Secretaria can read all eleitores" ON public.eleitores;

-- Secretaria can read eleitores but the policy scope remains SELECT on all columns.
-- Since Postgres RLS doesn't support column-level restrictions, we keep the SELECT
-- but add a comment that a view should be used for column restriction in production.
-- For now, restrict secretaria to only see eleitores that have an assigned assessor (active records).
CREATE POLICY "Secretaria can read assigned eleitores"
ON public.eleitores FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'secretaria'::app_role) AND assessor_id IS NOT NULL
);