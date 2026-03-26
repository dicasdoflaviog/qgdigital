-- Migration: Migrate N4 users and add RLS policies for lider_politico
-- Runs after 20260326152000_add_lider_politico_enum.sql (enum value is committed)

-- Migrate existing N4 users: super_admin + role_level=4 → lider_politico
UPDATE public.user_roles
SET role = 'lider_politico'
WHERE role = 'super_admin' AND role_level = 4;

-- ── RLS policies for lider_politico ─────────────────────────────────────────
-- N4 (Líder Político) gets operational access equivalent to admin,
-- plus cross-gabinete read access for network oversight.

-- contatos_estrategicos (full management)
CREATE POLICY "lider_politico can manage contatos"
ON public.contatos_estrategicos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'lider_politico'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'lider_politico'::app_role));

-- instituicoes (full management)
CREATE POLICY "lider_politico can manage instituicoes"
ON public.instituicoes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'lider_politico'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'lider_politico'::app_role));

-- emendas (full management)
CREATE POLICY "lider_politico can manage emendas"
ON public.emendas FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'lider_politico'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'lider_politico'::app_role));

-- convites (create invites for their network)
CREATE POLICY "lider_politico can manage convites"
ON public.convites FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'lider_politico'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'lider_politico'::app_role));

-- eleitores (cross-gabinete read for regional oversight)
CREATE POLICY "lider_politico can read all eleitores"
ON public.eleitores FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'lider_politico'::app_role));

-- demandas (cross-gabinete read for regional oversight)
CREATE POLICY "lider_politico can read all demandas"
ON public.demandas FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'lider_politico'::app_role));
