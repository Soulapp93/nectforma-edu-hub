
-- Enum for video conference providers
CREATE TYPE public.video_provider AS ENUM ('zoom', 'teams', 'google_meet');

-- Enum for virtual class sync status
CREATE TYPE public.virtual_class_status AS ENUM ('pending', 'synced', 'error', 'cancelled');

-- Enum for zoom connection status
CREATE TYPE public.zoom_connection_status AS ENUM ('active', 'inactive', 'error');

-- Zoom connections per establishment (Server-to-Server OAuth)
CREATE TABLE public.zoom_connections (
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

-- Virtual classes
CREATE TABLE public.virtual_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  formation_id UUID REFERENCES public.formations(id) ON DELETE SET NULL,
  schedule_slot_id UUID REFERENCES public.schedule_slots(id) ON DELETE SET NULL,
  provider public.video_provider NOT NULL DEFAULT 'zoom',
  provider_meeting_id TEXT,
  join_url TEXT,
  start_url TEXT,
  password TEXT,
  status public.virtual_class_status NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  host_user_id UUID,
  instructor_id UUID,
  error_message TEXT,
  last_sync_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Integration audit logs
CREATE TABLE public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  virtual_class_id UUID REFERENCES public.virtual_classes(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  provider public.video_provider NOT NULL,
  request_data JSONB,
  response_data JSONB,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.zoom_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Zoom connections: admin only via establishment
CREATE POLICY "zoom_connections_select" ON public.zoom_connections
  FOR SELECT TO authenticated
  USING (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "zoom_connections_insert" ON public.zoom_connections
  FOR INSERT TO authenticated
  WITH CHECK (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "zoom_connections_update" ON public.zoom_connections
  FOR UPDATE TO authenticated
  USING (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "zoom_connections_delete" ON public.zoom_connections
  FOR DELETE TO authenticated
  USING (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

-- Virtual classes: users of the establishment can read, admins can write
CREATE POLICY "virtual_classes_select" ON public.virtual_classes
  FOR SELECT TO authenticated
  USING (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "virtual_classes_insert" ON public.virtual_classes
  FOR INSERT TO authenticated
  WITH CHECK (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "virtual_classes_update" ON public.virtual_classes
  FOR UPDATE TO authenticated
  USING (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "virtual_classes_delete" ON public.virtual_classes
  FOR DELETE TO authenticated
  USING (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

-- Integration logs: read only for establishment users
CREATE POLICY "integration_logs_select" ON public.integration_logs
  FOR SELECT TO authenticated
  USING (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "integration_logs_insert" ON public.integration_logs
  FOR INSERT TO authenticated
  WITH CHECK (establishment_id IN (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_virtual_classes_establishment ON public.virtual_classes(establishment_id);
CREATE INDEX idx_virtual_classes_formation ON public.virtual_classes(formation_id);
CREATE INDEX idx_virtual_classes_scheduled ON public.virtual_classes(scheduled_at);
CREATE INDEX idx_integration_logs_establishment ON public.integration_logs(establishment_id);
CREATE INDEX idx_integration_logs_virtual_class ON public.integration_logs(virtual_class_id);
