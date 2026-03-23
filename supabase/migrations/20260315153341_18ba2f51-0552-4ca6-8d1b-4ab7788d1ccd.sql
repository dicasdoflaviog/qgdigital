
-- 1. Add gabinete_id column to profiles and eleitores for multi-tenancy
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gabinete_id UUID;
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS gabinete_id UUID;

-- 2. Create instituicoes table
CREATE TABLE IF NOT EXISTS public.instituicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gabinete_id UUID NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT DEFAULT 'outros',
    cnpj TEXT,
    responsavel_nome TEXT,
    responsavel_contato TEXT,
    endereco TEXT,
    bairro TEXT,
    historico_apoio TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create emendas table
CREATE TABLE IF NOT EXISTS public.emendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gabinete_id UUID NOT NULL,
    titulo TEXT NOT NULL,
    valor DECIMAL(12,2),
    ano_exercicio INTEGER,
    status TEXT NOT NULL DEFAULT 'Indicada',
    destino_instituicao_id UUID REFERENCES public.instituicoes(id),
    descricao TEXT,
    localizacao_gps TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emendas ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies for instituicoes
CREATE POLICY "Admins can manage instituicoes"
ON public.instituicoes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated can read instituicoes"
ON public.instituicoes FOR SELECT
TO authenticated
USING (true);

-- 6. RLS policies for emendas
CREATE POLICY "Admins can manage emendas"
ON public.emendas FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated can read emendas"
ON public.emendas FOR SELECT
TO authenticated
USING (true);

-- 7. Updated_at triggers
CREATE TRIGGER update_instituicoes_updated_at
    BEFORE UPDATE ON public.instituicoes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emendas_updated_at
    BEFORE UPDATE ON public.emendas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
