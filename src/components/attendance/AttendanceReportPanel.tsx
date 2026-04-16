import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/hooks/useEstablishment';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileBarChart, Search, ArrowLeft, ChevronRight, Users, Calendar,
  GraduationCap, BookOpen, Clock, Download, Loader2, CheckCircle,
  XCircle, AlertTriangle, UserCheck,
} from 'lucide-react';

const getLevelColor = (level?: string) => {
  const colors: Record<string, string> = {
    'BAC+1': 'bg-purple-100 text-purple-800', 'BAC+2': 'bg-blue-100 text-blue-800',
    'BAC+3': 'bg-green-100 text-green-800', 'BAC+4': 'bg-orange-100 text-orange-800',
    'BAC+5': 'bg-red-100 text-red-800',
  };
  return colors[level || ''] || 'bg-muted text-muted-foreground';
};

interface AttendanceRecord {
  date: string;
  title: string;
  start_time: string;
  end_time: string;
  present: boolean | null;
  signed_at: string | null;
  absence_reason: string | null;
  absence_reason_type: string | null;
  delay_minutes: number | null;
  room: string | null;
  session_type: string | null;
}

const AttendanceReportPanel: React.FC = () => {
  const { establishment } = useEstablishment();
  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportStudentId, setReportStudentId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Formations
  const { data: formations = [], isLoading } = useQuery({
    queryKey: ['report-formations', establishment?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('formations')
        .select('id, title, status, color, level, start_date, end_date, academic_year, duration_years, formation_modules(id)')
        .eq('establishment_id', establishment?.id || '')
        .order('title');
      return data || [];
    },
    enabled: !!establishment?.id,
  });

  const { data: studentCounts = {} } = useQuery({
    queryKey: ['report-student-counts', formations.map((f: any) => f.id).join(',')],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const f of formations) {
        const { count } = await supabase.from('user_formation_assignments').select('id', { count: 'exact', head: true }).eq('formation_id', f.id);
        counts[f.id] = count || 0;
      }
      return counts;
    },
    enabled: formations.length > 0,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['report-students', selectedFormationId],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_formation_students', { formation_id_param: selectedFormationId! });
      return (data || []).sort((a: any, b: any) => (a.last_name || '').localeCompare(b.last_name || ''));
    },
    enabled: !!selectedFormationId,
  });

  const selectedFormation = formations.find((f: any) => f.id === selectedFormationId);
  const reportStudent = students.find((s: any) => s.user_id === reportStudentId);

  // Attendance data for report
  const { data: attendanceData = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['report-attendance', reportStudentId, selectedFormationId, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('attendance_signatures')
        .select('present, signed_at, absence_reason, absence_reason_type, delay_minutes, attendance_sheets!inner(id, date, title, start_time, end_time, room, session_type, formation_id)')
        .eq('user_id', reportStudentId!)
        .eq('attendance_sheets.formation_id', selectedFormationId!)
        .order('signed_at', { ascending: false });

      if (dateFrom) query = query.gte('attendance_sheets.date', dateFrom);
      if (dateTo) query = query.lte('attendance_sheets.date', dateTo);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((r: any) => ({
        date: r.attendance_sheets?.date,
        title: r.attendance_sheets?.title || '',
        start_time: r.attendance_sheets?.start_time || '',
        end_time: r.attendance_sheets?.end_time || '',
        present: r.present,
        signed_at: r.signed_at,
        absence_reason: r.absence_reason,
        absence_reason_type: r.absence_reason_type,
        delay_minutes: r.delay_minutes,
        room: r.attendance_sheets?.room,
        session_type: r.attendance_sheets?.session_type,
      })).sort((a: any, b: any) => (a.date || '').localeCompare(b.date || '')) as AttendanceRecord[];
    },
    enabled: !!reportStudentId && !!selectedFormationId && showReport,
  });

  // Stats
  const stats = useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter(r => r.present === true && !r.delay_minutes).length;
    const absent = attendanceData.filter(r => r.present === false || r.present === null).length;
    const late = attendanceData.filter(r => r.present === true && r.delay_minutes && r.delay_minutes > 0).length;
    const justified = attendanceData.filter(r => !r.present && r.absence_reason_type === 'justifiee').length;
    const presenceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, absent, late, justified, presenceRate };
  }, [attendanceData]);

  // Group formations
  const formationGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    formations.forEach((f: any) => {
      if (!groups[f.title]) groups[f.title] = [];
      groups[f.title].push(f);
    });
    Object.values(groups).forEach(g => g.sort((a: any, b: any) => (b.academic_year || '').localeCompare(a.academic_year || '')));
    return groups;
  }, [formations]);

  const programNames = useMemo(() => Object.keys(formationGroups).sort(), [formationGroups]);
  const filteredPrograms = useMemo(() => programNames.filter(n => n.toLowerCase().includes(searchTerm.toLowerCase())), [programNames, searchTerm]);

  // Generate PDF
  const handleGeneratePDF = async () => {
    if (!reportStudent || !selectedFormation || !establishment) return;
    setGenerating(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageW = doc.internal.pageSize.getWidth();
      let y = 15;

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(establishment.name || 'Etablissement', pageW / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Rapport d\'emargement', pageW / 2, y, { align: 'center' });
      y += 10;

      // Student info box
      doc.setDrawColor(200);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, y, pageW - 28, 32, 3, 3, 'FD');
      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Etudiant : ${reportStudent.first_name} ${reportStudent.last_name}`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Email : ${reportStudent.email || ''}`, pageW / 2 + 10, y);
      y += 6;
      doc.text(`Formation : ${(selectedFormation as any).title}`, 20, y);
      doc.text(`Niveau : ${(selectedFormation as any).level || ''}`, pageW / 2 + 10, y);
      y += 6;
      doc.text(`Annee : ${(selectedFormation as any).academic_year || ''}`, 20, y);
      const periodLabel = dateFrom && dateTo ? `Du ${format(new Date(dateFrom), 'dd/MM/yyyy')} au ${format(new Date(dateTo), 'dd/MM/yyyy')}` : 'Toutes les dates';
      doc.text(`Periode : ${periodLabel}`, pageW / 2 + 10, y);
      y += 12;

      // Stats dashboard
      const statBoxW = (pageW - 28 - 12) / 4;
      const statsArr = [
        { label: 'Taux de presence', value: `${stats.presenceRate}%`, color: [16, 185, 129] },
        { label: 'Presences', value: `${stats.present}`, color: [34, 197, 94] },
        { label: 'Absences', value: `${stats.absent}`, color: [239, 68, 68] },
        { label: 'Retards', value: `${stats.late}`, color: [245, 158, 11] },
      ];
      statsArr.forEach((s, i) => {
        const x = 14 + i * (statBoxW + 4);
        doc.setFillColor(s.color[0], s.color[1], s.color[2]);
        doc.roundedRect(x, y, statBoxW, 16, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(s.value, x + statBoxW / 2, y + 8, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(s.label, x + statBoxW / 2, y + 13, { align: 'center' });
      });
      doc.setTextColor(0, 0, 0);
      y += 24;

      // Table
      const tableData = attendanceData.map((r, idx) => [
        String(idx + 1),
        r.date ? format(new Date(r.date), 'dd/MM/yyyy') : '',
        r.title,
        `${(r.start_time || '').substring(0, 5)} - ${(r.end_time || '').substring(0, 5)}`,
        r.present ? (r.delay_minutes ? `Retard (${r.delay_minutes}min)` : 'Present') : 'Absent',
        r.absence_reason_type === 'justifiee' ? 'Justifiee' : r.absence_reason_type === 'injustifiee' ? 'Injustifiee' : r.present ? '' : 'Non justifiee',
        r.room || '',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['#', 'Date', 'Session', 'Horaires', 'Statut', 'Justification', 'Salle']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [26, 26, 46], textColor: [245, 158, 11], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 4) {
            const val = data.cell.raw as string;
            if (val === 'Present') data.cell.styles.textColor = [16, 185, 129];
            else if (val === 'Absent') data.cell.styles.textColor = [239, 68, 68];
            else if (val.startsWith('Retard')) data.cell.styles.textColor = [245, 158, 11];
          }
        },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const finalY = (doc as any).lastAutoTable?.finalY || y + 20;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Document genere le ${format(new Date(), "dd/MM/yyyy 'a' HH:mm")} — ${establishment.name}`, pageW / 2, finalY + 10, { align: 'center' });

      const fileName = `rapport-emargement-${reportStudent.last_name}-${reportStudent.first_name}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      toast.success('Rapport PDF genere avec succes');
    } catch (err: any) {
      console.error(err);
      toast.error('Erreur lors de la generation du PDF');
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) return <LoadingState message="Chargement des formations..." />;

  // ============ Level 3: Student report ============
  if (showReport && reportStudent && selectedFormation) {
    return (
      <div className="space-y-4" data-testid="report-detail">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { setShowReport(false); setReportStudentId(null); }}>
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <div>
            <h2 className="text-sm font-semibold">{reportStudent.first_name} {reportStudent.last_name}</h2>
            <p className="text-xs text-muted-foreground">{(selectedFormation as any).title} - {(selectedFormation as any).academic_year}</p>
          </div>
          <div className="ml-auto">
            <Button size="sm" className="gap-1.5" onClick={handleGeneratePDF} disabled={generating || loadingAttendance} data-testid="generate-pdf-btn">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Telecharger le rapport PDF
            </Button>
          </div>
        </div>

        {/* Date filters */}
        <Card>
          <CardContent className="p-3 flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Date debut</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs w-40" data-testid="date-from" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date fin</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs w-40" data-testid="date-to" />
            </div>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setDateFrom(''); setDateTo(''); }}>Reinitialiser</Button>
            )}
            <p className="text-xs text-muted-foreground ml-auto">{attendanceData.length} seance(s) trouvee(s)</p>
          </CardContent>
        </Card>

        {/* Stats dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{stats.presenceRate}%</p>
              <p className="text-[10px] text-muted-foreground">Taux de presence</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
              <p className="text-[10px] text-muted-foreground">Presences</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              <p className="text-[10px] text-muted-foreground">Absences</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
              <p className="text-[10px] text-muted-foreground">Retards</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.justified}</p>
              <p className="text-[10px] text-muted-foreground">Justifiees</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance table */}
        {loadingAttendance ? (
          <LoadingState message="Chargement des donnees..." />
        ) : attendanceData.length === 0 ? (
          <EmptyState icon={FileBarChart} title="Aucune donnee" description="Aucun emargement trouve pour cette periode." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="attendance-table">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 text-xs font-semibold">#</th>
                      <th className="text-left p-3 text-xs font-semibold">Date</th>
                      <th className="text-left p-3 text-xs font-semibold">Session</th>
                      <th className="text-left p-3 text-xs font-semibold">Horaires</th>
                      <th className="text-center p-3 text-xs font-semibold">Statut</th>
                      <th className="text-left p-3 text-xs font-semibold">Justification</th>
                      <th className="text-left p-3 text-xs font-semibold">Salle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((r, idx) => (
                      <tr key={idx} className={`border-t ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="p-3 text-xs text-muted-foreground">{idx + 1}</td>
                        <td className="p-3 text-xs font-medium">{r.date ? format(new Date(r.date), 'dd MMM yyyy', { locale: fr }) : ''}</td>
                        <td className="p-3 text-xs">{r.title}</td>
                        <td className="p-3 text-xs text-muted-foreground">{(r.start_time || '').substring(0, 5)} - {(r.end_time || '').substring(0, 5)}</td>
                        <td className="p-3 text-center">
                          {r.present ? (
                            r.delay_minutes ? (
                              <Badge className="bg-amber-100 text-amber-700 text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />Retard ({r.delay_minutes}min)</Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1"><CheckCircle className="h-3 w-3" />Present</Badge>
                            )
                          ) : (
                            <Badge className="bg-red-100 text-red-700 text-[10px] gap-1"><XCircle className="h-3 w-3" />Absent</Badge>
                          )}
                        </td>
                        <td className="p-3 text-xs">{r.absence_reason_type === 'justifiee' ? <Badge variant="outline" className="text-[10px]">Justifiee</Badge> : r.absence_reason_type === 'injustifiee' ? <Badge variant="outline" className="text-[10px] text-red-600 border-red-300">Injustifiee</Badge> : ''}</td>
                        <td className="p-3 text-xs text-muted-foreground">{r.room || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ============ Level 2: Students list ============
  if (selectedFormationId && selectedFormation) {
    return (
      <div className="space-y-4" data-testid="report-students">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setSelectedFormationId(null)}>
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: (selectedFormation as any).color || '#6366f1' }}>
              {(selectedFormation as any).title?.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-semibold">{(selectedFormation as any).title}</h2>
              <p className="text-xs text-muted-foreground">{(selectedFormation as any).academic_year} - {(selectedFormation as any).level}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase border-b bg-muted/30">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Etudiant</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-3 text-right">Action</div>
            </div>
            {students.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Aucun etudiant</div>
            ) : (
              <div className="divide-y">
                {students.map((s: any, idx: number) => (
                  <div key={s.user_id} className="px-4 py-2.5 hover:bg-muted/30 transition-colors" data-testid={`student-row-${s.user_id}`}>
                    <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-xs text-muted-foreground">{idx + 1}</div>
                      <div className="col-span-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {(s.first_name?.[0] || '').toUpperCase()}{(s.last_name?.[0] || '').toUpperCase()}
                          </div>
                          <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                        </div>
                      </div>
                      <div className="col-span-4 text-xs text-muted-foreground">{s.email}</div>
                      <div className="col-span-3 text-right">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                          onClick={() => { setReportStudentId(s.user_id); setShowReport(true); }} data-testid={`report-btn-${s.user_id}`}>
                          <FileBarChart className="h-3 w-3" /> Rapport emargement
                        </Button>
                      </div>
                    </div>
                    {/* Mobile */}
                    <div className="sm:hidden flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setReportStudentId(s.user_id); setShowReport(true); }}>
                        <FileBarChart className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ Level 1: Formations list ============
  return (
    <div className="space-y-4" data-testid="report-formations-list">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FileBarChart className="h-5 w-5 text-primary" /></div>
          <div>
            <h2 className="font-semibold">Rapport d'emargement</h2>
            <p className="text-xs text-muted-foreground">Selectionnez une formation pour generer des rapports de presence</p>
          </div>
        </CardContent>
      </Card>

      {formations.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une formation..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" data-testid="report-search" />
        </div>
      )}

      {filteredPrograms.length === 0 ? (
        <EmptyState icon={FileBarChart} title="Aucune formation" description="Les formations apparaitront ici une fois creees." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map(name => {
            const group = formationGroups[name];
            const first = group[0];
            const totalStudents = group.reduce((sum: number, f: any) => sum + (studentCounts[f.id] || 0), 0);
            return (
              <Card key={name} className="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer group overflow-hidden"
                onClick={() => { if (group.length === 1) { setSelectedFormationId(group[0].id); setSelectedProgramName(name); } else { setSelectedProgramName(name); } }}
                data-testid={`formation-card-${name}`}>
                <div className="h-1.5" style={{ backgroundColor: first.color || '#6366f1' }} />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getLevelColor(first.level)} text-[10px]`}>{first.level}</Badge>
                    <Badge variant="outline" className="text-[10px]">{group.length} promotion{group.length > 1 ? 's' : ''}</Badge>
                  </div>
                  <h3 className="font-semibold text-sm">{name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span><Users className="h-3 w-3 inline mr-1" />{totalStudents} etudiant(s)</span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-1">
                      {group.length === 1 ? 'Voir les etudiants' : 'Voir les promotions'} <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Promotions sub-level for multi-promotion programs */}
      {selectedProgramName && !selectedFormationId && (
        <Dialog open={true} onOpenChange={() => setSelectedProgramName(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedProgramName} — Promotions</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(formationGroups[selectedProgramName] || []).map((f: any) => (
                <Card key={f.id} className="cursor-pointer hover:ring-2 hover:ring-primary/30" onClick={() => { setSelectedFormationId(f.id); }}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {f.academic_year && <Badge variant="outline" className="text-[10px]"><Calendar className="h-3 w-3 mr-1" />{f.academic_year}</Badge>}
                        <Badge className={`${getLevelColor(f.level)} text-[10px]`}>{f.level}</Badge>
                      </div>
                      <p className="text-sm font-medium">{f.title}</p>
                      <p className="text-xs text-muted-foreground"><Users className="h-3 w-3 inline mr-1" />{studentCounts[f.id] || 0} etudiant(s)</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AttendanceReportPanel;
