import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Save, FileUp, FileText, Eye, Loader2, Trash2 } from 'lucide-react';
import ColorPalette from './ColorPalette';
import MatieresPanel from './MatieresPanel';
import PdfViewerModal from '@/components/common/PdfViewerModal';
import { formationService } from '@/services/formationService';
import { fileUploadService } from '@/services/fileUploadService';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface EditFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  formationId: string | null;
}

interface EditFormationData {
  title: string;
  description: string;
  level: string;
  start_date: string;
  end_date: string;
  status: string;
  color: string;
  duration: number;
  academic_year: string;
  duration_years: number;
  formation_type: string;
  referentiel_pdf_url: string;
}

const EditFormationModal: React.FC<EditFormationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  formationId
}) => {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState<EditFormationData>({
    title: '',
    description: '',
    level: 'BAC+1',
    start_date: '',
    end_date: '',
    status: 'Actif',
    color: '#8B5CF6',
    duration: 0,
    academic_year: `${currentYear}-${currentYear + 1}`,
    duration_years: 1,
    formation_type: 'presentiel',
    referentiel_pdf_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (isOpen && formationId) {
      loadFormation();
    }
  }, [isOpen, formationId]);

  const loadFormation = async () => {
    if (!formationId) return;

    try {
      setInitialLoading(true);
      setError(null);
      const formation = await formationService.getFormationById(formationId);

      setFormData({
        title: formation.title,
        description: formation.description || '',
        level: formation.level,
        start_date: formation.start_date,
        end_date: formation.end_date,
        status: formation.status,
        color: formation.color || '#8B5CF6',
        duration: formation.duration,
        academic_year: (formation as any).academic_year || `${currentYear}-${currentYear + 1}`,
        duration_years: (formation as any).duration_years || 1,
        formation_type: (formation as any).formation_type || 'presentiel',
        referentiel_pdf_url: (formation as any).referentiel_pdf_url || '',
      });
    } catch (error) {
      console.error('Erreur lors du chargement de la formation:', error);
      setError('Erreur lors du chargement de la formation');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'duration_years' ? Number(value) : value
    }));
    if (error) setError(null);
  };

  const handleColorChange = (color: string) => {
    setFormData(prev => ({
      ...prev,
      color: color
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formationId) return;

    setError(null);

    try {
      setLoading(true);

      if (!formData.title.trim()) {
        setError('Le titre de la formation est requis');
        return;
      }

      await formationService.updateFormation(formationId, {
        ...formData,
        semesters_count: formData.duration_years * 2,
      } as any);

      toast.success('Formation mise à jour avec succès');
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Erreur lors de la modification de la formation:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la modification de la formation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            <GraduationCap className="h-5 w-5 inline mr-2" />
            Modifier la formation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {initialLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Chargement...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Titre de la formation *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Année académique</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Année début</label>
                      <Select value={formData.academic_year.split('-')[0]} onValueChange={(v) => setFormData(prev => ({ ...prev, academic_year: `${v}-${prev.academic_year.split('-')[1]}` }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Début" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 7 }, (_, i) => {
                            const y = currentYear - 1 + i;
                            return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Année fin</label>
                      <Select value={formData.academic_year.split('-')[1]} onValueChange={(v) => setFormData(prev => ({ ...prev, academic_year: `${prev.academic_year.split('-')[0]}-${v}` }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Fin" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 7 }, (_, i) => {
                            const y = currentYear + i;
                            return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Niveau</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAC+1">BAC+1</SelectItem>
                      <SelectItem value="BAC+2">BAC+2</SelectItem>
                      <SelectItem value="BAC+3">BAC+3</SelectItem>
                      <SelectItem value="BAC+4">BAC+4</SelectItem>
                      <SelectItem value="BAC+5">BAC+5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                      <SelectItem value="Brouillon">Brouillon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Type de formation</Label>
                  <Select value={formData.formation_type} onValueChange={(value) => setFormData(prev => ({ ...prev, formation_type: value }))}>
                    <SelectTrigger data-testid="edit-formation-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presentiel">Présentiel</SelectItem>
                      <SelectItem value="foad">FOAD</SelectItem>
                      <SelectItem value="en_ligne">En ligne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Référentiel de formation (PDF)</Label>
                  <ReferentielPdfField
                    value={formData.referentiel_pdf_url}
                    onChange={(url) => setFormData(prev => ({ ...prev, referentiel_pdf_url: url }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <DatePicker
                    value={formData.start_date}
                    onChange={(value) => setFormData(prev => ({ ...prev, start_date: value }))}
                    placeholder="Sélectionner une date"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <DatePicker
                    value={formData.end_date}
                    onChange={(value) => setFormData(prev => ({ ...prev, end_date: value }))}
                    placeholder="Sélectionner une date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (heures)</Label>
                  <Input
                    id="duration"
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <ColorPalette 
                    selectedColor={formData.color}
                    onColorChange={handleColorChange}
                  />
                </div>
              </div>
            </div>

            <div data-testid="matieres-section">
              <MatieresPanel formationId={formationId!} />
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Modification...' : 'Enregistrer la formation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditFormationModal;

// ─── Sub-component: Référentiel PDF upload/view/delete ──────────────────
const ReferentielPdfField: React.FC<{ value: string; onChange: (url: string) => void }> = ({ value, onChange }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [showViewer, setShowViewer] = React.useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier dépasse 10 Mo');
      return;
    }
    try {
      setUploading(true);
      const url = await fileUploadService.uploadFile(file, 'module-files');
      onChange(url);
      toast.success('Référentiel PDF mis à jour');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du téléchargement');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (!value) {
    return (
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          className="hidden"
          data-testid="edit-formation-referentiel-input"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-primary/40 text-sm font-medium text-primary hover:bg-primary/10 transition-all disabled:opacity-60"
          data-testid="edit-formation-referentiel-upload-btn"
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Téléchargement...</>
          ) : (
            <><FileUp className="h-4 w-4" /> Importer un PDF</>
          )}
        </button>
        <span className="text-xs text-muted-foreground">Max 10 Mo</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-primary/20 bg-primary/5">
      <FileText className="h-5 w-5 text-primary shrink-0" />
      <span className="text-sm flex-1 truncate">{fileUploadService.getFileName(value)}</span>
      <button
        type="button"
        onClick={() => setShowViewer(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        data-testid="edit-formation-referentiel-view-btn"
      >
        <Eye className="h-3.5 w-3.5" /> Voir
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-border text-foreground hover:bg-muted/50"
        title="Remplacer"
      >
        <FileUp className="h-3.5 w-3.5" /> {uploading ? '...' : 'Remplacer'}
      </button>
      <button
        type="button"
        onClick={() => onChange('')}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-destructive hover:bg-destructive/10"
        title="Retirer le PDF"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <PdfViewerModal
        open={showViewer}
        onClose={() => setShowViewer(false)}
        url={value}
        title="Référentiel de formation"
        filename={fileUploadService.getFileName(value)}
      />
    </div>
  );
};
