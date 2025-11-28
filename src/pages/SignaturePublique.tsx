import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceService } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import SignaturePad from '@/components/ui/signature-pad';

interface StudentInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  hasSignature: boolean;
}

const SignaturePublique = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendanceSheet, setAttendanceSheet] = useState<any>(null);
  const [tokenValid, setTokenValid] = useState<any>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signing, setSigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Valider le token
      const validationData = await attendanceService.validateSignatureToken(token!);
      
      if (!validationData || !validationData.is_valid) {
        setTokenValid({ valid: false, expired: validationData?.expires_at ? new Date(validationData.expires_at) < new Date() : true });
        setLoading(false);
        return;
      }

      setTokenValid(validationData);

      // Charger la feuille d'émargement
      const sheet = await attendanceService.getAttendanceSheetByToken(token!);
      setAttendanceSheet(sheet);

      // Charger les étudiants de la formation
      const { data: enrolledStudents, error: studentsError } = await supabase
        .from('user_formation_assignments')
        .select(`
          user_id,
          users!inner(id, first_name, last_name, email)
        `)
        .eq('formation_id', sheet.formation_id);

      if (studentsError) throw studentsError;

      // Marquer les étudiants qui ont déjà signé
      const signedUserIds = sheet.attendance_signatures?.map((sig: any) => sig.user_id) || [];
      
      const studentsList: StudentInfo[] = enrolledStudents?.map((enrollment: any) => ({
        id: enrollment.users.id,
        first_name: enrollment.users.first_name,
        last_name: enrollment.users.last_name,
        email: enrollment.users.email,
        hasSignature: signedUserIds.includes(enrollment.users.id)
      })) || [];

      setStudents(studentsList);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student: StudentInfo) => {
    if (student.hasSignature) {
      toast.info('Cet étudiant a déjà signé');
      return;
    }
    setSelectedStudent(student);
    setShowSignature(true);
  };

  const handleSignature = async (signatureData: string) => {
    if (!selectedStudent || !attendanceSheet) return;

    try {
      setSigning(true);

      // Sauvegarder la signature
      await attendanceService.signAttendanceSheet(
        attendanceSheet.id,
        selectedStudent.id,
        'student',
        signatureData
      );

      toast.success('Signature enregistrée avec succès');

      // Recharger les données
      await loadData();
      setShowSignature(false);
      setSelectedStudent(null);
    } catch (error: any) {
      console.error('Error signing:', error);
      toast.error(error.message || 'Erreur lors de la signature');
    } finally {
      setSigning(false);
    }
  };

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const signedCount = students.filter(s => s.hasSignature).length;
  const pendingCount = students.length - signedCount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid || !tokenValid.is_valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Lien invalide ou expiré
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {tokenValid?.expired 
                ? 'Ce lien d\'émargement a expiré. Veuillez contacter l\'administration.'
                : 'Ce lien d\'émargement n\'est pas valide.'}
            </p>
            {tokenValid?.expires_at && (
              <p className="text-sm text-muted-foreground">
                Date d'expiration : {format(new Date(tokenValid.expires_at), 'PPP à HH:mm', { locale: fr })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSignature && selectedStudent) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Signature de {selectedStudent.first_name} {selectedStudent.last_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Session</p>
              <p className="text-lg">{tokenValid.formation_title}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(tokenValid.date), 'PPP', { locale: fr })} • {tokenValid.start_time.substring(0, 5)} - {tokenValid.end_time.substring(0, 5)}
              </p>
            </div>

            <SignaturePad
              onSave={handleSignature}
              onCancel={() => {
                setShowSignature(false);
                setSelectedStudent(null);
              }}
            />
            
            {signing && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                <span>Enregistrement en cours...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            Émargement en ligne
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations de la session */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-lg">{tokenValid.formation_title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(tokenValid.date), 'PPP', { locale: fr })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {tokenValid.start_time.substring(0, 5)} - {tokenValid.end_time.substring(0, 5)}
              </span>
            </div>
            {tokenValid.session_type === 'autonomie' && (
              <div className="mt-2 inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                Session en autonomie
              </div>
            )}
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{signedCount}</p>
              <p className="text-sm text-muted-foreground">Signés</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <AlertCircle className="h-5 w-5 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </div>

          {/* Recherche */}
          <div>
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-background"
            />
          </div>

          {/* Liste des étudiants */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredStudents.map((student) => (
              <Card key={student.id} className={student.hasSignature ? 'opacity-60' : ''}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{student.first_name} {student.last_name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  {student.hasSignature ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm">Signé</span>
                    </div>
                  ) : (
                    <Button onClick={() => handleStudentSelect(student)}>
                      Signer
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Aucun étudiant trouvé
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SignaturePublique;
