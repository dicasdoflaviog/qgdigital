
CREATE TABLE public.documentos_legislativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gabinete_id UUID NOT NULL,
    tipo TEXT,
    numero_protocolo TEXT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'Protocolado',
    link_arquivo TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_legislativos ENABLE ROW LEVEL SECURITY;

-- Super admins see everything
CREATE POLICY "Super admins can manage all documentos"
ON public.documentos_legislativos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Admins can manage their gabinete's documents
CREATE POLICY "Admins can manage documentos"
ON public.documentos_legislativos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read documents
CREATE POLICY "Authenticated can read documentos"
ON public.documentos_legislativos FOR SELECT
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_documentos_legislativos_updated_at
    BEFORE UPDATE ON public.documentos_legislativos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
