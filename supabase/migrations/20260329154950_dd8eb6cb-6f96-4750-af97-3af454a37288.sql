-- Zoom/video conference integration tables

DO $$ BEGIN
  CREATE TYPE public.video_provider AS ENUM ('zoom', 'teams', 'google_meet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.zoom_connection_status AS ENUM ('active', 'inactive', 'error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Zoom connections per establishment
CREATE TABLE IF NOT EXISTS public.zoom_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret_encrypted TEXT NOT NULL,
  access_token_cache TEXT,
  token_expires_at TIMESTAMPTZ,
  status public.zoom_connection_status NOT NULL DEFAULT 'active',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  connected_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(establishment_id)
);

-- Integration audit logs (virtual_class_id as plain UUID, FK added conditionally)
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  virtual_class_id UUID,
  action TEXT NOT NULL,
  provider public.video_provider NOT NULL,
  request_data JSONB,
  response_data JSONB,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.zoom_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zoom_connections_select" ON public.zoom_connections;
CREATE POLICY "zoom_connections_select" ON public.zoom_connections
  FOR SELECT TO authenticated
  USING (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "zoom_connections_insert" ON public.zoom_connections;
CREATE POLICY "zoom_connections_insert" ON public.zoom_connections
  FOR INSERT TO authenticated
  WITH CHECK (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "zoom_connections_update" ON public.zoom_connections;
CREATE POLICY "zoom_connections_update" ON public.zoom_connections
  FOR UPDATE TO authenticated
  USING (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "zoom_connections_delete" ON public.zoom_connections;
CREATE POLICY "zoom_connections_delete" ON public.zoom_connections
  FOR DELETE TO authenticated
  USING (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "integration_logs_select" ON public.integration_logs;
CREATE POLICY "integration_logs_select" ON public.integration_logs
  FOR SELECT TO authenticated
  USING (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "integration_logs_insert" ON public.integration_logs;
CREATE POLICY "integration_logs_insert" ON public.integration_logs
  FOR INSERT TO authenticated
  WITH CHECK (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_integration_logs_establishment ON public.integration_logs(establishment_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_virtual_class ON public.integration_logs(virtual_class_id);

-- Add zoom-specific columns and policies to virtual_classes if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'virtual_classes') THEN
    ALTER TABLE public.virtual_classes ADD COLUMN IF NOT EXISTS provider public.video_provider DEFAULT 'zoom';
    ALTER TABLE public.virtual_classes ADD COLUMN IF NOT EXISTS provider_meeting_id TEXT;
    ALTER TABLE public.virtual_classes ADD COLUMN IF NOT EXISTS join_url TEXT;
    ALTER TABLE public.virtual_classes ADD COLUMN IF NOT EXISTS start_url TEXT;
    ALTER TABLE public.virtual_classes ADD COLUMN IF NOT EXISTS password TEXT;
    ALTER TABLE public.virtual_classes ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
    ALTER TABLE public.virtual_classes ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;
    ALTER TABLE public.virtual_classes ADD COLUMN IF NOT EXISTS host_user_id UUID;
    ALTER TABLE public.virtual_classes ADD COLUMN IF NOT EXISTS error_message TEXT;
    ALTER TABLE public.virtual_classes ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

    DROP POLICY IF EXISTS "virtual_classes_select" ON public.virtual_classes;
    CREATE POLICY "virtual_classes_select" ON public.virtual_classes
      FOR SELECT TO authenticated
      USING (establishment_id IN (
        SELECT establishment_id FROM public.users WHERE id = auth.uid()
      ));

    DROP POLICY IF EXISTS "virtual_classes_insert" ON public.virtual_classes;
    CREATE POLICY "virtual_classes_insert" ON public.virtual_classes
      FOR INSERT TO authenticated
      WITH CHECK (establishment_id IN (
        SELECT establishment_id FROM public.users WHERE id = auth.uid()
      ));

    DROP POLICY IF EXISTS "virtual_classes_update" ON public.virtual_classes;
    CREATE POLICY "virtual_classes_update" ON public.virtual_classes
      FOR UPDATE TO authenticated
      USING (establishment_id IN (
        SELECT establishment_id FROM public.users WHERE id = auth.uid()
      ));

    DROP POLICY IF EXISTS "virtual_classes_delete" ON public.virtual_classes;
    CREATE POLICY "virtual_classes_delete" ON public.virtual_classes
      FOR DELETE TO authenticated
      USING (establishment_id IN (
        SELECT establishment_id FROM public.users WHERE id = auth.uid()
      ));

    CREATE INDEX IF NOT EXISTS idx_zoom_classes_establishment ON public.virtual_classes(establishment_id);
    CREATE INDEX IF NOT EXISTS idx_zoom_classes_formation ON public.virtual_classes(formation_id);
  END IF;
END $$;
