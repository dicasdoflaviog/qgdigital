
-- Create bucket for hybrid uploads (photos + PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('demandas-arquivos', 'demandas-arquivos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated uploads
CREATE POLICY "Authenticated users can upload to demandas-arquivos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'demandas-arquivos');

-- Allow public reads
CREATE POLICY "Public can read demandas-arquivos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'demandas-arquivos');
