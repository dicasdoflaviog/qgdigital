-- Migration: MULTI-01 — Adiciona created_by + trigger automático + backfill
-- Garante rastreio de quem cadastrou cada eleitor (necessário para RLS N1/N2)

-- 1. Coluna created_by (nullable para compatibilidade com registros antigos)
ALTER TABLE public.eleitores
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Índices para performance nas queries RLS
CREATE INDEX IF NOT EXISTS idx_eleitores_created_by
  ON public.eleitores(created_by);

CREATE INDEX IF NOT EXISTS idx_eleitores_gabinete_created
  ON public.eleitores(gabinete_id, created_by);

-- 3. Backfill: registros com assessor_id → mapear para auth user_id via assessores
UPDATE public.eleitores e
SET    created_by = a.user_id
FROM   public.assessores a
WHERE  e.assessor_id = a.id
  AND  e.created_by IS NULL;

-- 4. Trigger function: preenche created_by automaticamente em novos INSERTs
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_created_by ON public.eleitores;
CREATE TRIGGER trg_set_created_by
  BEFORE INSERT ON public.eleitores
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();
