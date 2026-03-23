
-- Step 1: Add super_admin to enum (must be committed alone)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
