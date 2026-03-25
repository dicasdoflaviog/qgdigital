-- Adicionar colunas na tabela sugestoes (se ainda não existirem)
ALTER TABLE IF EXISTS sugestoes 
ADD COLUMN IF NOT EXISTS analise_ia TEXT,
ADD COLUMN IF NOT EXISTS spec_gerada TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Criar tabela de logs de erro
CREATE TABLE IF NOT EXISTS logs_erro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(100) DEFAULT 'frontend',
  mensagem TEXT NOT NULL,
  stack_trace TEXT,
  arquivo VARCHAR(255),
  linha INTEGER,
  user_id UUID REFERENCES auth.users(id),
  gabinete_id UUID,
  url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'novo',
  correcao_aplicada TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela de auditorias
CREATE TABLE IF NOT EXISTS auditorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL,
  resultado JSONB NOT NULL,
  problemas_criticos INTEGER DEFAULT 0,
  problemas_importantes INTEGER DEFAULT 0,
  problemas_menores INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_logs_erro_status ON logs_erro(status);
CREATE INDEX IF NOT EXISTS idx_logs_erro_created ON logs_erro(created_at);
CREATE INDEX IF NOT EXISTS idx_sugestoes_status ON sugestoes(status);

-- Enable RLS
ALTER TABLE logs_erro ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditorias ENABLE ROW LEVEL SECURITY;

-- RLS Policies (apenas service role pode acessar)
CREATE POLICY "Service role full access logs" ON logs_erro
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access auditorias" ON auditorias
  FOR ALL USING (auth.role() = 'service_role');
