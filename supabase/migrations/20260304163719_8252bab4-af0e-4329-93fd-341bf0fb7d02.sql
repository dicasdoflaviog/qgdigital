
-- Add image_urls column to eleitores table
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for demanda photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('demandas-fotos', 'demandas-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload demanda photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'demandas-fotos');

-- RLS policy: anyone can read (public bucket)
CREATE POLICY "Public read access for demanda photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'demandas-fotos');

-- RLS policy: admins can delete
CREATE POLICY "Admins can delete demanda photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'demandas-fotos' AND (
  public.has_role(auth.uid(), 'admin'::public.app_role) OR
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
));
