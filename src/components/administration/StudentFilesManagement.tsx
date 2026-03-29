import React, { useState, useEffect } from 'react';
import { FolderOpen, Upload, Eye, CheckCircle, Trash2, FileText, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { studentDocumentService, documentTypeLabels, documentStatusLabels, StudentDocument, StudentDocumentType } from '@/services/studentDocumentService';
import { useEstablishment } from '@/hooks/useEstablishment';

interface Student {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const StudentFilesManagement: React.FC = () => {
  const { establishment } = useEstablishment();
  const [formations, setFormations] = useState<any[]>([]);
  const [promotionsForFormation, setPromotionsForFormation] = useState<any[]>([]);
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Upload modal state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<StudentDocumentType>('autre');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (establishment?.id) {
      supabase.from('formations').select('id, title').eq('establishment_id', establishment.id).then(({ data }) => setFormations(data || []));
    }
  }, [establishment?.id]);

  useEffect(() => {
    if (selectedFormation) {
      supabase.from('promotions').select('id, name, academic_year_start, academic_year_end').eq('formation_id', selectedFormation).then(({ data }) => setPromotionsForFormation(data || []));
    }
  }, [selectedFormation]);

  useEffect(() => {
    if (selectedPromotion) {
      loadStudents();
    }
  }, [selectedPromotion]);

  useEffect(() => {
    if (selectedStudent) {
      loadDocuments();
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase.rpc('get_promotion_students', { promotion_id_param: selectedPromotion });
      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des étudiants');
    }
  };

  const loadDocuments = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const docs = await studentDocumentService.getByStudent(selectedStudent.user_id);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedStudent || !uploadTitle || !uploadFile) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const establishmentId = (session?.user as any)?.user_metadata?.establishment_id;
      
      // Get establishment from user context
      const { data: userData } = await supabase.from('users').select('establishment_id').eq('id', session!.user.id).single();
      const estId = userData?.establishment_id;
      if (!estId) throw new Error('Établissement non trouvé');

      const fileUrl = await studentDocumentService.uploadFile(uploadFile, estId, selectedStudent.user_id);

      await studentDocumentService.create({
        student_id: selectedStudent.user_id,
        establishment_id: estId,
        promotion_id: selectedPromotion || null,
        document_type: uploadType,
        title: uploadTitle,
        description: uploadDescription || null,
        file_url: fileUrl,
        file_name: uploadFile.name,
        academic_year: null,
        status: 'draft',
      });

      toast.success('Document ajouté avec succès');
      setShowUploadModal(false);
      resetUploadForm();
      loadDocuments();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async (docId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await studentDocumentService.validate(docId, session.user.id);
      toast.success('Document validé');
      loadDocuments();
    } catch (err) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await studentDocumentService.delete(docId);
      toast.success('Document supprimé');
      loadDocuments();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadType('autre');
    setUploadDescription('');
    setUploadFile(null);
  };

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDocuments = documents.filter(d =>
    filterType === 'all' || d.document_type === filterType
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'draft': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'archived': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sélecteur Formation / Promotion */}
      <FormationPromotionSelector
        selectedFormation={selectedFormation}
        selectedPromotion={selectedPromotion}
        onFormationChange={(f) => { setSelectedFormation(f); setSelectedPromotion(''); setSelectedStudent(null); setDocuments([]); }}
        onPromotionChange={(p) => { setSelectedPromotion(p); setSelectedStudent(null); setDocuments([]); }}
      />

      {selectedPromotion && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des étudiants */}
          <div className="lg:col-span-1 bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Étudiants ({filteredStudents.length})
            </h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filteredStudents.map(student => (
                <button
                  key={student.user_id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedStudent?.user_id === student.user_id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  <p className="font-medium text-sm text-foreground">{student.last_name} {student.first_name}</p>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </button>
              ))}
              {filteredStudents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun étudiant trouvé</p>
              )}
            </div>
          </div>

          {/* Dossier étudiant */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4">
            {selectedStudent ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      Dossier de {selectedStudent.first_name} {selectedStudent.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{documents.length} document(s)</p>
                  </div>
                  <Button onClick={() => setShowUploadModal(true)} size="sm" className="gap-2">
                    <Upload className="h-4 w-4" /> Ajouter un document
                  </Button>
                </div>

                {/* Filtre par type */}
                <div className="flex items-center gap-3 mb-4">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {Object.entries(documentTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Liste des documents */}
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Aucun document dans le dossier</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-all">
                        <FileText className="h-8 w-8 text-primary/60 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{documentTypeLabels[doc.document_type]}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusColor(doc.status)}`}>
                              {documentStatusLabels[doc.status]}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.file_url && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(doc.file_url!, '_blank')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {doc.status === 'draft' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleValidate(doc.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <FolderOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">Sélectionnez un étudiant pour voir son dossier</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Nom du document" />
            </div>
            <div>
              <Label>Type de document</Label>
              <Select value={uploadType} onValueChange={v => setUploadType(v as StudentDocumentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} placeholder="Description optionnelle" />
            </div>
            <div>
              <Label>Fichier *</Label>
              <Input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>Annuler</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Envoi...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentFilesManagement;
