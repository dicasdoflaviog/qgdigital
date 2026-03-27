-- Add new feature keys to skills_matrix for features implemented after initial seed:
-- perfil_eleitoral, observatorio_bi, configuracao_gabinete, plano

INSERT INTO public.skills_matrix (feature_key, role_level, enabled) VALUES
  -- perfil_eleitoral: N2+ (secretária e acima)
  ('perfil_eleitoral', 1, false),
  ('perfil_eleitoral', 2, true),
  ('perfil_eleitoral', 3, true),
  ('perfil_eleitoral', 4, true),
  ('perfil_eleitoral', 5, true),

  -- observatorio_bi: N3+ (vereador e acima)
  ('observatorio_bi', 1, false),
  ('observatorio_bi', 2, false),
  ('observatorio_bi', 3, true),
  ('observatorio_bi', 4, true),
  ('observatorio_bi', 5, true),

  -- configuracao_gabinete: apenas N3 (vereador) por padrão
  ('configuracao_gabinete', 1, false),
  ('configuracao_gabinete', 2, false),
  ('configuracao_gabinete', 3, true),
  ('configuracao_gabinete', 4, false),
  ('configuracao_gabinete', 5, true),

  -- plano: N3+ (vereador e acima)
  ('plano', 1, false),
  ('plano', 2, false),
  ('plano', 3, true),
  ('plano', 4, false),
  ('plano', 5, true)

ON CONFLICT (feature_key, role_level) DO NOTHING;
