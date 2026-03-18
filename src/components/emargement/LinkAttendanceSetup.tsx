import React, { useState, useEffect } from 'react';
import { Users, UserX, Check, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_photo_url?: string;
}

interface LinkAttendanceSetupProps {
  attendanceSheet: any;
  formationId: string;
  onBack: () => void;
  onLinksGenerated: () => void;
  isAdmin?: boolean;
}

const LinkAttendanceSetup: React.FC<LinkAttendanceSetupProps> = ({
  attendanceSheet,
  formationId,
  onBack,
  onLinksGenerated,
  isAdmin = false,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [absentStudentIds, setAbsentStudentIds] = useState<Set<string>>(new Set());
  const [instructorAbsent, setInstructorAbsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { userRole } = useCurrentUser();

  useEffect(() => {
    loadStudents();
  }, [formationId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase.rpc as any)('get_formation_students', {
        formation_id_param: formationId,
      });
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Erreur lors du chargement des étudiants');
    } finally {
      setLoading(false);
    }
  };

  const toggleAbsent = (studentId: string) => {
    setAbsentStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSendLinks = async () => {
    const presentStudents = students.filter((s) => !absentStudentIds.has(s.id));

    if (presentStudents.length === 0) {
      toast.error('Aucun étudiant présent pour envoyer les liens');
      return;
    }

    setSending(true);
    try {
      const sheetId = attendanceSheet.id;

      // 1. Mark instructor absent if needed
      if (instructorAbsent && isAdmin) {
        await supabase
          .from('attendance_sheets')
          .update({ instructor_absent: true })
          .eq('id', sheetId);
      }

      // 2. Open the attendance sheet for signing
      await supabase
        .from('attendance_sheets')
        .update({
          status: 'En cours',
          is_open_for_signing: true,
          opened_at: new Date().toISOString(),
        })
        .eq('id', sheetId);

      // 3. Mark absent students in attendance_signatures
      for (const studentId of Array.from(absentStudentIds)) {
        const { data: existing } = await supabase
          .from('attendance_signatures')
          .select('id')
          .eq('attendance_sheet_id', sheetId)
          .eq('user_id', studentId)
          .maybeSingle();

        if (!existing) {
          await supabase.from('attendance_signatures').insert({
            attendance_sheet_id: sheetId,
            user_id: studentId,
            user_type: 'student',
            present: false,
          });
        }
      }

      // 4. Generate unique tokens for present students
      const linksToInsert = presentStudents.map((s) => ({
        attendance_sheet_id: sheetId,
        student_id: s.id,
      }));

      const { data: insertedLinks, error: insertError } = await supabase
        .from('attendance_student_links' as any)
        .insert(linksToInsert)
        .select('id, token, student_id');

      if (insertError) throw insertError;

      // 5. Create in-app notifications for each present student
      const baseUrl = window.location.origin;
      for (const link of (insertedLinks as any[]) || []) {
        const student = presentStudents.find((s) => s.id === link.student_id);
        if (!student) continue;

        await supabase.from('notifications').insert({
          user_id: link.student_id,
          title: 'Lien d\'émargement disponible',
          message: `Vous avez un émargement à signer pour "${attendanceSheet.title}". Cliquez pour signer.`,
          type: 'emargement',
          link: `/suivi-emargement?link_token=${link.token}`,
        });
      }

      toast.success(
        `${presentStudents.length} lien(s) d'émargement envoyé(s) avec succès !`
      );
      onLinksGenerated();
    } catch (error: any) {
      console.error('Error sending links:', error);
      toast.error(`Erreur lors de l'envoi des liens: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const presentCount = students.length - absentStudentIds.size;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement des étudiants...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>
        <div>
          <h3 className="font-semibold text-foreground">Envoi des liens d'émargement</h3>
          <p className="text-xs text-muted-foreground">
            Cochez les étudiants absents, les présents recevront un lien unique
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <Check className="w-3 h-3 mr-1" />
          {presentCount} présent(s)
        </Badge>
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <UserX className="w-3 h-3 mr-1" />
          {absentStudentIds.size} absent(s)
        </Badge>
      </div>

      {/* Instructor absent toggle (admin only) */}
      {isAdmin && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-3 flex items-center gap-3">
            <Checkbox
              checked={instructorAbsent}
              onCheckedChange={() => setInstructorAbsent(!instructorAbsent)}
            />
            <div>
              <p className="text-sm font-medium text-orange-800">Formateur absent</p>
              <p className="text-xs text-orange-600">Cochez si le formateur est absent pour cette session</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students list */}
      <ScrollArea className="h-[350px] rounded-lg border border-border">
        <div className="space-y-1 p-2">
          {students.map((student) => {
            const isAbsent = absentStudentIds.has(student.id);
            return (
              <Card
                key={student.id}
                className={`cursor-pointer transition-all ${
                  isAbsent
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-green-200 bg-green-50/30 hover:bg-green-50/60'
                }`}
                onClick={() => toggleAbsent(student.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox
                    checked={isAbsent}
                    onCheckedChange={() => {}}
                    className="pointer-events-none"
                  />
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {student.first_name[0]}
                    {student.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isAbsent
                        ? 'bg-red-100 text-red-700 border-red-300'
                        : 'bg-green-100 text-green-700 border-green-300'
                    }
                  >
                    {isAbsent ? 'Absent' : 'Présent'}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Send button */}
      <Button
        onClick={handleSendLinks}
        disabled={sending || presentCount === 0}
        className="w-full rounded-xl h-11"
        size="lg"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Envoyer {presentCount} lien(s) d'émargement
          </>
        )}
      </Button>
    </div>
  );
};

export default LinkAttendanceSetup;
