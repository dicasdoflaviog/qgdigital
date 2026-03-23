
ALTER TABLE public.config_faturamento 
ADD COLUMN IF NOT EXISTS habilidades JSONB DEFAULT '{"mapa": true, "ia": false, "relatorios": false}';

ALTER TABLE public.config_faturamento 
ADD COLUMN IF NOT EXISTS estados_autorizados TEXT[] DEFAULT '{BA}';

COMMENT ON COLUMN public.config_faturamento.habilidades IS 'Controla quais botões aparecem para o Nível 4';
