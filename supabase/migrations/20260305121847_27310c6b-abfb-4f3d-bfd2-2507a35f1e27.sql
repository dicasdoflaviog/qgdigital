
-- Create feedbacks table
CREATE TABLE public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON public.feedbacks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback"
  ON public.feedbacks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Super admins can read all feedbacks
CREATE POLICY "Super admins can read all feedbacks"
  ON public.feedbacks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can update feedbacks (status changes)
CREATE POLICY "Super admins can update feedbacks"
  ON public.feedbacks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));
