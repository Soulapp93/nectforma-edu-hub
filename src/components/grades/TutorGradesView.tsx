import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, FileText, UserCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import StudentGradesView from './StudentGradesView';
import TranscriptsPanel from './TranscriptsPanel';

const TutorGradesView: React.FC = () => {
  const { userId } = useCurrentUser();

  // Get apprentice via tutor_student_assignments
  const { data: apprentice, isLoading } = useQuery({
    queryKey: ['tutor-apprentice-for-grades', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tutor_student_assignments')
        .select('student_id, users!tutor_student_assignments_student_id_fkey(first_name, last_name)')
        .eq('tutor_id', userId!)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.student_id,
        name: `${(data as any).users?.first_name || ''} ${(data as any).users?.last_name || ''}`.trim(),
      };
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!apprentice) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Aucun apprenti assigné</h3>
          <p className="text-sm text-muted-foreground">Aucun apprenti n'est actuellement lié à votre compte</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Notes de <span className="font-medium text-foreground">{apprentice.name}</span>
      </p>
      <Tabs defaultValue="notes" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="releves" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relevés
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notes">
          <StudentGradesView studentId={apprentice.id} />
        </TabsContent>
        <TabsContent value="releves">
          <TranscriptsPanel mode="student" studentId={apprentice.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TutorGradesView;
