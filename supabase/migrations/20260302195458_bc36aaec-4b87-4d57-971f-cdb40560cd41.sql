
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'assessor', 'secretaria');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Assessores table
CREATE TABLE public.assessores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cadastros INTEGER NOT NULL DEFAULT 0,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assessores ENABLE ROW LEVEL SECURITY;

-- Eleitores table
CREATE TABLE public.eleitores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL DEFAULT '',
  bairro TEXT NOT NULL DEFAULT '',
  data_nascimento DATE,
  situacao TEXT NOT NULL DEFAULT 'Novo Cadastro',
  assessor_id UUID REFERENCES public.assessores(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.eleitores ENABLE ROW LEVEL SECURITY;

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_eleitores_updated_at
BEFORE UPDATE ON public.eleitores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: user_roles (only admins manage, users read own)
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: assessores
CREATE POLICY "Authenticated users can read assessores"
  ON public.assessores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage assessores"
  ON public.assessores FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: eleitores
CREATE POLICY "Admins can manage all eleitores"
  ON public.eleitores FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assessores can read their own eleitores"
  ON public.eleitores FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'assessor')
    AND assessor_id IN (
      SELECT id FROM public.assessores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Secretaria can read all eleitores"
  ON public.eleitores FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'secretaria'));
