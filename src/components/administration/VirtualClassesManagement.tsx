import React, { useState, useEffect } from 'react';
import { Video, Plus, RefreshCw, Trash2, Copy, ExternalLink, AlertCircle, CheckCircle2, Clock, XCircle, Settings2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useFormations } from '@/hooks/useFormations';
import { virtualClassService, VirtualClass, ZoomConnection, IntegrationLog } from '@/services/virtualClassService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const VirtualClassesManagement = () => {
  const { establishment } = useEstablishment();
  const { formations } = useFormations();
  const [activeTab, setActiveTab] = useState('classes');
  const [virtualClasses, setVirtualClasses] = useState<VirtualClass[]>([]);
  const [zoomConnection, setZoomConnection] = useState<ZoomConnection | null>(null);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showZoomSetup, setShowZoomSetup] = useState(false);
  const [showDetail, setShowDetail] = useState<VirtualClass | null>(null);

  useEffect(() => {
    if (establishment?.id) loadData();
  }, [establishment?.id]);

  const loadData = async () => {
    if (!establishment?.id) return;
    setLoading(true);
    try {
      const [classes, conn, logData] = await Promise.all([
        virtualClassService.getVirtualClasses(establishment.id),
        virtualClassService.getZoomConnection(establishment.id),
        virtualClassService.getIntegrationLogs(establishment.id),
      ]);
      setVirtualClasses(classes);
      setZoomConnection(conn);
      setLogs(logData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Lien copié dans le presse-papier');
  };

  const handleDelete = async (vc: VirtualClass) => {
    if (!confirm('Supprimer cette classe virtuelle ? La réunion Zoom sera également supprimée.')) return;
    try {
      await virtualClassService.deleteVirtualClass(vc.id, vc.establishment_id);
      toast.success('Classe virtuelle supprimée');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRetry = async (vc: VirtualClass) => {
    try {
      await virtualClassService.retrySync(vc.id, vc.establishment_id);
      toast.success('Synchronisation relancée');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced': return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3 mr-1" />Synchronisé</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertCircle className="w-3 h-3 mr-1" />Erreur</Badge>;
      case 'cancelled': return <Badge className="bg-muted text-muted-foreground"><XCircle className="w-3 h-3 mr-1" />Annulé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classes">Classes virtuelles</TabsTrigger>
          <TabsTrigger value="settings">Intégrations</TabsTrigger>
          <TabsTrigger value="logs">Journal</TabsTrigger>
        </TabsList>

        {/* ===== CLASSES TAB ===== */}
        <TabsContent value="classes" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {virtualClasses.length} classe{virtualClasses.length > 1 ? 's' : ''} virtuelle{virtualClasses.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4 mr-1" />Actualiser</Button>
              <Button size="sm" onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-1" />Nouvelle classe</Button>
            </div>
          </div>

          {virtualClasses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune classe virtuelle</h3>
                <p className="text-muted-foreground mb-4">Créez votre première classe virtuelle avec intégration Zoom.</p>
                <Button onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-1" />Créer une classe</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {virtualClasses.map((vc) => (
                <Card key={vc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate">{vc.title}</h4>
                          {getStatusBadge(vc.status)}
                          <Badge variant="outline" className="capitalize">{vc.provider}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(vc.scheduled_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })} — {vc.duration} min
                        </p>
                        {vc.error_message && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />{vc.error_message}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {vc.join_url && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleCopyLink(vc.join_url!)} title="Copier le lien">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" asChild title="Ouvrir">
                              <a href={vc.join_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                            </Button>
                          </>
                        )}
                        {vc.status === 'error' && (
                          <Button variant="ghost" size="icon" onClick={() => handleRetry(vc)} title="Relancer"><RefreshCw className="w-4 h-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setShowDetail(vc)} title="Détails"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(vc)} className="text-destructive" title="Supprimer"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== SETTINGS TAB ===== */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-500" />Zoom
              </CardTitle>
            </CardHeader>
            <CardContent>
              {zoomConnection ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium text-emerald-800 dark:text-emerald-300">Zoom connecté</p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Account ID : {zoomConnection.account_id}</p>
                        <p className="text-xs text-emerald-500">Connecté le {format(new Date(zoomConnection.connected_at), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={async () => {
                        try {
                          await virtualClassService.testZoomConnection(establishment!.id);
                          toast.success('Connexion Zoom vérifiée avec succès');
                        } catch (err: any) {
                          toast.error('Échec du test : ' + err.message);
                        }
                      }}>Tester</Button>
                      <Button variant="destructive" size="sm" onClick={async () => {
                        if (!confirm('Déconnecter Zoom ?')) return;
                        await virtualClassService.disconnectZoom(establishment!.id);
                        setZoomConnection(null);
                        toast.success('Zoom déconnecté');
                      }}>Déconnecter</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Video className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-4">Connectez votre compte Zoom pour créer des réunions automatiquement.</p>
                  <Button onClick={() => setShowZoomSetup(true)}>Connecter Zoom</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Future providers placeholder */}
          <Card className="opacity-60">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Video className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Microsoft Teams</p>
                  <p className="text-sm text-muted-foreground">Bientôt disponible</p>
                </div>
              </div>
              <Badge variant="outline">À venir</Badge>
            </CardContent>
          </Card>
          <Card className="opacity-60">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Video className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Google Meet</p>
                  <p className="text-sm text-muted-foreground">Bientôt disponible</p>
                </div>
              </div>
              <Badge variant="outline">À venir</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== LOGS TAB ===== */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Journal d'intégration</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune activité enregistrée.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</span>
                          <Badge variant="outline" className="text-xs capitalize">{log.provider}</Badge>
                          {log.status === 'error' && <Badge variant="destructive" className="text-xs">Erreur</Badge>}
                        </div>
                        {log.error_message && <p className="text-xs text-destructive mt-1">{log.error_message}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== CREATE MODAL ===== */}
      <CreateVirtualClassModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        establishmentId={establishment?.id || ''}
        formations={formations || []}
        zoomConnected={!!zoomConnection}
        onCreated={loadData}
      />

      {/* ===== ZOOM SETUP MODAL ===== */}
      <ZoomSetupModal
        open={showZoomSetup}
        onClose={() => setShowZoomSetup(false)}
        establishmentId={establishment?.id || ''}
        onConnected={(conn) => { setZoomConnection(conn); loadData(); }}
      />

      {/* ===== DETAIL MODAL ===== */}
      {showDetail && (
        <VirtualClassDetailModal
          open={!!showDetail}
          onClose={() => setShowDetail(null)}
          vc={showDetail}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

// ========== SUB-COMPONENTS ==========

const CreateVirtualClassModal = ({ open, onClose, establishmentId, formations, zoomConnected, onCreated }: {
  open: boolean;
  onClose: () => void;
  establishmentId: string;
  formations: any[];
  zoomConnected: boolean;
  onCreated: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [provider, setProvider] = useState<'zoom'>('zoom');
  const [formationId, setFormationId] = useState('');
  const [autoCreate, setAutoCreate] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title || !date || !time) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      await virtualClassService.createVirtualClass({
        establishment_id: establishmentId,
        title,
        description,
        scheduled_at: scheduledAt,
        duration: parseInt(duration),
        provider,
        formation_id: formationId || undefined,
        auto_create_meeting: autoCreate && zoomConnected,
      });
      toast.success('Classe virtuelle créée');
      onClose();
      onCreated();
      // Reset
      setTitle(''); setDescription(''); setDate(''); setTime('09:00'); setDuration('60'); setFormationId('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle classe virtuelle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Titre *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Cours de mathématiques" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Heure *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Durée (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1h</SelectItem>
                  <SelectItem value="90">1h30</SelectItem>
                  <SelectItem value="120">2h</SelectItem>
                  <SelectItem value="180">3h</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fournisseur</Label>
              <Select value={provider} onValueChange={(v: any) => setProvider(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom">Zoom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {formations.length > 0 && (
            <div>
              <Label>Formation (optionnel)</Label>
              <Select value={formationId} onValueChange={setFormationId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une formation" /></SelectTrigger>
                <SelectContent>
                  {formations.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {zoomConnected && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <p className="text-sm font-medium">Créer automatiquement la réunion Zoom</p>
                <p className="text-xs text-muted-foreground">Le lien sera généré automatiquement</p>
              </div>
              <Switch checked={autoCreate} onCheckedChange={setAutoCreate} />
            </div>
          )}
          {!zoomConnected && (
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              ⚠️ Zoom n'est pas connecté. La classe sera créée sans réunion Zoom. Configurez Zoom dans l'onglet Intégrations.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Création...' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ZoomSetupModal = ({ open, onClose, establishmentId, onConnected }: {
  open: boolean;
  onClose: () => void;
  establishmentId: string;
  onConnected: (conn: ZoomConnection) => void;
}) => {
  const [accountId, setAccountId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);

  const handleConnect = async () => {
    if (!accountId || !clientId || !clientSecret) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setSaving(true);
    try {
      const conn = await virtualClassService.saveZoomConnection(establishmentId, {
        account_id: accountId,
        client_id: clientId,
        client_secret: clientSecret,
      });

      // Test the connection
      try {
        await virtualClassService.testZoomConnection(establishmentId);
        toast.success('Zoom connecté et vérifié avec succès !');
      } catch {
        toast.success('Connexion enregistrée. Le test de connexion sera effectué lors de la prochaine utilisation.');
      }

      onConnected(conn);
      onClose();
      setAccountId(''); setClientId(''); setClientSecret('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />Connecter Zoom
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-2">
            <p className="font-medium text-blue-800 dark:text-blue-300">Configuration Server-to-Server OAuth</p>
            <ol className="list-decimal list-inside text-blue-700 dark:text-blue-400 space-y-1 text-xs">
              <li>Connectez-vous au <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer" className="underline">Zoom Marketplace</a></li>
              <li>Créez une application "Server-to-Server OAuth"</li>
              <li>Activez les scopes : <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">meeting:write:admin</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">meeting:read:admin</code></li>
              <li>Copiez les identifiants ci-dessous</li>
            </ol>
          </div>
          <div>
            <Label>Account ID *</Label>
            <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="Votre Account ID Zoom" />
          </div>
          <div>
            <Label>Client ID *</Label>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Votre Client ID" />
          </div>
          <div>
            <Label>Client Secret *</Label>
            <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="Votre Client Secret" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleConnect} disabled={saving}>
            {saving ? 'Connexion...' : 'Connecter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const VirtualClassDetailModal = ({ open, onClose, vc, onUpdate }: {
  open: boolean;
  onClose: () => void;
  vc: VirtualClass;
  onUpdate: () => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{vc.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Date & Heure</Label>
              <p className="text-sm font-medium">{format(new Date(vc.scheduled_at), "dd/MM/yyyy 'à' HH:mm")}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Durée</Label>
              <p className="text-sm font-medium">{vc.duration} minutes</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Fournisseur</Label>
              <p className="text-sm font-medium capitalize">{vc.provider}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Statut</Label>
              <div className="mt-0.5">
                {vc.status === 'synced' && <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />Synchronisé</Badge>}
                {vc.status === 'pending' && <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />En attente</Badge>}
                {vc.status === 'error' && <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Erreur</Badge>}
                {vc.status === 'cancelled' && <Badge variant="secondary">Annulé</Badge>}
              </div>
            </div>
          </div>
          {vc.description && (
            <div>
              <Label className="text-muted-foreground text-xs">Description</Label>
              <p className="text-sm">{vc.description}</p>
            </div>
          )}
          {vc.join_url && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <Label className="text-muted-foreground text-xs">Lien de participation</Label>
              <div className="flex items-center gap-2">
                <Input value={vc.join_url} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(vc.join_url!); toast.success('Copié'); }}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={vc.join_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                </Button>
              </div>
              {vc.password && (
                <p className="text-xs text-muted-foreground">Mot de passe : <span className="font-mono">{vc.password}</span></p>
              )}
            </div>
          )}
          {vc.error_message && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />{vc.error_message}
              </p>
            </div>
          )}
          {vc.last_sync_at && (
            <p className="text-xs text-muted-foreground">
              Dernière synchronisation : {format(new Date(vc.last_sync_at), 'dd/MM/yyyy HH:mm:ss')}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualClassesManagement;
