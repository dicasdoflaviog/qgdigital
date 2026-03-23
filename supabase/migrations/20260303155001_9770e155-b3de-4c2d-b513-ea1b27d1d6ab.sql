
-- Tabela de Contatos Estratégicos (Agenda de Influência)
CREATE TABLE public.contatos_estrategicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cargo_funcao TEXT,
  instituicao TEXT,
  whatsapp TEXT DEFAULT '',
  bairro_atuacao TEXT DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'outros',
  observacao TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contatos_estrategicos ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read strategic contacts
CREATE POLICY "Authenticated users can read contatos"
ON public.contatos_estrategicos
FOR SELECT
TO authenticated
USING (true);

-- Only admins/super_admins can insert
CREATE POLICY "Admins can insert contatos"
ON public.contatos_estrategicos
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Only admins/super_admins can update
CREATE POLICY "Admins can update contatos"
ON public.contatos_estrategicos
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Only admins/super_admins can delete
CREATE POLICY "Admins can delete contatos"
ON public.contatos_estrategicos
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Trigger for updated_at
CREATE TRIGGER update_contatos_estrategicos_updated_at
BEFORE UPDATE ON public.contatos_estrategicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
