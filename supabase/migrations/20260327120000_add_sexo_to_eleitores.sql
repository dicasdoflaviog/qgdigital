-- Add sexo field to eleitores for demographic analytics
ALTER TABLE public.eleitores
  ADD COLUMN IF NOT EXISTS sexo TEXT CHECK (sexo IN ('M', 'F', 'O')) DEFAULT NULL;

COMMENT ON COLUMN public.eleitores.sexo IS 'Sexo do eleitor: M=Masculino, F=Feminino, O=Outro/Não binário';
