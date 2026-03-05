import React, { useState, useEffect } from 'react';
import { QrCode, Hash, Users, Clock, RefreshCw, Eye, EyeOff, Wifi, Calendar, MapPin, Timer } from 'lucide-react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AttendanceSheet } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QRCodeDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
}

const QRCodeDisplayModal: React.FC<QRCodeDisplayModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet
}) => {
  const [currentCode, setCurrentCode] = useState('');
  const [qrCodeImage, setQRCodeImage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [signedCount, setSignedCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [showCode, setShowCode] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const loadRealStats = async () => {
    try {
      let total = 0;
      const { data: ufaData } = await supabase
        .from('user_formation_assignments')
        .select('user_id')
        .eq('formation_id', attendanceSheet.formation_id);

      if (ufaData && ufaData.length > 0) {
        const userIds = ufaData.map((e: any) => e.user_id);
        const { data: usersData } = await supabase
          .from('users')
          .select('id, role')
          .in('id', userIds);
        if (usersData) {
          total = usersData.filter((user: any) => user.role === 'Étudiant').length;
        }
      }
      setTotalStudents(total);

      const { data: signatures } = await supabase
        .from('attendance_signatures')
        .select('user_id')
        .eq('attendance_sheet_id', attendanceSheet.id)
        .eq('user_type', 'student');
      setSignedCount(signatures?.length || 0);
    } catch (error) {
      console.error('Error loading real stats:', error);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadRealStats();

    const channel = supabase
      .channel(`qr_display_${attendanceSheet.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance_signatures',
        filter: `attendance_sheet_id=eq.${attendanceSheet.id}`
      }, (payload) => {
        if (payload.new.user_type === 'student') {
          setSignedCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, attendanceSheet.id]);

  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeRemaining]);

  const generateNewCode = async () => {
    setIsRegenerating(true);
    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const qrData = `${window.location.origin}/emargement-qr?code=${newCode}`;
      const qrImageUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      
      const { error } = await supabase
        .from('attendance_sheets')
        .update({ qr_code: newCode })
        .eq('id', attendanceSheet.id);
      if (error) throw error;

      setCurrentCode(newCode);
      setQRCodeImage(qrImageUrl);
      setTimeRemaining(30 * 60);
      toast.success('Nouveau code QR généré !');
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error('Erreur lors de la génération du code QR');
    } finally {
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) generateNewCode();
  }, [isOpen, attendanceSheet.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeRemaining / (30 * 60)) * 100;
  const attendanceRate = totalStudents > 0 ? Math.round((signedCount / totalStudents) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header fixe avec gradient */}
        <div className="shrink-0 bg-gradient-to-r from-primary via-primary/90 to-accent p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base sm:text-lg leading-tight">Session en cours</h2>
                <p className="text-white/70 text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[280px]">
                  {attendanceSheet.formations?.title}
                </p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse" />
              En direct
            </Badge>
          </div>
          
          {/* Info session compacte */}
          <div className="flex flex-wrap gap-3 mt-3 text-white/80 text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(attendanceSheet.date), 'd MMM yyyy', { locale: fr })}
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              {attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}
            </span>
            {attendanceSheet.room && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {attendanceSheet.room}
              </span>
            )}
          </div>
        </div>

        {/* Contenu scrollable */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 sm:p-5 space-y-4">
            
            {/* QR Code */}
            <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">QR Code d'émargement</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-40 h-40 sm:w-48 sm:h-48 bg-white border-2 border-border/30 rounded-2xl flex items-center justify-center shadow-sm">
                  {qrCodeImage ? (
                    <img src={qrCodeImage} alt="QR Code" className="w-36 h-36 sm:w-44 sm:h-44 object-contain" />
                  ) : (
                    <div className="w-36 h-36 bg-muted rounded-xl flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">Génération...</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Expire dans {formatTime(timeRemaining)}</span>
                </div>
                <Progress value={progressPercentage} className="h-1.5 w-full" />
              </div>
            </div>

            {/* Code numérique */}
            <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Code numérique</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowCode(!showCode)}>
                  {showCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <div className="text-center">
                {showCode ? (
                  <div className="text-3xl sm:text-4xl font-mono font-bold tracking-[0.3em] text-primary">
                    {currentCode || '------'}
                  </div>
                ) : (
                  <div className="text-3xl sm:text-4xl font-mono font-bold tracking-[0.3em] text-muted-foreground">
                    ••••••
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Les étudiants peuvent saisir ce code pour s'émarger
                </p>
              </div>
            </div>

            {/* Stats temps réel */}
            <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Émargement en temps réel</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-2 py-0.5">
                  <Wifi className="w-3 h-3 mr-1" />
                  Direct
                </Badge>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Étudiants émargés</span>
                <span className="text-xs font-semibold text-foreground">
                  {signedCount}/{totalStudents} ({attendanceRate}%)
                </span>
              </div>
              <Progress value={attendanceRate} className="h-2 mb-4" />

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50/80 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{signedCount}</div>
                  <div className="text-[11px] text-green-700 font-medium">Présents</div>
                </div>
                <div className="bg-orange-50/80 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600">{totalStudents - signedCount}</div>
                  <div className="text-[11px] text-orange-700 font-medium">En attente</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer fixe */}
        <div className="shrink-0 border-t border-border/50 p-3 sm:p-4 flex gap-2 bg-card">
          <Button
            variant="outline"
            onClick={generateNewCode}
            disabled={isRegenerating}
            className="flex-1 rounded-xl"
          >
            {isRegenerating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Nouveau code
          </Button>
          <Button onClick={onClose} className="flex-1 rounded-xl bg-primary hover:bg-primary/90">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplayModal;
