ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS role_level INTEGER NOT NULL DEFAULT 1
CONSTRAINT check_role_level CHECK (role_level >= 1 AND role_level <= 5);