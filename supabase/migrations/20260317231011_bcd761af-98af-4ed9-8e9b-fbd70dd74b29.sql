
-- Chat messages table for conversation history
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can read/insert their own messages
CREATE POLICY "Users can read own chat messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Super admin can see all
CREATE POLICY "Super admin can manage chat_messages"
  ON public.chat_messages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Index for fast retrieval
CREATE INDEX idx_chat_messages_user_created ON public.chat_messages(user_id, created_at);

-- Add AI assistant name to gabinete_config
ALTER TABLE public.gabinete_config ADD COLUMN IF NOT EXISTS ia_nome text;
