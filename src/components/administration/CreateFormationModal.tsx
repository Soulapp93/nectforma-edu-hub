
import React, { useState, useRef } from 'react';
import { X, GraduationCap, Clock, Info, FileUp, FileText, Eye, Loader2, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ColorPalette from './ColorPalette';
import { formationService } from '@/services/formationService';
import { fileUploadService } from '@/services/fileUploadService';
import { establishmentService } from '@/services/establishmentService';
import { toast } from 'sonner';

interface CreateFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormationFormData {
  title: string;
  description: string;
  level: string;
  status: string;
  color: string;
  duration: number; // hours
  duration_years: number;
  formation_type: string; // 'presentiel' | 'foad' | 'en_ligne'
  referentiel_pdf_url: string;
}

const CreateFormationModal: React.FC<CreateFormationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormationFormData>({
    title: '',
    description: '',
    level: 'BAC+1',
    status: 'Actif',
    color: '#8B5CF6',
    duration: 0,
    duration_years: 1,
    formation_type: 'presentiel',
    referentiel_pdf_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadingPdf(true);
      const url = await fileUploadService.uploadFile(file, 'module-files');
      setFormData(p => ({ ...p, referentiel_pdf_url: url }));
      toast.success('Référentiel PDF chargé');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du téléchargement du PDF');
    } finally {
      setUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePdf = () => {
    setFormData(p => ({ ...p, referentiel_pdf_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.title.trim()) {
      setError('Le titre de la formation est requis');
      return;
    }

    try {
      setLoading(true);
      const establishment = await establishmentService.getOrCreateDefaultEstablishment();
      if (!establishment?.id) {
        setError("Impossible de récupérer l'établissement. Veuillez vous reconnecter.");
        return;
      }

      // Sensible defaults for fields kept on the formations table for backward compatibility,
      // but they are NOT exposed in this form (dates/academic_year now belong to promotions).
      const today = new Date();
      const defaultStartDate = today.toISOString().split('T')[0];
      const defaultEndDate = new Date(today.getFullYear() + formData.duration_years, today.getMonth(), today.getDate())
        .toISOString().split('T')[0];

      const semesters_count = formData.duration_years * 2;

      const formationData = {
        title: formData.title,
        description: formData.description,
        level: formData.level,
        // Dates kept for legacy schema; real dates live on the promotion.
        start_date: defaultStartDate,
        end_date: defaultEndDate,
        status: formData.status,
        color: formData.color,
        duration: formData.duration || 0,
        // academic_year kept as placeholder; real academic year is per-promotion.
        academic_year: '',
        max_students: 25,
        price: 0,
        establishment_id: establishment.id,
        duration_years: formData.duration_years,
        semesters_count,
        formation_type: formData.formation_type,
        referentiel_pdf_url: formData.referentiel_pdf_url || null,
      };

      await formationService.createFormation(formationData as any);

      toast.success('Formation créée. Vous pouvez maintenant ajouter des modules et créer une promotion.');
      onSuccess();
      onClose();

      setFormData({
        title: '',
        description: '',
        level: 'BAC+1',
        status: 'Actif',
        color: '#8B5CF6',
        duration: 0,
        duration_years: 1,
        formation_type: 'presentiel',
        referentiel_pdf_url: '',
      });
    } catch (err: any) {
      console.error('Erreur lors de la création de la formation:', err);
      setError(err?.message || 'Erreur lors de la création de la formation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-primary/20">
        <div className="flex items-center justify-between p-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            Nouvelle formation
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-primary/10 transition-colors"
            data-testid="formation-modal-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-muted/30 rounded-xl p-5 border-2 border-primary/10 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Informations générales</h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Titre de la formation *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 transition-all"
                required
                data-testid="formation-title-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2.5 border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  Durée (années) *
                </label>
                <Select
                  value={String(formData.duration_years)}
                  onValueChange={(v) => setFormData(p => ({ ...p, duration_years: parseInt(v) }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-2 border-primary/30" data-testid="formation-years-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 an</SelectItem>
                    <SelectItem value="2">2 ans</SelectItem>
                    <SelectItem value="3">3 ans</SelectItem>
                    <SelectItem value="4">4 ans</SelectItem>
                    <SelectItem value="5">5 ans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Durée (heures)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min={0}
                  className="w-full h-11 px-4 border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 transition-all"
                  data-testid="formation-hours-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Niveau</label>
                <Select value={formData.level} onValueChange={(v) => setFormData(p => ({ ...p, level: v }))}>
                  <SelectTrigger className="h-11 rounded-xl border-2 border-primary/30" data-testid="formation-level-select">
                    <SelectValue />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Type de formation *</label>
                <Select
                  value={formData.formation_type}
                  onValueChange={(v) => setFormData(p => ({ ...p, formation_type: v }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-2 border-primary/30" data-testid="formation-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presentiel">Présentiel</SelectItem>
                    <SelectItem value="foad">FOAD</SelectItem>
                    <SelectItem value="en_ligne">En ligne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Statut</label>
                <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-11 rounded-xl border-2 border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                    <SelectItem value="Brouillon">Brouillon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Référentiel PDF */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                Référentiel de formation (PDF, optionnel)
              </label>
              {!formData.referentiel_pdf_url ? (
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    data-testid="formation-referentiel-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPdf}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-sm font-medium text-primary hover:bg-primary/10 transition-all disabled:opacity-60"
                    data-testid="formation-referentiel-upload-btn"
                  >
                    {uploadingPdf ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Téléchargement...</>
                    ) : (
                      <><FileUp className="h-4 w-4" /> Importer un PDF</>
                    )}
                  </button>
                  <span className="text-xs text-muted-foreground">Max 10 Mo · Visualisable après l'import</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-primary/20 bg-primary/5">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm flex-1 truncate">{fileUploadService.getFileName(formData.referentiel_pdf_url)}</span>
                  <a
                    href={formData.referentiel_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="formation-referentiel-view-btn"
                  >
                    <Eye className="h-3.5 w-3.5" /> Voir
                  </a>
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                    title="Retirer le PDF"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <ColorPalette selectedColor={formData.color} onColorChange={(c) => setFormData(p => ({ ...p, color: c }))} />
            </div>
          </div>

          {/* Info: prochaines étapes */}
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 flex gap-3" data-testid="formation-next-steps-info">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-foreground mb-1">Prochaines étapes</p>
              <p className="text-muted-foreground">
                Après la création, ouvrez la formation pour ajouter ses <strong>modules</strong> (avec coefficients, formateurs, durées) puis créez une <strong>promotion</strong> (année académique, dates).
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-border/50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-foreground border-2 border-primary/30 rounded-xl hover:bg-primary/10 hover:border-primary/50 transition-colors font-medium"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md transition-all"
              data-testid="formation-submit-btn"
            >
              {loading ? 'Création...' : 'Créer la formation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFormationModal;
