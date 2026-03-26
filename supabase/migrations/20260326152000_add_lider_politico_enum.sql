-- Migration: Add lider_politico role to app_role enum
-- N4 (Líder Político) gets a distinct role string, separating it from N5 (super_admin)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lider_politico';
