
-- Fix workspace_folders: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users manage own folders" ON public.workspace_folders;
DROP POLICY IF EXISTS "Admins manage establishment folders" ON public.workspace_folders;
DROP POLICY IF EXISTS "Users view establishment folders" ON public.workspace_folders;

CREATE POLICY "Users manage own folders"
ON public.workspace_folders FOR ALL
TO authenticated
USING ((owner_id = auth.uid()) AND (owner_type = 'user'))
WITH CHECK ((owner_id = auth.uid()) AND (owner_type = 'user'));

CREATE POLICY "Admins manage establishment folders"
ON public.workspace_folders FOR ALL
TO authenticated
USING ((owner_type = 'establishment') AND (establishment_id = get_current_user_establishment()) AND is_current_user_admin())
WITH CHECK ((owner_type = 'establishment') AND (establishment_id = get_current_user_establishment()) AND is_current_user_admin());

CREATE POLICY "Users view establishment folders"
ON public.workspace_folders FOR SELECT
TO authenticated
USING ((owner_type = 'establishment') AND (establishment_id = get_current_user_establishment()));

-- Fix workspace_documents: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users manage own documents" ON public.workspace_documents;
DROP POLICY IF EXISTS "Admins manage establishment documents" ON public.workspace_documents;
DROP POLICY IF EXISTS "Users view establishment documents" ON public.workspace_documents;
DROP POLICY IF EXISTS "View shared documents" ON public.workspace_documents;
DROP POLICY IF EXISTS "Edit shared documents" ON public.workspace_documents;

CREATE POLICY "Users manage own documents"
ON public.workspace_documents FOR ALL
TO authenticated
USING ((owner_id = auth.uid()) AND (owner_type = 'user'))
WITH CHECK ((owner_id = auth.uid()) AND (owner_type = 'user'));

CREATE POLICY "Admins manage establishment documents"
ON public.workspace_documents FOR ALL
TO authenticated
USING ((owner_type = 'establishment') AND (establishment_id = get_current_user_establishment()) AND is_current_user_admin())
WITH CHECK ((owner_type = 'establishment') AND (establishment_id = get_current_user_establishment()) AND is_current_user_admin());

CREATE POLICY "Users view establishment documents"
ON public.workspace_documents FOR SELECT
TO authenticated
USING ((owner_type = 'establishment') AND (establishment_id = get_current_user_establishment()));

CREATE POLICY "View shared documents"
ON public.workspace_documents FOR SELECT
TO authenticated
USING (id IN (SELECT document_id FROM public.workspace_document_shares WHERE shared_with_id = auth.uid()));

CREATE POLICY "Edit shared documents"
ON public.workspace_documents FOR UPDATE
TO authenticated
USING (id IN (SELECT document_id FROM public.workspace_document_shares WHERE shared_with_id = auth.uid() AND permission = 'edit'));

-- Fix workspace_document_shares
DROP POLICY IF EXISTS "Document owner manages shares" ON public.workspace_document_shares;
DROP POLICY IF EXISTS "Users view own shares" ON public.workspace_document_shares;

CREATE POLICY "Document owner manages shares"
ON public.workspace_document_shares FOR ALL
TO authenticated
USING (document_id IN (SELECT id FROM public.workspace_documents WHERE owner_id = auth.uid()))
WITH CHECK (document_id IN (SELECT id FROM public.workspace_documents WHERE owner_id = auth.uid()));

CREATE POLICY "Users view own shares"
ON public.workspace_document_shares FOR SELECT
TO authenticated
USING (shared_with_id = auth.uid());
