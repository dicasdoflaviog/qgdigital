-- Adiciona campos do Mercado Pago na tabela subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS mp_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_by TEXT,     -- 'mp_webhook' | 'manual_l5'
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;            -- observações do admin L5

-- Índice para busca por mp_payment_id no webhook
CREATE INDEX IF NOT EXISTS subscriptions_mp_payment_id_idx ON subscriptions(mp_payment_id);
CREATE INDEX IF NOT EXISTS subscriptions_mp_preference_id_idx ON subscriptions(mp_preference_id);

-- RLS: apenas service_role pode atualizar via webhook
-- (as políticas existentes já cobrem, mas garantimos o índice)
