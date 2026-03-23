
CREATE TABLE public.gabinete_cache_resumo (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id uuid NOT NULL,
  resumo_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '8 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_cache_resumo_gabinete ON public.gabinete_cache_resumo (gabinete_id, generated_at DESC);
CREATE INDEX idx_cache_resumo_expires ON public.gabinete_cache_resumo (expires_at);

ALTER TABLE public.gabinete_cache_resumo ENABLE ROW LEVEL SECURITY;

-- Edge functions (service role) handle writes; users can read their own gabinete's cache
CREATE POLICY "Users can read own gabinete cache"
  ON public.gabinete_cache_resumo
  FOR SELECT
  TO authenticated
  USING (gabinete_id = get_user_gabinete_id());

CREATE POLICY "Super admin can manage all cache"
  ON public.gabinete_cache_resumo
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow service role full access (edge functions use service key)
