import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Users, Edit, FileText, GraduationCap, BookText, UsersRound, FolderOpen, ClipboardCheck, Layers } from 'lucide-react';
import { formationService, Formation } from '@/services/formationService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModuleContentTab from '@/components/module/ModuleContentTab';
import ModuleAssignmentsTab from '@/components/module/ModuleAssignmentsTab';
import ModuleCorrectionsTab from '@/components/module/ModuleCorrectionsTab';
import ModuleDocumentsTab from '@/components/module/ModuleDocumentsTab';
import ModuleGroupsTab from '@/components/module/ModuleGroupsTab';
import ModuleTasksTab from '@/components/module/ModuleTasksTab';
import CreateAttendanceSessionModal from '@/components/emargement/CreateAttendanceSessionModal';
import FormationParticipantsModal from '@/components/administration/FormationParticipantsModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { semesterMatchesFilter, getSemesterBadgeLabel } from '@/utils/semesterUtils';

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
  const [instructors, setInstructors] = useState<FormationInstructor[]>([]);
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const { userRole } = useCurrentUser();

  // Get navigation context
  const from = searchParams.get('from') || 'formations';

  useEffect(() => {
    const fetchFormation = async () => {
      if (!formationId) return;
      
      try {
        setLoading(true);
        const [formationData, instructorsData] = await Promise.all([
          formationService.getFormationById(formationId),
          formationService.getFormationInstructors(formationId),
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

  // Semester navigation logic (must be before early returns)
  const durationYears = (formation as any)?.duration_years || 1;
  const semestersCount = (formation as any)?.semesters_count || durationYears * 2;
  const hasSemesters = semestersCount > 0 && formation?.formation_modules?.some((m: any) => m.semester);

  const filteredModules = useMemo(() => {
    if (!formation?.formation_modules) return [];
    if (semesterFilter === 'all') return formation.formation_modules;
    const semNum = parseInt(semesterFilter.replace('s', ''));
    return formation.formation_modules.filter((m: any) => 
      semesterMatchesFilter(m.semester, [semNum])
    );
  }, [formation?.formation_modules, semesterFilter]);

  // No UE grouping anymore - flat module list
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  // Get appropriate back navigation based on user role
  const getBackNavigation = () => {
    const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
    if (from === 'administration' && isAdmin) {
      return { path: '/administration?tab=formations', label: 'Retour à l\'administration' };
    }
    return { path: '/formations', label: 'Retour aux formations' };
  };

  const backNav = getBackNavigation();

  if (error || !formation) {
    return (
      <div className="p-8">
        <div className="text-destructive">Erreur: {error || 'Formation non trouvée'}</div>
        <Button onClick={() => navigate(backNav.path)} className="mt-4">
          {backNav.label}
        </Button>
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

      {/* Header Section with Formation Color */}
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
                  {formation.status}
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
                  <span>{formation.formation_modules?.length || 0} matière{(formation.formation_modules?.length || 0) > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 lg:mt-0">
              {/* Masquer "Voir participants" pour les tuteurs */}
              {userRole !== 'Tuteur' && (
                <Button 
                  variant="secondary" 
                  onClick={() => setShowParticipantsModal(true)}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs sm:text-sm w-full sm:w-auto justify-center"
                >
                  <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">Voir participants</span>
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

      {/* Matières Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg border border-primary/10">
          <div className="p-4 sm:p-6 border-b border-primary/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Matières</h2>
                <Badge variant="outline" className="text-[10px]">
                  {filteredModules.length} matière{filteredModules.length > 1 ? 's' : ''}
                </Badge>
              </div>
              {hasSemesters && (
                <div className="flex flex-wrap items-center gap-1.5 bg-muted/50 rounded-xl p-1.5">
                  <button
                    onClick={() => setSemesterFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      semesterFilter === 'all' 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    Tous
                  </button>
                  {Array.from({ length: durationYears }, (_, y) => {
                    const s1 = y * 2 + 1;
                    const s2 = y * 2 + 2;
                    const yearNum = y + 1;
                    return (
                      <React.Fragment key={yearNum}>
                        {durationYears > 1 && (
                          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider ml-1">A{yearNum}</span>
                        )}
                        <button
                          onClick={() => setSemesterFilter(`s${s1}`)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            semesterFilter === `s${s1}` 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          S{s1}
                        </button>
                        <button
                          onClick={() => setSemesterFilter(`s${s2}`)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            semesterFilter === `s${s2}` 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          S{s2}
                        </button>
                        {yearNum < durationYears && (
                          <div className="w-px h-5 bg-border mx-0.5" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {filteredModules.length > 0 ? (
              <Accordion type="multiple" className="space-y-2.5">
                {filteredModules.map((module: any) => (
                  <AccordionItem key={module.id} value={`module-${module.id}`} className="border border-primary/10 rounded-xl bg-card shadow-sm overflow-hidden">
                    <AccordionTrigger className="px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-muted/30 rounded-xl [&[data-state=open]]:rounded-b-none transition-colors">
                      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 w-full">
                        <div 
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md"
                          style={{ 
                            background: `linear-gradient(135deg, ${formationColor}, ${formationColor}dd)`,
                          }}
                        >
                          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-foreground text-sm sm:text-base break-words">{module.title}</h4>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">coef {module.coefficient || 1}</Badge>
                                {(module as any).semester && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{getSemesterBadgeLabel((module as any).semester)}</Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center text-xs sm:text-sm text-muted-foreground mt-1 gap-2 sm:gap-3">
                                {instructors.length > 0 && (
                                  <span className="flex items-center text-primary font-medium">
                                    Formateur: {instructors.map(i => `${i.first_name} ${i.last_name}`).join(', ')}
                                  </span>
                                )}
                                <span className="flex items-center bg-muted/50 px-2 py-0.5 rounded-full">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-primary" />
                                  <span>{module.duration_hours}h</span>
                                </span>
                              </div>
                            </div>
                            {(userRole === 'Formateur' || userRole === 'Admin' || userRole === 'AdminPrincipal') && (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setShowAttendanceModal(true);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setShowAttendanceModal(true);
                                  }
                                }}
                                className="inline-flex items-center justify-center mt-2 sm:mt-0 sm:ml-4 shrink-0 text-xs sm:text-sm w-full sm:w-auto border border-primary/30 hover:bg-primary/5 hover:border-primary/50 rounded-md px-3 py-2 cursor-pointer transition-colors"
                              >
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Créer une session d'émargement</span>
                                <span className="sm:hidden">Émargement</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <div className="border-t border-primary/10 bg-gradient-to-b from-muted/20 to-transparent">
                        <Tabs defaultValue="content" className="w-full">
                          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 !bg-transparent !p-4 !h-auto !rounded-none !border-0 !shadow-none">
                            <TabsTrigger
                              value="content"
                              className="!rounded-full !border-2 !border-primary/30 !bg-card !text-primary shadow-sm hover:bg-primary/5 hover:!border-primary/50 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!border-primary data-[state=active]:shadow-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-all"
                              data-testid="tab-content"
                            >
                              <BookOpen className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Support de cours</span>
                              <span className="sm:hidden">Support</span>
                            </TabsTrigger>
                            <TabsTrigger
                              value="documents"
                              className="!rounded-full !border-2 !border-primary/30 !bg-card !text-primary shadow-sm hover:bg-primary/5 hover:!border-primary/50 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!border-primary data-[state=active]:shadow-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-all"
                              data-testid="tab-documents"
                            >
                              <FolderOpen className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Ressources péd.</span>
                              <span className="sm:hidden">Ressources</span>
                            </TabsTrigger>
                            <TabsTrigger
                              value="tasks"
                              className="!rounded-full !border-2 !border-primary/30 !bg-card !text-primary shadow-sm hover:bg-primary/5 hover:!border-primary/50 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!border-primary data-[state=active]:shadow-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-all"
                              data-testid="tab-tasks"
                            >
                              <ClipboardCheck className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Travail à faire</span>
                              <span className="sm:hidden">Travail</span>
                            </TabsTrigger>
                            <TabsTrigger
                              value="assignments"
                              className="!rounded-full !border-2 !border-primary/30 !bg-card !text-primary shadow-sm hover:bg-primary/5 hover:!border-primary/50 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!border-primary data-[state=active]:shadow-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-all"
                              data-testid="tab-assignments"
                            >
                              <FileText className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Évaluations</span>
                              <span className="sm:hidden">Éval.</span>
                            </TabsTrigger>
                            <TabsTrigger
                              value="corrections"
                              className="!rounded-full !border-2 !border-primary/30 !bg-card !text-primary shadow-sm hover:bg-primary/5 hover:!border-primary/50 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!border-primary data-[state=active]:shadow-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-all"
                              data-testid="tab-corrections"
                            >
                              <Edit className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Correction éval.</span>
                              <span className="sm:hidden">Corr.</span>
                            </TabsTrigger>
                            <TabsTrigger
                              value="groups"
                              className="!rounded-full !border-2 !border-primary/30 !bg-card !text-primary shadow-sm hover:bg-primary/5 hover:!border-primary/50 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:!border-primary data-[state=active]:shadow-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-all"
                              data-testid="tab-groups"
                            >
                              <UsersRound className="h-4 w-4 sm:mr-2" />
                              Groupes
                            </TabsTrigger>
                          </TabsList>
                          
                          <div className="p-4 sm:p-5 bg-card/30">
                            <TabsContent value="content" className="mt-0">
                              <ModuleContentTab moduleId={module.id} />
                            </TabsContent>

                            <TabsContent value="documents" className="mt-0">
                              <ModuleDocumentsTab moduleId={module.id} />
                            </TabsContent>

                            <TabsContent value="tasks" className="mt-0">
                              <ModuleTasksTab moduleId={module.id} />
                            </TabsContent>

                            <TabsContent value="assignments" className="mt-0">
                              <ModuleAssignmentsTab moduleId={module.id} />
                            </TabsContent>
                            
                            <TabsContent value="corrections" className="mt-0">
                              <ModuleCorrectionsTab moduleId={module.id} />
                            </TabsContent>

                            <TabsContent value="groups" className="mt-0">
                              <ModuleGroupsTab moduleId={module.id} formationId={formation?.id || ''} />
                            </TabsContent>
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
                <h3 className="text-lg font-semibold text-foreground mb-2">Aucune matière</h3>
                <p className="text-muted-foreground">
                  {semesterFilter !== 'all' 
                    ? `Aucune matière assignée au semestre ${semesterFilter.replace('s', 'S')}.`
                    : "Cette formation n'a pas encore de matières — modifiez la formation pour en ajouter."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal pour créer une session d'émargement */}
      {formation && (
        <CreateAttendanceSessionModal
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          formationId={formation.id}
          formationTitle={formation.title}
          formationColor={formationColor}
        />
      )}

      {/* Modal pour voir les participants */}
      {formation && (
        <FormationParticipantsModal
          isOpen={showParticipantsModal}
          onClose={() => setShowParticipantsModal(false)}
          formationId={formation.id}
          formationTitle={formation.title}
          formationColor={formationColor}
        />
      )}
    </div>
  );
};

export default FormationDetail;
