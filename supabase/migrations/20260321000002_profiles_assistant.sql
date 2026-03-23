-- Adiciona colunas do Assistente de IA na tabela profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS assistant_name TEXT,
  ADD COLUMN IF NOT EXISTS assistant_personality JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_ia_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Comentários descritivos
COMMENT ON COLUMN profiles.assistant_name IS 'Nome dado pelo usuário ao seu assistente de IA (ex: Aguia, Estrategista)';
COMMENT ON COLUMN profiles.assistant_personality IS 'DNA do assistente: { perfil: diplomata|direto|antifragil, rigor: formal|sincero, linguagem: institucional|informal }';
COMMENT ON COLUMN profiles.onboarding_ia_completed IS 'Indica se o usuário completou o onboarding do assistente de IA';
