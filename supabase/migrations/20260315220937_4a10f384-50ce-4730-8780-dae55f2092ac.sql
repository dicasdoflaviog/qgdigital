-- Skills matrix: which features are available for each role level (global config by L5)
CREATE TABLE IF NOT EXISTS public.skills_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL,
  role_level INTEGER NOT NULL CHECK (role_level BETWEEN 1 AND 5),
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feature_key, role_level)
);

-- RLS: only L5 can manage, everyone can read
ALTER TABLE public.skills_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read skills_matrix"
ON public.skills_matrix FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "L5 pode gerenciar skills_matrix"
ON public.skills_matrix FOR ALL
TO authenticated
USING (public.get_user_role_level() = 5)
WITH CHECK (public.get_user_role_level() = 5);

-- Seed default matrix: all features enabled for all levels
-- Features: dashboard, eleitores, mapa_calor, equipe, agenda, calendario, oficios, guia, configuracoes, instituicoes, emendas, observatorio, gestao_base, relatorios_pdf, ia_demandas, ia_oficios, system_master, sistema, sugestoes, central_recuperacao
INSERT INTO public.skills_matrix (feature_key, role_level, enabled) VALUES
  -- L1 defaults
  ('dashboard', 1, true), ('eleitores', 1, true), ('agenda', 1, true), ('guia', 1, true),
  ('mapa_calor', 1, false), ('equipe', 1, false), ('calendario', 1, false), ('oficios', 1, false),
  ('configuracoes', 1, false), ('instituicoes', 1, false), ('emendas', 1, false),
  ('observatorio', 1, false), ('gestao_base', 1, false), ('relatorios_pdf', 1, false),
  ('ia_demandas', 1, false), ('ia_oficios', 1, false),
  -- L2 defaults
  ('dashboard', 2, true), ('eleitores', 2, true), ('agenda', 2, true), ('calendario', 2, true),
  ('oficios', 2, true), ('guia', 2, true), ('mapa_calor', 2, false), ('equipe', 2, false),
  ('configuracoes', 2, false), ('instituicoes', 2, false), ('emendas', 2, false),
  ('observatorio', 2, false), ('gestao_base', 2, false), ('relatorios_pdf', 2, false),
  ('ia_demandas', 2, false), ('ia_oficios', 2, false),
  -- L3 defaults (Vereador — full operational)
  ('dashboard', 3, true), ('eleitores', 3, true), ('mapa_calor', 3, true), ('equipe', 3, true),
  ('agenda', 3, true), ('calendario', 3, true), ('oficios', 3, true), ('guia', 3, true),
  ('configuracoes', 3, true), ('instituicoes', 3, true), ('emendas', 3, true),
  ('observatorio', 3, false), ('gestao_base', 3, false), ('relatorios_pdf', 3, true),
  ('ia_demandas', 3, true), ('ia_oficios', 3, true),
  -- L4 defaults (Líder — strategic)
  ('dashboard', 4, true), ('mapa_calor', 4, true), ('observatorio', 4, true), ('gestao_base', 4, true),
  ('eleitores', 4, false), ('equipe', 4, false), ('agenda', 4, false), ('calendario', 4, false),
  ('oficios', 4, false), ('guia', 4, false), ('configuracoes', 4, false), ('instituicoes', 4, false),
  ('emendas', 4, false), ('relatorios_pdf', 4, true), ('ia_demandas', 4, true), ('ia_oficios', 4, false),
  -- L5 defaults (System Master — everything)
  ('dashboard', 5, true), ('eleitores', 5, true), ('mapa_calor', 5, true), ('equipe', 5, true),
  ('agenda', 5, true), ('calendario', 5, true), ('oficios', 5, true), ('guia', 5, true),
  ('configuracoes', 5, true), ('instituicoes', 5, true), ('emendas', 5, true),
  ('observatorio', 5, true), ('gestao_base', 5, true), ('relatorios_pdf', 5, true),
  ('ia_demandas', 5, true), ('ia_oficios', 5, true)
ON CONFLICT (feature_key, role_level) DO NOTHING;