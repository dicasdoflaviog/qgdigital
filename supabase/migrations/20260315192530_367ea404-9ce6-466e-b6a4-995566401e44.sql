
-- Tabela de Cidades para inteligência de Zoom
CREATE TABLE IF NOT EXISTS public.municipios_foco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    estado CHAR(2) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    zoom_ideal INTEGER DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS: leitura para autenticados, escrita para super_admin
ALTER TABLE public.municipios_foco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read municipios"
ON public.municipios_foco FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Super admin manages municipios"
ON public.municipios_foco FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Dados iniciais do Extremo Sul da Bahia
INSERT INTO public.municipios_foco (nome, estado, latitude, longitude)
VALUES 
  ('Alcobaça', 'BA', -17.5147, -39.1953),
  ('Prado', 'BA', -17.3411, -39.2208),
  ('Itamaraju', 'BA', -17.0392, -39.5311),
  ('Teixeira de Freitas', 'BA', -17.5356, -39.7422),
  ('Eunápolis', 'BA', -16.3717, -39.5822),
  ('Porto Seguro', 'BA', -16.4435, -39.0648),
  ('Mucuri', 'BA', -18.0836, -39.5533),
  ('Nova Viçosa', 'BA', -17.8917, -39.3722),
  ('Medeiros Neto', 'BA', -17.3722, -40.2244),
  ('Caravelas', 'BA', -17.7122, -39.2517);
