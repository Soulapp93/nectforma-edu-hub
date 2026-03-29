import { supabase } from '@/integrations/supabase/client';

export type ArchiveModuleType = 'formation' | 'promotion' | 'dossier_etudiant' | 'cahier_texte' | 'emargement' | 'emploi_temps' | 'notes';

export interface PromotionArchive {
  id: string;
  promotion_id: string;
  formation_id: string;
  establishment_id: string;
  archived_by: string | null;
  archived_at: string;
  academic_year: string | null;
  status: string;
  archive_metadata: Record<string, any>;
  created_at: string;
}

export interface ArchiveSnapshot {
  id: string;
  archive_id: string;
  module_type: ArchiveModuleType;
  snapshot_data: Record<string, any>;
  created_at: string;
}

export const archiveModuleLabels: Record<ArchiveModuleType, string> = {
  formation: 'Formation',
  promotion: 'Promotion',
  dossier_etudiant: 'Dossiers étudiants',
  cahier_texte: 'Cahiers de texte',
  emargement: 'Émargement',
  emploi_temps: 'Emplois du temps',
  notes: 'Notes & Évaluations',
};

export const archiveService = {
  async getArchives(establishmentId: string): Promise<PromotionArchive[]> {
    const { data, error } = await supabase
      .from('promotion_archives')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('archived_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as PromotionArchive[];
  },

  async getSnapshots(archiveId: string): Promise<ArchiveSnapshot[]> {
    const { data, error } = await supabase
      .from('archive_snapshots')
      .select('*')
      .eq('archive_id', archiveId)
      .order('module_type');
    if (error) throw error;
    return (data || []) as unknown as ArchiveSnapshot[];
  },

  async archivePromotion(params: {
    promotionId: string;
    formationId: string;
    establishmentId: string;
    archivedBy: string;
    academicYear: string;
    metadata: Record<string, any>;
  }): Promise<PromotionArchive> {
    const { data, error } = await supabase
      .from('promotion_archives')
      .insert({
        promotion_id: params.promotionId,
        formation_id: params.formationId,
        establishment_id: params.establishmentId,
        archived_by: params.archivedBy,
        academic_year: params.academicYear,
        archive_metadata: params.metadata,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as PromotionArchive;
  },

  async createSnapshot(archiveId: string, moduleType: ArchiveModuleType, snapshotData: Record<string, any>): Promise<ArchiveSnapshot> {
    const { data, error } = await supabase
      .from('archive_snapshots')
      .insert({ archive_id: archiveId, module_type: moduleType, snapshot_data: snapshotData } as any)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as ArchiveSnapshot;
  },

  async collectAndArchive(params: {
    promotionId: string;
    formationId: string;
    establishmentId: string;
    archivedBy: string;
    academicYear: string;
  }): Promise<PromotionArchive> {
    // Collect formation data
    const { data: formation } = await supabase.from('formations').select('*').eq('id', params.formationId).single();
    const { data: modules } = await supabase.from('formation_modules').select('*').eq('formation_id', params.formationId);
    const { data: students } = await supabase.rpc('get_promotion_students', { promotion_id_param: params.promotionId });
    
    // Collect textbooks
    const { data: textbooks } = await supabase.from('text_books').select('*').eq('promotion_id', params.promotionId);
    
    // Collect attendance
    const { data: attendance } = await supabase.from('attendance_sheets').select('*, attendance_signatures(*)').eq('formation_id', params.formationId);
    
    // Collect schedules
    const { data: schedules } = await supabase.from('schedule_slots').select('*').eq('formation_id', params.formationId);
    
    // Collect grades
    const { data: evaluations } = await supabase.from('evaluations').select('*, grades(*)').in('module_id', (modules || []).map(m => m.id));

    // Collect student documents
    const { data: studentDocs } = await supabase.from('student_documents').select('*').eq('promotion_id', params.promotionId);

    const studentCount = (students || []).length;
    const archive = await this.archivePromotion({
      ...params,
      metadata: { student_count: studentCount, modules_count: (modules || []).length, archived_date: new Date().toISOString() },
    });

    // Create snapshots in parallel
    await Promise.all([
      this.createSnapshot(archive.id, 'formation', { formation, modules }),
      this.createSnapshot(archive.id, 'promotion', { students }),
      this.createSnapshot(archive.id, 'dossier_etudiant', { documents: studentDocs }),
      this.createSnapshot(archive.id, 'cahier_texte', { textbooks }),
      this.createSnapshot(archive.id, 'emargement', { attendance }),
      this.createSnapshot(archive.id, 'emploi_temps', { schedules }),
      this.createSnapshot(archive.id, 'notes', { evaluations }),
    ]);

    return archive;
  },
};
