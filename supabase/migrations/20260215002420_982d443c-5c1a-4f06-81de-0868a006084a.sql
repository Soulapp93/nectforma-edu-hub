
-- Table pour les abonnés newsletter
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Permettre l'insertion publique (inscription sans auth)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Super admins peuvent voir et gérer
CREATE POLICY "Super admins manage newsletter subscribers"
ON public.newsletter_subscribers
FOR ALL
USING (public.is_super_admin());

-- Permettre la lecture publique pour vérifier si déjà inscrit
CREATE POLICY "Check own subscription by email"
ON public.newsletter_subscribers
FOR SELECT
USING (true);
