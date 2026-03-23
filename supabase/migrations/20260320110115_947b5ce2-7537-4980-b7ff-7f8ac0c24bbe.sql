
-- Create subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('bronze', 'silver', 'gold');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');

-- Create subscriptions table (replaces config_faturamento for plan management)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type public.subscription_plan NOT NULL DEFAULT 'bronze',
  status public.subscription_status NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  is_manual_trial BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(gabinete_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- L5 can manage all subscriptions
CREATE POLICY "L5 can manage all subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (get_user_role_level() = 5)
WITH CHECK (get_user_role_level() = 5);

-- L3 (admin) can read own gabinete subscription
CREATE POLICY "Admin can read own subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (gabinete_id = get_user_gabinete_id());

-- Team members can read their gabinete subscription
CREATE POLICY "Team can read gabinete subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (gabinete_id = get_user_gabinete_id());

-- Trigger to update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
