-- Adiciona coluna genero em profiles (mesma convenção de eleitores.sexo)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS genero CHAR(1) CHECK (genero IN ('M', 'F', 'O')) DEFAULT NULL;

COMMENT ON COLUMN public.profiles.genero IS
  'Gênero detectado automaticamente pelo nome: M=Masculino, F=Feminino, O=Outro/Não identificado';

CREATE INDEX IF NOT EXISTS idx_profiles_genero ON public.profiles(genero);
CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON public.profiles(birth_date);
