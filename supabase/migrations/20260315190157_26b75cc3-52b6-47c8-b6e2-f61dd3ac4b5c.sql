-- 1. Geographic hierarchy on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estado_atuacao CHAR(2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS regiao_atuacao TEXT;

-- 2. Grupos políticos (lider references profiles, NOT auth.users)
CREATE TABLE IF NOT EXISTS public.grupos_politicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    lider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.grupos_politicos ENABLE ROW LEVEL SECURITY;

-- RLS: Super admins manage, admins read
CREATE POLICY "Super admins can manage grupos"
ON public.grupos_politicos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can read grupos"
ON public.grupos_politicos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Geographic columns on eleitores
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS estado CHAR(2) DEFAULT 'BA';
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS cidade TEXT;