
-- Function to check if user owns a document (breaks recursion)
CREATE OR REPLACE FUNCTION public.is_document_owner(_document_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_documents
    WHERE id = _document_id AND owner_id = auth.uid()
  )
$$;

-- Function to check if a document is shared with user
CREATE OR REPLACE FUNCTION public.is_document_shared_with_me(_document_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_document_shares
    WHERE document_id = _document_id AND shared_with_id = auth.uid()
  )
$$;

-- Function to check if a document is shared with edit permission
CREATE OR REPLACE FUNCTION public.is_document_shared_with_me_edit(_document_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_document_shares
    WHERE document_id = _document_id AND shared_with_id = auth.uid() AND permission = 'edit'
  )
$$;

-- Drop ALL existing policies on workspace_documents
DROP POLICY IF EXISTS "Admins manage establishment documents" ON public.workspace_documents;
DROP POLICY IF EXISTS "Edit shared documents" ON public.workspace_documents;
DROP POLICY IF EXISTS "Users manage own documents" ON public.workspace_documents;
DROP POLICY IF EXISTS "Users view establishment documents" ON public.workspace_documents;
DROP POLICY IF EXISTS "View shared documents" ON public.workspace_documents;

-- Recreate policies using security definer functions (no recursion)
CREATE POLICY "Users manage own documents"
ON public.workspace_documents FOR ALL
TO authenticated
USING (owner_id = auth.uid() AND owner_type = 'user')
WITH CHECK (owner_id = auth.uid() AND owner_type = 'user');

CREATE POLICY "Admins manage establishment documents"
ON public.workspace_documents FOR ALL
TO authenticated
USING (owner_type = 'establishment' AND establishment_id = get_current_user_establishment() AND is_current_user_admin())
WITH CHECK (owner_type = 'establishment' AND establishment_id = get_current_user_establishment() AND is_current_user_admin());

CREATE POLICY "Users view establishment documents"
ON public.workspace_documents FOR SELECT
TO authenticated
USING (owner_type = 'establishment' AND establishment_id = get_current_user_establishment());

CREATE POLICY "View shared documents"
ON public.workspace_documents FOR SELECT
TO authenticated
USING (is_document_shared_with_me(id));

CREATE POLICY "Edit shared documents"
ON public.workspace_documents FOR UPDATE
TO authenticated
USING (is_document_shared_with_me_edit(id));

-- Fix workspace_document_shares too (references workspace_documents causing recursion)
DROP POLICY IF EXISTS "Document owner manages shares" ON public.workspace_document_shares;
DROP POLICY IF EXISTS "Users view own shares" ON public.workspace_document_shares;

CREATE POLICY "Document owner manages shares"
ON public.workspace_document_shares FOR ALL
TO authenticated
USING (is_document_owner(document_id))
WITH CHECK (is_document_owner(document_id));

CREATE POLICY "Users view own shares"
ON public.workspace_document_shares FOR SELECT
TO authenticated
USING (shared_with_id = auth.uid());
