CREATE TABLE public.ai_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id uuid NOT NULL,
  user_id uuid NOT NULL,
  summary text NOT NULL,
  topics text[] DEFAULT '{}',
  message_count integer DEFAULT 0,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own gabinete memories"
ON public.ai_memories FOR SELECT TO authenticated
USING (gabinete_id = public.get_user_gabinete_id());

CREATE POLICY "Service can insert memories"
ON public.ai_memories FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admin can manage all memories"
ON public.ai_memories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_ai_memories_gabinete ON public.ai_memories(gabinete_id, created_at DESC);