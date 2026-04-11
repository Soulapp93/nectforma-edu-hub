import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, BookOpen, FileText, Clock, Edit2, Save, X, Upload, Trash2, Download, ExternalLink, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { dossierService, UserProfile, UserDocument } from '@/services/dossierService';
import { exportDossierPDF } from '@/services/dossierPdfExport';

interface Props {
  user: UserProfile;
  establishmentId: string;
  onBack: () => void;
}

export const DossierDetail: React.FC<Props> = ({ user, establishmentId, onBack }) => {
  const [profile, setProfile] = useState<UserProfile>(user);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const [formations, setFormations] = useState<any[]>([]);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [formateurModules, setFormateurModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState('autre');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAll();
  }, [user.id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [prof, fmts, docs] = await Promise.all([
        dossierService.getUserProfile(user.id),
        dossierService.getUserFormations(user.id),
        dossierService.getUserDocuments(user.id),
      ]);
      setProfile(prof);
      setFormations(fmts);
      setUserDocuments(docs);

      if (user.role === 'Étudiant') {
        const trans = await dossierService.getUserTranscripts(user.id);
        setTranscripts(trans);
      }

      if (user.role === 'Formateur') {
        const mods = await dossierService.getFormateurModules(user.id);
        setFormateurModules(mods);
      }

      // Contracts for both roles
      const ctrs = await dossierService.getUserContracts(user.id);
      setContracts(ctrs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setEditData({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      date_of_birth: profile.date_of_birth,
      gender: profile.gender,
      address: profile.address,
      city: profile.city,
      postal_code: profile.postal_code,
      country: profile.country,
      nationality: profile.nationality,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      await dossierService.updateUserProfile(user.id, editData);
      setProfile(prev => ({ ...prev, ...editData }));
      setEditing(false);
      toast.success('Dossier mis a jour');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle) {
      toast.error('Titre et fichier requis');
      return;
    }
    setUploading(true);
    try {
      await dossierService.uploadDocument(user.id, establishmentId, uploadFile, uploadType, uploadTitle);
      toast.success('Document ajoute');
      setShowUpload(false);
      setUploadTitle('');
      setUploadFile(null);
      setUploadType('autre');
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (doc: UserDocument) => {
    if (!confirm(`Supprimer "${doc.title}" ?`)) return;
    try {
      await dossierService.deleteDocument(doc.id);
      toast.success('Document supprime');
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

  const docTypeLabels: Record<string, string> = {
    contrat_alternance: 'Contrat alternance',
    contrat_stage: 'Contrat de stage',
    contrat_pro: 'Contrat pro.',
    convention: 'Convention',
    diplome: 'Diplome',
    releve_notes: 'Releve de notes',
    cv: 'CV',
    autre: 'Autre',
  };

  return (
    <div className="space-y-4" data-testid="dossier-detail">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="dossier-back-btn">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {profile.first_name?.[0]}{profile.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.first_name} {profile.last_name}</h2>
            <div className="flex items-center gap-2">
              <Badge>{profile.role}</Badge>
              <Badge variant={profile.status === 'Actif' ? 'default' : 'secondary'}>{profile.status}</Badge>
              <span className="text-sm text-muted-foreground">{profile.email}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportDossierPDF(profile, formations, transcripts, contracts, userDocuments, formateurModules)} data-testid="export-pdf-btn">
          <FileDown className="w-4 h-4 mr-1" />Exporter PDF
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="civil" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="civil" data-testid="tab-civil"><User className="w-4 h-4 mr-1 hidden sm:inline" />Infos civiles</TabsTrigger>
          <TabsTrigger value="pedagogique" data-testid="tab-pedagogique"><BookOpen className="w-4 h-4 mr-1 hidden sm:inline" />Pedagogique</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents"><FileText className="w-4 h-4 mr-1 hidden sm:inline" />Documents</TabsTrigger>
          <TabsTrigger value="historique" data-testid="tab-historique"><Clock className="w-4 h-4 mr-1 hidden sm:inline" />Historique</TabsTrigger>
        </TabsList>

        {/* Tab 1: Informations civiles */}
        <TabsContent value="civil">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Informations civiles</CardTitle>
              {editing ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} data-testid="save-civil-btn"><Save className="w-4 h-4 mr-1" />Sauvegarder</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={startEdit} data-testid="edit-civil-btn"><Edit2 className="w-4 h-4 mr-1" />Modifier</Button>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Prenom</Label><Input value={editData.first_name || ''} onChange={e => setEditData(p => ({...p, first_name: e.target.value}))} /></div>
                  <div><Label>Nom</Label><Input value={editData.last_name || ''} onChange={e => setEditData(p => ({...p, last_name: e.target.value}))} /></div>
                  <div><Label>Telephone</Label><Input value={editData.phone || ''} onChange={e => setEditData(p => ({...p, phone: e.target.value}))} /></div>
                  <div><Label>Date de naissance</Label><Input type="date" value={editData.date_of_birth || ''} onChange={e => setEditData(p => ({...p, date_of_birth: e.target.value}))} /></div>
                  <div><Label>Sexe</Label>
                    <Select value={editData.gender || ''} onValueChange={v => setEditData(p => ({...p, gender: v}))}>
                      <SelectTrigger><SelectValue placeholder="Selectionner" /></SelectTrigger>
                      <SelectContent><SelectItem value="M">Masculin</SelectItem><SelectItem value="F">Feminin</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Nationalite</Label><Input value={editData.nationality || ''} onChange={e => setEditData(p => ({...p, nationality: e.target.value}))} /></div>
                  <div className="md:col-span-2"><Label>Adresse</Label><Input value={editData.address || ''} onChange={e => setEditData(p => ({...p, address: e.target.value}))} /></div>
                  <div><Label>Ville</Label><Input value={editData.city || ''} onChange={e => setEditData(p => ({...p, city: e.target.value}))} /></div>
                  <div><Label>Code postal</Label><Input value={editData.postal_code || ''} onChange={e => setEditData(p => ({...p, postal_code: e.target.value}))} /></div>
                  <div><Label>Pays</Label><Input value={editData.country || ''} onChange={e => setEditData(p => ({...p, country: e.target.value}))} /></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <InfoRow label="Prenom" value={profile.first_name} />
                  <InfoRow label="Nom" value={profile.last_name} />
                  <InfoRow label="Email" value={profile.email} />
                  <InfoRow label="Telephone" value={profile.phone} />
                  <InfoRow label="Date de naissance" value={formatDate(profile.date_of_birth)} />
                  <InfoRow label="Sexe" value={profile.gender === 'M' ? 'Masculin' : profile.gender === 'F' ? 'Feminin' : profile.gender} />
                  <InfoRow label="Nationalite" value={profile.nationality} />
                  <InfoRow label="Adresse" value={[profile.address, profile.postal_code, profile.city].filter(Boolean).join(', ')} />
                  <InfoRow label="Pays" value={profile.country} />
                  <InfoRow label="Inscrit le" value={formatDate(profile.created_at)} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Informations pedagogiques */}
        <TabsContent value="pedagogique">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">{profile.role === 'Étudiant' ? 'Formations inscrites' : 'Formations dispensees'}</CardTitle></CardHeader>
              <CardContent>
                {formations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune formation associee</p>
                ) : (
                  <div className="space-y-3">
                    {formations.map((f: any) => (
                      <div key={f.formation_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div>
                          <p className="font-medium text-sm">{f.formations?.title || 'Formation'}</p>
                          <p className="text-xs text-muted-foreground">
                            {f.formations?.level} {f.formations?.formation_type ? `• ${f.formations.formation_type}` : ''}
                          </p>
                        </div>
                        {f.formations?.start_date && (
                          <Badge variant="outline" className="text-xs">
                            {formatDate(f.formations.start_date)} - {formatDate(f.formations.end_date)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {profile.role === 'Formateur' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Modules et specialites</CardTitle></CardHeader>
                <CardContent>
                  {formateurModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun module assigne</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(formateurModules.map((m: any) => m.formation_modules?.title).filter(Boolean))].map((title: string) => (
                        <Badge key={title} variant="secondary">{title}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {profile.role === 'Étudiant' && (
              <Card>
                <CardHeader><CardTitle className="text-base">Releves de notes</CardTitle></CardHeader>
                <CardContent>
                  {transcripts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun releve de notes</p>
                  ) : (
                    <div className="space-y-2">
                      {transcripts.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                          <div>
                            <p className="font-medium text-sm">{(t.formations as any)?.title || 'Formation'}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.evaluation_periods?.name || `Semestre ${t.semester_number}`} • {t.academic_year || ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={t.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                              {t.is_published ? 'Publie' : 'Brouillon'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Documents & Contrats */}
        <TabsContent value="documents">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Documents & Contrats</h3>
              <Button size="sm" onClick={() => setShowUpload(true)} data-testid="upload-doc-btn">
                <Upload className="w-4 h-4 mr-1" />Ajouter un document
              </Button>
            </div>

            {/* Contrats (from contracts table - both roles) */}
            {contracts.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Contrats</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {contracts.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div>
                          <p className="font-medium text-sm">{c.title || c.contract_type || 'Contrat'}</p>
                          <p className="text-xs text-muted-foreground">{c.contract_type} • {formatDate(c.start_date)} - {formatDate(c.end_date)}</p>
                        </div>
                        <Badge variant="outline">{c.is_active ? 'Actif' : 'Termine'}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User documents */}
            <Card>
              <CardHeader><CardTitle className="text-base">Documents deposes</CardTitle></CardHeader>
              <CardContent>
                {userDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun document depose. Cliquez sur "Ajouter un document" pour commencer.</p>
                ) : (
                  <div className="space-y-2">
                    {userDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50" data-testid={`doc-${doc.id}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-5 h-5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {docTypeLabels[doc.document_type] || doc.document_type} • {formatDate(doc.created_at)}
                              {doc.file_name && ` • ${doc.file_name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {doc.file_url && (
                            <Button variant="ghost" size="icon" asChild title="Telecharger">
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(doc)} className="text-destructive" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Historique */}
        <TabsContent value="historique">
          <Card>
            <CardHeader><CardTitle className="text-base">Historique & Tracabilite</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <TimelineItem date={profile.created_at} label="Inscription dans l'etablissement" />
                {formations.map((f: any) => (
                  <TimelineItem key={f.formation_id} date={f.formations?.start_date} label={`Affecte a : ${f.formations?.title || 'Formation'}`} />
                ))}
                {transcripts.map((t: any) => (
                  <TimelineItem key={t.id} date={t.created_at} label={`Releve de notes : ${(t.formations as any)?.title} - ${t.evaluation_periods?.name || `S${t.semester_number}`}`} />
                ))}
                {userDocuments.map(d => (
                  <TimelineItem key={d.id} date={d.created_at} label={`Document depose : ${d.title}`} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload modal */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type de document</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contrat_alternance">Contrat alternance</SelectItem>
                  <SelectItem value="contrat_stage">Contrat de stage</SelectItem>
                  <SelectItem value="contrat_pro">Contrat professionnalisation</SelectItem>
                  <SelectItem value="convention">Convention</SelectItem>
                  <SelectItem value="diplome">Diplome</SelectItem>
                  <SelectItem value="releve_notes">Releve de notes</SelectItem>
                  <SelectItem value="cv">CV</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Titre *</Label>
              <Input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Ex: Contrat alternance 2026" data-testid="doc-title-input" />
            </div>
            <div>
              <Label>Fichier *</Label>
              <input ref={fileInputRef} type="file" className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" onChange={e => setUploadFile(e.target.files?.[0] || null)} data-testid="doc-file-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Annuler</Button>
            <Button onClick={handleUpload} disabled={uploading} data-testid="doc-upload-btn">{uploading ? 'Upload...' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value || '—'}</p>
  </div>
);

const TimelineItem: React.FC<{ date?: string; label: string }> = ({ date, label }) => (
  <div className="flex items-start gap-3">
    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
    <div>
      <p className="text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">{date ? new Date(date).toLocaleDateString('fr-FR') : ''}</p>
    </div>
  </div>
);
