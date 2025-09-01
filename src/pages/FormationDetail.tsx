import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Users, FileText, Eye, Download, Edit, Plus } from 'lucide-react';
import { formationService, Formation } from '@/services/formationService';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ModuleDetail from '@/components/module/ModuleDetail';

const FormationDetail = () => {
  const { formationId } = useParams<{ formationId: string }>();
  const navigate = useNavigate();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  useEffect(() => {
    const fetchFormation = async () => {
      if (!formationId) return;
      
      try {
        setLoading(true);
        const data = await formationService.getFormationById(formationId);
        setFormation(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchFormation();
  }, [formationId]);

  const handleModuleClick = (module: any) => {
    setSelectedModule(module);
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (error || !formation) {
    return (
      <div className="p-8">
        <div className="text-red-600">Erreur: {error || 'Formation non trouvée'}</div>
        <Button onClick={() => navigate('/formations')} className="mt-4">
          Retour aux formations
        </Button>
      </div>
    );
  }

  // Si un module est sélectionné, afficher les détails du module
  if (selectedModule) {
    return (
      <ModuleDetail
        module={selectedModule}
        formationColor={formation.color || '#8B5CF6'}
        onBack={handleBackToModules}
      />
    );
  }

  const formationColor = formation.color || '#8B5CF6';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/formations')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux formations
        </Button>
      </div>

      {/* Header Section with Formation Color */}
      <div className="px-8 py-8">
        <div 
          className="rounded-xl p-8 text-white relative overflow-hidden"
          style={{ backgroundColor: formationColor }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {formation.level}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {formation.status}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-3">{formation.title}</h1>
              {formation.description && (
                <p className="text-white/90 text-lg mb-4">{formation.description}</p>
              )}
              <div className="flex items-center gap-6 text-white/90">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{formation.duration}h</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  <span>Max {formation.max_students} étudiants</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  <span>{formation.formation_modules?.length || 0} module{(formation.formation_modules?.length || 0) > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Users className="h-4 w-4 mr-2" />
                Voir participants
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-8 pb-8">
        <Tabs defaultValue="modules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="modules">
              <BookOpen className="h-4 w-4 mr-2" />
              Contenu du Module
            </TabsTrigger>
            <TabsTrigger value="evaluations">
              <FileText className="h-4 w-4 mr-2" />
              Devoirs & Évaluations
            </TabsTrigger>
            <TabsTrigger value="corrections">
              <Edit className="h-4 w-4 mr-2" />
              Corrections
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Modules de la formation</h2>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un module
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {formation.formation_modules && formation.formation_modules.length > 0 ? (
                  formation.formation_modules.map((module, index) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4" onClick={() => handleModuleClick(module)}>
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: formationColor }}
                          >
                            <BookOpen className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{module.title}</h3>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{module.duration_hours}h</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleModuleClick(module)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Accéder au module
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {module.description && (
                        <p className="text-gray-600 text-sm mt-2 ml-16">{module.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun module</h3>
                    <p className="text-gray-600">Cette formation n'a pas encore de modules.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evaluations">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Devoirs & Évaluations</h3>
              <p className="text-gray-600">Les évaluations seront affichées ici.</p>
            </div>
          </TabsContent>

          <TabsContent value="corrections">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Corrections</h3>
              <p className="text-gray-600">Les corrections seront affichées ici.</p>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Documents</h3>
              <p className="text-gray-600">Les documents seront affichés ici.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FormationDetail;
