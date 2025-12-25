
import React, { useState } from 'react';
import { ArrowLeft, BookOpen, FileText, Edit, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModuleContentTab from './ModuleContentTab';
import ModuleAssignmentsTab from './ModuleAssignmentsTab';
import ModuleCorrectionsTab from './ModuleCorrectionsTab';
import ModuleDocumentsTab from './ModuleDocumentsTab';

interface ModuleDetailProps {
  module: {
    id: string;
    title: string;
    description?: string;
    duration_hours: number;
  };
  formationColor: string;
  onBack: () => void;
}

const ModuleDetail: React.FC<ModuleDetailProps> = ({ module, formationColor, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux modules
        </Button>
        
        <div 
          className="rounded-xl p-6 text-white"
          style={{ backgroundColor: formationColor }}
        >
          <h1 className="text-2xl font-bold mb-2">{module.title}</h1>
          {module.description && (
            <p className="text-white/90 mb-3">{module.description}</p>
          )}
          <span className="text-sm text-white/80">{module.duration_hours}h de formation</span>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-6 py-6">
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="content"
              className="rounded-full border-2 border-purple-500 text-purple-600 bg-transparent hover:bg-purple-50 data-[state=active]:bg-purple-500 data-[state=active]:text-white px-4 py-2"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Contenu</span>
            </TabsTrigger>
            <TabsTrigger 
              value="assignments"
              className="rounded-full border-2 border-purple-500 text-purple-600 bg-transparent hover:bg-purple-50 data-[state=active]:bg-purple-500 data-[state=active]:text-white px-4 py-2"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Devoirs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="corrections"
              className="rounded-full border-2 border-purple-500 text-purple-600 bg-transparent hover:bg-purple-50 data-[state=active]:bg-purple-500 data-[state=active]:text-white px-4 py-2"
            >
              <Edit className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Corr.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="rounded-full border-2 border-purple-500 text-purple-600 bg-transparent hover:bg-purple-50 data-[state=active]:bg-purple-500 data-[state=active]:text-white px-4 py-2"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Docs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <ModuleContentTab moduleId={module.id} />
          </TabsContent>

          <TabsContent value="assignments">
            <ModuleAssignmentsTab moduleId={module.id} />
          </TabsContent>

          <TabsContent value="corrections">
            <ModuleCorrectionsTab moduleId={module.id} />
          </TabsContent>

          <TabsContent value="documents">
            <ModuleDocumentsTab moduleId={module.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModuleDetail;
