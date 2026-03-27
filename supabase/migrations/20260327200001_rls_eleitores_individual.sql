-- Migration: MULTI-02 — Atualiza RLS de eleitores para privacidade individual N1/N2
-- Regra: N1 e N2 veem APENAS os registros que eles mesmos cadastraram (created_by = auth.uid())
-- N3 mantém visão completa do gabinete. N4/N5 mantêm acesso amplo (coluna mascarada via view/frontend).

-- ============================================================
-- Remove políticas antigas de N1 e N2 (substituídas abaixo)
-- ============================================================
DROP POLICY IF EXISTS "Assessores can read their own eleitores"       ON public.eleitores;
DROP POLICY IF EXISTS "Assessores can read eleitores"                  ON public.eleitores;
DROP POLICY IF EXISTS "assessor select own"                            ON public.eleitores;
DROP POLICY IF EXISTS "Assessores can insert eleitores"                ON public.eleitores;
DROP POLICY IF EXISTS "Assessores can update their own eleitores"      ON public.eleitores;
DROP POLICY IF EXISTS "Assessores can update eleitores"                ON public.eleitores;
DROP POLICY IF EXISTS "Secretaria can read gabinete eleitores"         ON public.eleitores;
DROP POLICY IF EXISTS "Secretaria can read eleitores"                  ON public.eleitores;
DROP POLICY IF EXISTS "secretaria select gabinete"                     ON public.eleitores;

-- ============================================================
-- N1 (assessor) — vê e edita apenas o que ele cadastrou
-- ============================================================
CREATE POLICY "N1 assessor: select own"
  ON public.eleitores FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'assessor'::app_role)
    AND created_by = auth.uid()
  );

CREATE POLICY "N1 assessor: insert no gabinete"
  ON public.eleitores FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'assessor'::app_role)
    AND gabinete_id = get_user_gabinete_id()
  );

CREATE POLICY "N1 assessor: update own"
  ON public.eleitores FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'assessor'::app_role)
    AND created_by = auth.uid()
  );

-- ============================================================
-- N2 (secretaria) — vê e edita apenas o que ela cadastrou
-- ============================================================
CREATE POLICY "N2 secretaria: select own"
  ON public.eleitores FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'secretaria'::app_role)
    AND created_by = auth.uid()
  );

CREATE POLICY "N2 secretaria: insert no gabinete"
  ON public.eleitores FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'secretaria'::app_role)
    AND gabinete_id = get_user_gabinete_id()
  );

CREATE POLICY "N2 secretaria: update own"
  ON public.eleitores FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'secretaria'::app_role)
    AND created_by = auth.uid()
  );

-- ============================================================
-- N3, N4, N5 — políticas existentes são mantidas pelo Supabase
-- (admin vê gabinete completo, lider_politico e super_admin têm acesso amplo)
-- A restrição de campos sensíveis para N4 é feita via view (MULTI-03)
-- e no frontend (MULTI-04).
-- ============================================================
