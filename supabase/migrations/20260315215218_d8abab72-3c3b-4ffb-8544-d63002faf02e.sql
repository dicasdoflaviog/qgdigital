
CREATE TABLE IF NOT EXISTS public.config_faturamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    valor_por_gabinete DECIMAL(10,2) DEFAULT 500.00,
    dia_vencimento INTEGER DEFAULT 10,
    status_pagamento TEXT DEFAULT 'Em dia',
    data_ultimo_pagamento DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.config_faturamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "L5 pode visualizar config_faturamento" ON public.config_faturamento
FOR SELECT TO authenticated
USING ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 );

CREATE POLICY "L5 pode criar config_faturamento" ON public.config_faturamento
FOR INSERT TO authenticated
WITH CHECK ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 );

CREATE POLICY "L5 pode atualizar config_faturamento" ON public.config_faturamento
FOR UPDATE TO authenticated
USING ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 )
WITH CHECK ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 );

CREATE POLICY "L5 pode deletar config_faturamento" ON public.config_faturamento
FOR DELETE TO authenticated
USING ( (SELECT role_level FROM public.user_roles WHERE user_id = auth.uid()) = 5 );
