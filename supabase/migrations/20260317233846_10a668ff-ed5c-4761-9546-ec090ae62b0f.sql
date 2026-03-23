ALTER TABLE public.gabinete_config
  ADD COLUMN IF NOT EXISTS ia_perfil text DEFAULT 'diplomata',
  ADD COLUMN IF NOT EXISTS ia_rigor text DEFAULT 'formal',
  ADD COLUMN IF NOT EXISTS ia_linguagem text DEFAULT 'institucional';