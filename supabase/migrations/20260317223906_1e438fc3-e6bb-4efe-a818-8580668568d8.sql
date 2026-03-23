
-- White-label gabinete configuration table
CREATE TABLE public.gabinete_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logo_url text,
  foto_oficial_url text,
  cor_primaria text DEFAULT '#1E40AF',
  nome_mandato text,
  cidade_estado text,
  endereco_sede text,
  telefone_contato text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(gabinete_id)
);

ALTER TABLE public.gabinete_config ENABLE ROW LEVEL SECURITY;

-- L3 (admin) can manage their own gabinete config
CREATE POLICY "Admin can manage own gabinete_config"
  ON public.gabinete_config FOR ALL
  TO authenticated
  USING (gabinete_id = public.get_user_gabinete_id())
  WITH CHECK (gabinete_id = public.get_user_gabinete_id());

-- L5 (super_admin) can view all configs
CREATE POLICY "Super admin can manage all gabinete_config"
  ON public.gabinete_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Authenticated can read their gabinete config
CREATE POLICY "Team can read gabinete_config"
  ON public.gabinete_config FOR SELECT
  TO authenticated
  USING (gabinete_id = public.get_user_gabinete_id());

-- Trigger to auto-update updated_at
CREATE TRIGGER update_gabinete_config_updated_at
  BEFORE UPDATE ON public.gabinete_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
