
CREATE TABLE IF NOT EXISTS public.convites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role_level INTEGER NOT NULL DEFAULT 1 CONSTRAINT check_convite_level CHECK (role_level >= 1 AND role_level <= 5),
    gabinete_id UUID,
    token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    utilizado BOOLEAN DEFAULT false,
    criado_por UUID,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestores podem criar convites" ON public.convites
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Gestores podem ver convites" ON public.convites
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins podem atualizar convites" ON public.convites
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
);
