
-- Global config table for L5 layout settings
CREATE TABLE public.global_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.global_config ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Authenticated can read global_config"
  ON public.global_config FOR SELECT
  TO authenticated
  USING (true);

-- Only L5 can manage
CREATE POLICY "L5 can manage global_config"
  ON public.global_config FOR ALL
  TO authenticated
  USING (get_user_role_level() = 5)
  WITH CHECK (get_user_role_level() = 5);

-- Create storage bucket for institutional assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('institucional', 'institucional', true)
ON CONFLICT DO NOTHING;

-- Storage policy: L5 can upload
CREATE POLICY "L5 can upload institucional"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'institucional' AND get_user_role_level() = 5);

CREATE POLICY "Public can read institucional"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'institucional');

CREATE POLICY "L5 can delete institucional"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'institucional' AND get_user_role_level() = 5);

-- Seed default keys
INSERT INTO public.global_config (key, value) VALUES
  ('logo_institucional_url', null),
  ('endereco_rodape_global', null),
  ('telefone_rodape_global', null),
  ('nome_instituicao', null);
