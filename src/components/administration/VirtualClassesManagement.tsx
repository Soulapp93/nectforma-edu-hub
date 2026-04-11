import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useFormations } from '@/hooks/useFormations';
import { virtualClassService, VirtualClass, ZoomConnection, IntegrationLog } from '@/services/virtualClassService';

import { VirtualClassList } from '@/components/virtual-classes/VirtualClassList';
import { ZoomIntegrationPanel } from '@/components/virtual-classes/ZoomIntegrationPanel';
import { IntegrationLogsPanel } from '@/components/virtual-classes/IntegrationLogsPanel';
import { CreateVirtualClassModal } from '@/components/virtual-classes/CreateVirtualClassModal';
import { ZoomSetupModal } from '@/components/virtual-classes/ZoomSetupModal';
import { VirtualClassDetailModal } from '@/components/virtual-classes/VirtualClassDetailModal';

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
    toast.success('Lien copie dans le presse-papier');
  };

  const handleDelete = async (vc: VirtualClass) => {
    if (!confirm('Supprimer cette classe virtuelle ? La reunion Zoom sera egalement supprimee.')) return;
    try {
      await virtualClassService.deleteVirtualClass(vc.id, vc.establishment_id);
      toast.success('Classe virtuelle supprimee');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRetry = async (vc: VirtualClass) => {
    try {
      await virtualClassService.retrySync(vc.id, vc.establishment_id);
      toast.success('Synchronisation relancee');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6" data-testid="virtual-classes-management">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classes">Classes virtuelles</TabsTrigger>
          <TabsTrigger value="settings">Integrations</TabsTrigger>
          <TabsTrigger value="logs">Journal</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <VirtualClassList
            virtualClasses={virtualClasses}
            onCopyLink={handleCopyLink}
            onDelete={handleDelete}
            onRetry={handleRetry}
            onShowDetail={(vc) => setShowDetail(vc)}
            onRefresh={loadData}
            onCreateNew={() => setShowCreateModal(true)}
          />
        </TabsContent>

        <TabsContent value="settings">
          <ZoomIntegrationPanel
            zoomConnection={zoomConnection}
            establishmentId={establishment?.id || ''}
            onDisconnected={() => { setZoomConnection(null); }}
            onSetupClick={() => setShowZoomSetup(true)}
          />
        </TabsContent>

        <TabsContent value="logs">
          <IntegrationLogsPanel logs={logs} />
        </TabsContent>
      </Tabs>

      <CreateVirtualClassModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        establishmentId={establishment?.id || ''}
        formations={formations || []}
        zoomConnected={!!zoomConnection}
        onCreated={loadData}
      />

      <ZoomSetupModal
        open={showZoomSetup}
        onClose={() => setShowZoomSetup(false)}
        establishmentId={establishment?.id || ''}
        onConnected={(conn) => { setZoomConnection(conn); loadData(); }}
      />

      {showDetail && (
        <VirtualClassDetailModal
          open={!!showDetail}
          onClose={() => setShowDetail(null)}
          vc={showDetail}
        />
      )}
    </div>
  );
};

export default VirtualClassesManagement;
