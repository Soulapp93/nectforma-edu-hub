
-- Create document type enum
CREATE TYPE public.student_document_type AS ENUM (
  'certificat_scolarite', 'certificat_inscription', 'diplome', 'bulletin_notes',
  'contrat', 'convention_stage', 'attestation', 'releve_notes', 'autre'
);

CREATE TYPE public.document_status AS ENUM ('draft', 'validated', 'archived');

CREATE TYPE public.archive_module_type AS ENUM (
  'formation', 'promotion', 'dossier_etudiant', 'cahier_texte', 'emargement', 'emploi_temps', 'notes'
);

-- Student documents table
CREATE TABLE public.student_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL,
  document_type public.student_document_type NOT NULL DEFAULT 'autre',
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  academic_year TEXT,
  status public.document_status NOT NULL DEFAULT 'draft',
  validated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promotion archives table
CREATE TABLE public.promotion_archives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  archived_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  academic_year TEXT,
  status TEXT NOT NULL DEFAULT 'archived',
  archive_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Archive snapshots table
CREATE TABLE public.archive_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  archive_id UUID NOT NULL REFERENCES public.promotion_archives(id) ON DELETE CASCADE,
  module_type public.archive_module_type NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Triggers for updated_at
CREATE TRIGGER handle_student_documents_updated_at
  BEFORE UPDATE ON public.student_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Storage bucket for student documents
INSERT INTO storage.buckets (id, name, public) VALUES ('student-documents', 'student-documents', true);

-- RLS on student_documents
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage student documents"
  ON public.student_documents FOR ALL TO authenticated
  USING (establishment_id = public.get_current_user_establishment())
  WITH CHECK (establishment_id = public.get_current_user_establishment());

CREATE POLICY "Students can view own documents"
  ON public.student_documents FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND status = 'validated');

-- RLS on promotion_archives
ALTER TABLE public.promotion_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage archives"
  ON public.promotion_archives FOR ALL TO authenticated
  USING (establishment_id = public.get_current_user_establishment())
  WITH CHECK (establishment_id = public.get_current_user_establishment());

-- RLS on archive_snapshots
ALTER TABLE public.archive_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view archive snapshots"
  ON public.archive_snapshots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.promotion_archives pa
      WHERE pa.id = archive_snapshots.archive_id
        AND pa.establishment_id = public.get_current_user_establishment()
    )
  );

CREATE POLICY "Admin can insert archive snapshots"
  ON public.archive_snapshots FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.promotion_archives pa
      WHERE pa.id = archive_snapshots.archive_id
        AND pa.establishment_id = public.get_current_user_establishment()
    )
  );

-- Storage RLS for student-documents bucket
CREATE POLICY "Admin can upload student documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-documents');

CREATE POLICY "Anyone authenticated can view student documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-documents');

CREATE POLICY "Admin can delete student documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-documents');
