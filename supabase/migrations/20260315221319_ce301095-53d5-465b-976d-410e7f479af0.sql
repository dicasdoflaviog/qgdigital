-- Add logical delete columns
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS excluido BOOLEAN DEFAULT false;
ALTER TABLE public.demandas ADD COLUMN IF NOT EXISTS excluido BOOLEAN DEFAULT false;

-- Use get_user_role_level() (SECURITY DEFINER) to avoid recursion
DROP POLICY IF EXISTS "Filtro de exclusão lógica" ON public.eleitores;
CREATE POLICY "Filtro de exclusão lógica" ON public.eleitores
FOR SELECT USING (
  excluido = false OR get_user_role_level() = 5
);

DROP POLICY IF EXISTS "Filtro de exclusão lógica" ON public.demandas;
CREATE POLICY "Filtro de exclusão lógica" ON public.demandas
FOR SELECT USING (
  excluido = false OR get_user_role_level() = 5
);