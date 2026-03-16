import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Users, Eye, Edit, FileText, GraduationCap, BookText, Plus, Copy, Calendar, Trash2, ChevronRight } from 'lucide-react';
import { formationService, Formation } from '@/services/formationService';
import { usePromotions } from '@/hooks/usePromotions';
import { promotionService, Promotion } from '@/services/promotionService';
import CreatePromotionModal from '@/components/administration/CreatePromotionModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModuleContentTab from '@/components/module/ModuleContentTab';
import ModuleAssignmentsTab from '@/components/module/ModuleAssignmentsTab';
import ModuleCorrectionsTab from '@/components/module/ModuleCorrectionsTab';
import ModuleDocumentsTab from '@/components/module/ModuleDocumentsTab';
import CreateAttendanceSessionModal from '@/components/emargement/CreateAttendanceSessionModal';
import FormationParticipantsModal from '@/components/administration/FormationParticipantsModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

interface FormationInstructor {
  id: string;
  first_name: string;
  last_name: string;
}

const FormationDetail = () => {
  const { formationId } = useParams<{ formationId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showCreatePromotionModal, setShowCreatePromotionModal] = useState(false);
  const [instructors, setInstructors] = useState<FormationInstructor[]>([]);
  const [activeTab, setActiveTab] = useState<'promotions' | 'modules'>('promotions');
  const { userRole } = useCurrentUser();

  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const from = searchParams.get('from') || 'formations';

  const { promotions, loading: promotionsLoading, refetch: refetchPromotions } = usePromotions(formationId);

  useEffect(() => {
    const fetchFormation = async () => {
      if (!formationId) return;
      try {
        setLoading(true);
        const [formationData, instructorsData] = await Promise.all([
          formationService.getFormationById(formationId),
          formationService.getFormationInstructors(formationId)
        ]);
        setFormation(formationData);
        setInstructors(instructorsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchFormation();
  }, [formationId]);

  const handleDeletePromotion = async (promotionId: string, promotionName: string) => {
    if (!confirm(`Supprimer la promotion "${promotionName}" ? Cette action est irréversible.`)) return;
    try {
      await promotionService.deletePromotion(promotionId);
      toast.success('Promotion supprimée');
      refetchPromotions();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  const getBackNavigation = () => {
    const isAdminUser = userRole === 'Admin' || userRole === 'AdminPrincipal';
    if (from === 'administration' && isAdminUser) {
      return { path: '/administration?tab=formations', label: 'Retour à l\'administration' };
    }
    return { path: '/formations', label: 'Retour aux formations' };
  };

  const backNav = getBackNavigation();

  if (error || !formation) {
    return (
      <div className="p-8">
        <div className="text-destructive">Erreur: {error || 'Formation non trouvée'}</div>
        <Button onClick={() => navigate(backNav.path)} className="mt-4">{backNav.label}</Button>
      </div>
    );
  }

  const formationColor = formation.color || '#8B5CF6';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Back Button */}
      <div className="bg-card/80 backdrop-blur-md border-b border-primary/10 px-8 py-4 shadow-sm">
        <Button 
          variant="ghost" 
          onClick={() => navigate(backNav.path)}
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {backNav.label}
        </Button>
      </div>

      {/* Header Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div 
          className="rounded-xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden"
          style={{ backgroundColor: formationColor }}
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
                  {formation.level}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
                  Programme permanent
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 break-words">{formation.title}</h1>
              {formation.description && (
                <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">{formation.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/90 text-sm sm:text-base">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                  <span>{formation.duration}h</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                  <span>{formation.formation_modules?.length || 0} module{(formation.formation_modules?.length || 0) > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                  <span>{promotions.length} promotion{promotions.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 lg:mt-0">
              {isAdmin && (
                <Button 
                  variant="secondary" 
                  onClick={() => setShowCreatePromotionModal(true)}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs sm:text-sm w-full sm:w-auto justify-center"
                >
                  <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">Nouvelle promotion</span>
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => navigate(`/cahier-texte/formation/${formation.id}?from=formations&formationId=${formation.id}`)}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs sm:text-sm w-full sm:w-auto justify-center"
              >
                <BookText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Cahier de texte</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Promotions / Modules */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg border border-primary/10">
          <div className="p-4 sm:p-6 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <Button
                variant={activeTab === 'promotions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('promotions')}
                className="rounded-xl"
              >
                <Users className="h-4 w-4 mr-2" />
                Promotions ({promotions.length})
              </Button>
              <Button
                variant={activeTab === 'modules' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('modules')}
                className="rounded-xl"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Modules ({formation.formation_modules?.length || 0})
              </Button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {activeTab === 'promotions' && (
              <>
                {promotionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement des promotions...</div>
                ) : promotions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-block p-6 rounded-2xl bg-muted/30 mb-4">
                      <Users className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Aucune promotion</h3>
                    <p className="text-muted-foreground mb-4">Créez votre première promotion pour inscrire des étudiants.</p>
                    {isAdmin && (
                      <Button onClick={() => setShowCreatePromotionModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer une promotion
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {promotions.map((promo) => (
                      <div
                        key={promo.id}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-primary/10 hover:border-primary/30 hover:shadow-md transition-all bg-card cursor-pointer group"
                        onClick={() => navigate(`/promotions/${promo.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                            style={{ backgroundColor: formationColor }}
                          >
                            <GraduationCap className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {promo.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(promo.start_date).toLocaleDateString('fr-FR')} - {new Date(promo.end_date).toLocaleDateString('fr-FR')}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {promo.students_count || 0} / {promo.capacity}
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={promo.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                                  : 'bg-muted text-muted-foreground border-border'
                                }
                              >
                                {promo.status === 'active' ? 'Active' : promo.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePromotion(promo.id, promo.name);
                              }}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'modules' && (
              <>
                {formation.formation_modules && formation.formation_modules.length > 0 ? (
                  <Accordion type="multiple" className="space-y-3">
                    {formation.formation_modules.map((module, index) => (
                      <AccordionItem key={module.id} value={`module-${module.id}`} className="border border-primary/10 rounded-xl bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                        <AccordionTrigger className="px-4 sm:px-5 py-4 sm:py-5 hover:bg-muted/30 rounded-xl [&[data-state=open]]:rounded-b-none transition-colors">
                          <div className="flex items-start sm:items-center space-x-4 w-full">
                            <div 
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-lg ring-2 ring-white/20"
                              style={{ 
                                background: `linear-gradient(135deg, ${formationColor}, ${formationColor}dd)`,
                                boxShadow: `0 4px 20px ${formationColor}40`
                              }}
                            >
                              <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                                <div className="min-w-0">
                                  <h3 className="font-bold text-foreground text-sm sm:text-base break-words">{module.title}</h3>
                                  <div className="flex flex-wrap items-center text-xs sm:text-sm text-muted-foreground mt-1.5 gap-2 sm:gap-3">
                                    <span className="flex items-center bg-muted/50 px-2 py-0.5 rounded-full">
                                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-primary" />
                                      <span>{module.duration_hours}h</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0 pb-0">
                          <div className="border-t border-primary/10 bg-gradient-to-b from-muted/20 to-transparent">
                            <Tabs defaultValue="content" className="w-full">
                              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-3 !bg-transparent !p-4 !h-auto !rounded-none !border-0 !shadow-none">
                                <TabsTrigger value="content" className="!rounded-full !border-2 !border-primary/30 !bg-card !text-primary shadow-sm hover:bg-primary/5 hover:!border-primary/50 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!border-primary data-[state=active]:shadow-lg px-4 py-3 text-xs sm:text-sm font-medium transition-all">
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Contenu
                                </TabsTrigger>
                                <TabsTrigger value="assignments" className="!rounded-full !border-2 !border-primary/30 !bg-card !text-primary shadow-sm hover:bg-primary/5 hover:!border-primary/50 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!border-primary data-[state=active]:shadow-lg px-4 py-3 text-xs sm:text-sm font-medium transition-all">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Devoirs
                                </TabsTrigger>
                                <TabsTrigger value="corrections" className="!rounded-full !border-2 !border-primary/30 !bg-card !text-primary shadow-sm hover:bg-primary/5 hover:!border-primary/50 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!border-primary data-[state=active]:shadow-lg px-4 py-3 text-xs sm:text-sm font-medium transition-all">
                                  <Users className="h-4 w-4 mr-2" />
                                  Corrections
                                </TabsTrigger>
                                <TabsTrigger value="documents" className="!rounded-full !border-2 !border-primary/30 !bg-card !text-primary shadow-sm hover:bg-primary/5 hover:!border-primary/50 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!border-primary data-[state=active]:shadow-lg px-4 py-3 text-xs sm:text-sm font-medium transition-all">
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Documents
                                </TabsTrigger>
                              </TabsList>
                              <div className="p-4 sm:p-5 bg-card/30">
                                <TabsContent value="content" className="mt-0"><ModuleContentTab moduleId={module.id} /></TabsContent>
                                <TabsContent value="assignments" className="mt-0"><ModuleAssignmentsTab moduleId={module.id} /></TabsContent>
                                <TabsContent value="corrections" className="mt-0"><ModuleCorrectionsTab moduleId={module.id} /></TabsContent>
                                <TabsContent value="documents" className="mt-0"><ModuleDocumentsTab moduleId={module.id} /></TabsContent>
                              </div>
                            </Tabs>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-block p-6 rounded-2xl bg-muted/30 mb-4">
                      <GraduationCap className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Aucun module</h3>
                    <p className="text-muted-foreground">Cette formation n'a pas encore de modules.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {formation && (
        <>
          <CreateAttendanceSessionModal
            isOpen={showAttendanceModal}
            onClose={() => setShowAttendanceModal(false)}
            formationId={formation.id}
            formationTitle={formation.title}
            formationColor={formationColor}
          />
          <FormationParticipantsModal
            isOpen={showParticipantsModal}
            onClose={() => setShowParticipantsModal(false)}
            formationId={formation.id}
            formationTitle={formation.title}
            formationColor={formationColor}
          />
          <CreatePromotionModal
            isOpen={showCreatePromotionModal}
            onClose={() => setShowCreatePromotionModal(false)}
            onSuccess={refetchPromotions}
            formationId={formation.id}
            formationTitle={formation.title}
            establishmentId={formation.establishment_id}
            existingPromotions={promotions}
          />
        </>
      )}
    </div>
  );
};

export default FormationDetail;
