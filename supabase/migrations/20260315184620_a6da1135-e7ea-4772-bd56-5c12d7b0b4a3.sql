
-- Criar tabela demandas
CREATE TABLE IF NOT EXISTS public.demandas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID,
  assessor_id UUID REFERENCES public.assessores(id),
  eleitor_id UUID REFERENCES public.eleitores(id),
  bairro TEXT DEFAULT '',
  descricao TEXT,
  categoria TEXT,
  status TEXT DEFAULT 'Pendente',
  prioridade TEXT DEFAULT 'Normal',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance do mapa de calor
CREATE INDEX IF NOT EXISTS idx_demandas_categoria ON public.demandas(categoria);
CREATE INDEX IF NOT EXISTS idx_demandas_status ON public.demandas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_bairro ON public.demandas(bairro);
CREATE INDEX IF NOT EXISTS idx_demandas_gabinete_id ON public.demandas(gabinete_id);

-- Comentários
COMMENT ON COLUMN public.demandas.categoria IS 'Saúde, Infraestrutura, Segurança, Educação, Iluminação, Outros';

-- RLS
ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage demandas" ON public.demandas
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can manage all demandas" ON public.demandas
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Assessores can read own demandas" ON public.demandas
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'assessor'::app_role) AND assessor_id IN (
    SELECT id FROM assessores WHERE user_id = auth.uid()
  ));

CREATE POLICY "Assessores can insert demandas" ON public.demandas
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'assessor'::app_role));

CREATE POLICY "Secretaria can read demandas" ON public.demandas
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'secretaria'::app_role));

-- Trigger updated_at
CREATE TRIGGER update_demandas_updated_at
  BEFORE UPDATE ON public.demandas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
