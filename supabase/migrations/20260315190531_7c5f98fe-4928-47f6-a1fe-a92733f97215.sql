CREATE TABLE IF NOT EXISTS public.contratos_nacional (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    escopo_geografico TEXT DEFAULT 'Regional',
    estados_autorizados TEXT[],
    limite_gabinetes INTEGER DEFAULT 10,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contratos_nacional ENABLE ROW LEVEL SECURITY;

-- Only super_admin (L5) can manage contracts
CREATE POLICY "Super admin manages contratos"
ON public.contratos_nacional FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- updated_at trigger
CREATE TRIGGER set_contratos_updated_at
  BEFORE UPDATE ON public.contratos_nacional
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();