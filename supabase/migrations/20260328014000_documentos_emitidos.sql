-- Tabela de documentos emitidos pelo sistema QG Digital
-- Usada para verificação de autenticidade via QR Code e hash SHA-256

CREATE TABLE IF NOT EXISTS public.documentos_emitidos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo       TEXT UNIQUE NOT NULL,           -- ex: "OF-2025XK3A", "REL-2025ABZ1"
  tipo_doc        TEXT NOT NULL,                  -- 'oficio' | 'relatorio_transparencia' | 'relatorio_estrategico' | 'prestacao_contas' | 'relatorio_inteligencia' | 'relatorio_cidade'
  gabinete_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nome_vereador   TEXT,
  cidade_estado   TEXT,
  hash_sha256     TEXT NOT NULL,                  -- SHA-256 do conteúdo canônico do documento
  dados_resumo    JSONB DEFAULT '{}',             -- metadados relevantes (demanda_id, bairro, etc.)
  gerado_em       TIMESTAMPTZ DEFAULT NOW(),
  gerado_por      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  valido          BOOLEAN DEFAULT TRUE,           -- pode ser invalidado pelo vereador/admin
  motivo_invalido TEXT                            -- preenchido se valido = false
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documentos_protocolo ON public.documentos_emitidos(protocolo);
CREATE INDEX IF NOT EXISTS idx_documentos_gabinete ON public.documentos_emitidos(gabinete_id);
CREATE INDEX IF NOT EXISTS idx_documentos_gerado_em ON public.documentos_emitidos(gerado_em DESC);

-- RLS
ALTER TABLE public.documentos_emitidos ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa (incluindo anônimos) pode verificar por protocolo (público)
CREATE POLICY "public_can_verify_by_protocolo"
  ON public.documentos_emitidos FOR SELECT
  USING (true);

-- Apenas usuários autenticados podem inserir documentos
CREATE POLICY "authenticated_can_insert"
  ON public.documentos_emitidos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = gerado_por);

-- Apenas o próprio gabinete ou super_admin pode invalidar
CREATE POLICY "owner_can_update"
  ON public.documentos_emitidos FOR UPDATE
  TO authenticated
  USING (
    gabinete_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Adicionar coluna camara_logo_url ao gabinete_config (sec-02 + pdf-08 combinados)
ALTER TABLE public.gabinete_config
  ADD COLUMN IF NOT EXISTS camara_logo_url TEXT;
