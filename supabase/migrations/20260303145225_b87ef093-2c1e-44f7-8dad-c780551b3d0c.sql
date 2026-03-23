
-- Create storage bucket for ofício documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('oficios-documentos', 'oficios-documentos', false);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload oficio documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'oficios-documentos');

-- Allow authenticated users to read their uploaded files
CREATE POLICY "Authenticated users can read oficio documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'oficios-documentos');

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete oficio documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'oficios-documentos');
