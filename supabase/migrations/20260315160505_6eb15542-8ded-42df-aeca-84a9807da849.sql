
-- 1. Alterar FK de eleitores para SET NULL (referencia assessores, não auth.users)
ALTER TABLE public.eleitores 
DROP CONSTRAINT IF EXISTS eleitores_assessor_id_fkey,
ADD CONSTRAINT eleitores_assessor_id_fkey 
FOREIGN KEY (assessor_id) REFERENCES public.assessores(id) ON DELETE SET NULL;

-- 2. Criar tabela de backup de exclusões
CREATE TABLE IF NOT EXISTS public.backup_exclusoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabela_origem TEXT NOT NULL DEFAULT '',
    dados_originais JSONB,
    excluido_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    excluido_por UUID
);

-- 3. RLS na tabela de backup
ALTER TABLE public.backup_exclusoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage backup_exclusoes"
ON public.backup_exclusoes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
