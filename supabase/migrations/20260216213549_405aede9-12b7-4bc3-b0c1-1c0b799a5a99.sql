
-- Table des dossiers de l'espace de travail
CREATE TABLE public.workspace_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.workspace_folders(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  owner_type TEXT NOT NULL DEFAULT 'user' CHECK (owner_type IN ('user', 'establishment')),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des documents de l'espace de travail
CREATE TABLE public.workspace_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Sans titre',
  document_type TEXT NOT NULL DEFAULT 'text' CHECK (document_type IN ('text', 'spreadsheet', 'presentation', 'visual')),
  content JSONB DEFAULT '{}'::jsonb,
  folder_id UUID REFERENCES public.workspace_folders(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL,
  owner_type TEXT NOT NULL DEFAULT 'user' CHECK (owner_type IN ('user', 'establishment')),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  last_edited_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table de partage de documents
CREATE TABLE public.workspace_document_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.workspace_documents(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  shared_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_document_shares ENABLE ROW LEVEL SECURITY;

-- RLS: workspace_folders
CREATE POLICY "Users manage own folders"
ON public.workspace_folders FOR ALL
USING (owner_id = auth.uid() AND owner_type = 'user');

CREATE POLICY "Admins manage establishment folders"
ON public.workspace_folders FOR ALL
USING (
  owner_type = 'establishment' 
  AND establishment_id = get_current_user_establishment()
  AND is_current_user_admin()
);

CREATE POLICY "Users view establishment folders"
ON public.workspace_folders FOR SELECT
USING (
  owner_type = 'establishment' 
  AND establishment_id = get_current_user_establishment()
);

-- RLS: workspace_documents
CREATE POLICY "Users manage own documents"
ON public.workspace_documents FOR ALL
USING (owner_id = auth.uid() AND owner_type = 'user');

CREATE POLICY "Admins manage establishment documents"
ON public.workspace_documents FOR ALL
USING (
  owner_type = 'establishment'
  AND establishment_id = get_current_user_establishment()
  AND is_current_user_admin()
);

CREATE POLICY "Users view establishment documents"
ON public.workspace_documents FOR SELECT
USING (
  owner_type = 'establishment'
  AND establishment_id = get_current_user_establishment()
);

CREATE POLICY "View shared documents"
ON public.workspace_documents FOR SELECT
USING (
  id IN (SELECT document_id FROM public.workspace_document_shares WHERE shared_with_id = auth.uid())
);

CREATE POLICY "Edit shared documents"
ON public.workspace_documents FOR UPDATE
USING (
  id IN (SELECT document_id FROM public.workspace_document_shares WHERE shared_with_id = auth.uid() AND permission = 'edit')
);

-- RLS: workspace_document_shares
CREATE POLICY "Document owner manages shares"
ON public.workspace_document_shares FOR ALL
USING (
  document_id IN (SELECT id FROM public.workspace_documents WHERE owner_id = auth.uid())
);

CREATE POLICY "Users view own shares"
ON public.workspace_document_shares FOR SELECT
USING (shared_with_id = auth.uid());

-- Triggers updated_at
CREATE TRIGGER update_workspace_folders_updated_at
BEFORE UPDATE ON public.workspace_folders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_workspace_documents_updated_at
BEFORE UPDATE ON public.workspace_documents
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_workspace_folders_owner ON public.workspace_folders(owner_id, owner_type);
CREATE INDEX idx_workspace_documents_owner ON public.workspace_documents(owner_id, owner_type);
CREATE INDEX idx_workspace_documents_folder ON public.workspace_documents(folder_id);
CREATE INDEX idx_workspace_document_shares_doc ON public.workspace_document_shares(document_id);
CREATE INDEX idx_workspace_document_shares_user ON public.workspace_document_shares(shared_with_id);
