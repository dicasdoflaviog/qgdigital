
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  context text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can read all logs
CREATE POLICY "Super admins can read error logs"
ON public.error_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Any authenticated user can insert error logs (so assessors can log their errors)
CREATE POLICY "Authenticated users can insert error logs"
ON public.error_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
