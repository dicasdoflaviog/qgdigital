
-- Feature flags per L4 client
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    feature_key TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(cliente_id, feature_key)
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "L5 pode visualizar feature_flags" ON public.feature_flags
FOR SELECT TO authenticated
USING ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 );

CREATE POLICY "L5 pode inserir feature_flags" ON public.feature_flags
FOR INSERT TO authenticated
WITH CHECK ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 );

CREATE POLICY "L5 pode atualizar feature_flags" ON public.feature_flags
FOR UPDATE TO authenticated
USING ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 )
WITH CHECK ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 );

CREATE POLICY "L5 pode deletar feature_flags" ON public.feature_flags
FOR DELETE TO authenticated
USING ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 );

-- L4 users can read their own flags (to enforce in frontend)
CREATE POLICY "L4 pode ler suas flags" ON public.feature_flags
FOR SELECT TO authenticated
USING ( cliente_id = auth.uid() );

-- Billing history for MRR tracking
CREATE TABLE IF NOT EXISTS public.billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    mes_referencia DATE NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    qtd_gabinetes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "L5 pode gerenciar billing_history" ON public.billing_history
FOR ALL TO authenticated
USING ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 )
WITH CHECK ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 );
