
ALTER TABLE public.config_faturamento
ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT false;
