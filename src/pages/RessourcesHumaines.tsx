import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Users, FileText, Calendar, Wallet, Trash2, Edit, Check, X } from 'lucide-react';
import { useEstablishment } from '@/hooks/useEstablishment';
import * as rhService from '@/services/rhService';

const leaveTypeLabels: Record<string, string> = {
  paid_leave: 'Congé payé', sick_leave: 'Maladie', unpaid_leave: 'Sans solde',
  maternity: 'Maternité', paternity: 'Paternité', training: 'Formation', other: 'Autre',
};

const leaveStatusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning', approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive', cancelled: 'bg-muted text-muted-foreground',
};

const contractTypeLabels: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', interim: 'Intérim', freelance: 'Freelance',
  apprenticeship: 'Apprentissage', internship: 'Stage', other: 'Autre',
};

const RessourcesHumaines = () => {
  const { establishment } = useEstablishment();
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  // Forms
  const [employeeForm, setEmployeeForm] = useState({ first_name: '', last_name: '', email: '', phone: '', position: '', department: '', hire_date: '', gross_salary: '', net_salary: '' });
  const [contractForm, setContractForm] = useState({ employee_id: '', contract_type: 'CDI', title: '', start_date: '', end_date: '', weekly_hours: '35', gross_salary: '' });
  const [leaveForm, setLeaveForm] = useState({ employee_id: '', leave_type: 'paid_leave', start_date: '', end_date: '', days_count: '1', reason: '' });
  const [payslipForm, setPayslipForm] = useState({ employee_id: '', period_month: String(new Date().getMonth() + 1), period_year: String(new Date().getFullYear()), gross_salary: '', net_salary: '', employer_charges: '', employee_charges: '', bonuses: '0', deductions: '0' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [emp, con, lv, ps] = await Promise.all([
        rhService.getEmployees(),
        rhService.getContracts(),
        rhService.getLeaveRequests(),
        rhService.getPayslips(),
      ]);
      setEmployees(emp || []);
      setContracts(con || []);
      setLeaveRequests(lv || []);
      setPayslips(ps || []);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  const activeEmployees = employees.filter(e => e.is_active).length;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const totalMassSalariale = employees.filter(e => e.is_active).reduce((s, e) => s + Number(e.gross_salary || 0), 0);
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  const handleSaveEmployee = async () => {
    try {
      if (!employeeForm.first_name || !employeeForm.last_name) { toast.error('Nom et prénom requis'); return; }
      const data = { ...employeeForm, establishment_id: establishment?.id, gross_salary: Number(employeeForm.gross_salary) || null, net_salary: Number(employeeForm.net_salary) || null };
      if (editingEmployee) {
        await rhService.updateEmployee(editingEmployee.id, data);
        toast.success('Employé mis à jour');
      } else {
        await rhService.createEmployee(data);
        toast.success('Employé ajouté');
      }
      setShowEmployeeModal(false); setEditingEmployee(null);
      setEmployeeForm({ first_name: '', last_name: '', email: '', phone: '', position: '', department: '', hire_date: '', gross_salary: '', net_salary: '' });
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveContract = async () => {
    try {
      if (!contractForm.employee_id || !contractForm.title || !contractForm.start_date) { toast.error('Champs requis manquants'); return; }
      await rhService.createContract({ ...contractForm, establishment_id: establishment?.id, weekly_hours: Number(contractForm.weekly_hours), gross_salary: Number(contractForm.gross_salary) || null });
      toast.success('Contrat créé');
      setShowContractModal(false);
      setContractForm({ employee_id: '', contract_type: 'CDI', title: '', start_date: '', end_date: '', weekly_hours: '35', gross_salary: '' });
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveLeave = async () => {
    try {
      if (!leaveForm.employee_id || !leaveForm.start_date || !leaveForm.end_date) { toast.error('Champs requis manquants'); return; }
      await rhService.createLeaveRequest({ ...leaveForm, establishment_id: establishment?.id, days_count: Number(leaveForm.days_count) });
      toast.success('Demande créée');
      setShowLeaveModal(false);
      setLeaveForm({ employee_id: '', leave_type: 'paid_leave', start_date: '', end_date: '', days_count: '1', reason: '' });
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await rhService.updateLeaveRequest(id, { status, approved_at: new Date().toISOString() });
      toast.success(status === 'approved' ? 'Congé approuvé' : 'Congé refusé');
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSavePayslip = async () => {
    try {
      if (!payslipForm.employee_id || !payslipForm.gross_salary || !payslipForm.net_salary) { toast.error('Champs requis manquants'); return; }
      const gross = Number(payslipForm.gross_salary);
      const net = Number(payslipForm.net_salary);
      const employerCharges = Number(payslipForm.employer_charges) || 0;
      const employeeCharges = Number(payslipForm.employee_charges) || 0;
      const bonuses = Number(payslipForm.bonuses) || 0;
      const deductions = Number(payslipForm.deductions) || 0;
      await rhService.createPayslip({
        establishment_id: establishment?.id,
        employee_id: payslipForm.employee_id,
        period_month: Number(payslipForm.period_month),
        period_year: Number(payslipForm.period_year),
        gross_salary: gross, net_salary: net,
        employer_charges: employerCharges, employee_charges: employeeCharges,
        bonuses, deductions,
        total_cost: gross + employerCharges,
      });
      toast.success('Fiche de paie créée');
      setShowPayslipModal(false);
      setPayslipForm({ employee_id: '', period_month: String(new Date().getMonth() + 1), period_year: String(new Date().getFullYear()), gross_salary: '', net_salary: '', employer_charges: '', employee_charges: '', bonuses: '0', deductions: '0' });
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ressources Humaines</h1>
          <p className="text-sm text-muted-foreground">Gestion du personnel, contrats, congés et paie</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => setShowEmployeeModal(true)}><Plus className="w-4 h-4 mr-1" />Employé</Button>
          <Button size="sm" variant="outline" onClick={() => setShowContractModal(true)}><FileText className="w-4 h-4 mr-1" />Contrat</Button>
          <Button size="sm" variant="outline" onClick={() => setShowLeaveModal(true)}><Calendar className="w-4 h-4 mr-1" />Congé</Button>
          <Button size="sm" variant="outline" onClick={() => setShowPayslipModal(true)}><Wallet className="w-4 h-4 mr-1" />Fiche de paie</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Employés actifs</p><p className="text-xl font-bold text-foreground">{activeEmployees}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Contrats en cours</p><p className="text-xl font-bold text-foreground">{contracts.filter(c => c.is_active).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Congés en attente</p><p className="text-xl font-bold text-warning">{pendingLeaves}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Masse salariale</p><p className="text-xl font-bold text-foreground">{fmt(totalMassSalariale)}</p></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="employees">Personnel ({employees.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contrats ({contracts.length})</TabsTrigger>
          <TabsTrigger value="leaves">Congés ({leaveRequests.length})</TabsTrigger>
          <TabsTrigger value="payslips">Paie ({payslips.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Poste</TableHead>
                <TableHead>Service</TableHead><TableHead>Date d'embauche</TableHead><TableHead>Statut</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {employees.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium text-sm">{e.first_name} {e.last_name}</TableCell>
                    <TableCell className="text-sm">{e.email || '-'}</TableCell>
                    <TableCell className="text-sm">{e.position || '-'}</TableCell>
                    <TableCell className="text-sm">{e.department || '-'}</TableCell>
                    <TableCell className="text-sm">{e.hire_date || '-'}</TableCell>
                    <TableCell><Badge variant="secondary" className={e.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>{e.is_active ? 'Actif' : 'Inactif'}</Badge></TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingEmployee(e); setEmployeeForm({ first_name: e.first_name, last_name: e.last_name, email: e.email || '', phone: e.phone || '', position: e.position || '', department: e.department || '', hire_date: e.hire_date || '', gross_salary: String(e.gross_salary || ''), net_salary: String(e.net_salary || '') }); setShowEmployeeModal(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => rhService.deleteEmployee(e.id).then(loadData)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun employé</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Employé</TableHead><TableHead>Type</TableHead><TableHead>Intitulé</TableHead>
                <TableHead>Début</TableHead><TableHead>Fin</TableHead><TableHead>Heures/sem</TableHead><TableHead>Statut</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {contracts.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-medium">{c.employees?.first_name} {c.employees?.last_name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{contractTypeLabels[c.contract_type]}</Badge></TableCell>
                    <TableCell className="text-sm">{c.title}</TableCell>
                    <TableCell className="text-sm">{c.start_date}</TableCell>
                    <TableCell className="text-sm">{c.end_date || 'Indéterminé'}</TableCell>
                    <TableCell className="text-sm">{c.weekly_hours}h</TableCell>
                    <TableCell><Badge variant="secondary" className={c.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>{c.is_active ? 'Actif' : 'Terminé'}</Badge></TableCell>
                  </TableRow>
                ))}
                {contracts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun contrat</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Employé</TableHead><TableHead>Type</TableHead><TableHead>Du</TableHead>
                <TableHead>Au</TableHead><TableHead>Jours</TableHead><TableHead>Statut</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {leaveRequests.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm font-medium">{l.employees?.first_name} {l.employees?.last_name}</TableCell>
                    <TableCell className="text-sm">{leaveTypeLabels[l.leave_type]}</TableCell>
                    <TableCell className="text-sm">{l.start_date}</TableCell>
                    <TableCell className="text-sm">{l.end_date}</TableCell>
                    <TableCell className="text-sm">{l.days_count}</TableCell>
                    <TableCell><Badge variant="secondary" className={`text-[10px] ${leaveStatusColors[l.status]}`}>{l.status === 'pending' ? 'En attente' : l.status === 'approved' ? 'Approuvé' : l.status === 'rejected' ? 'Refusé' : 'Annulé'}</Badge></TableCell>
                    <TableCell>
                      {l.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="text-success" onClick={() => handleLeaveAction(l.id, 'approved')}><Check className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleLeaveAction(l.id, 'rejected')}><X className="w-3.5 h-3.5" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {leaveRequests.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune demande</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payslips">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Employé</TableHead><TableHead>Période</TableHead><TableHead>Brut</TableHead>
                <TableHead>Net</TableHead><TableHead>Coût total</TableHead><TableHead>Statut</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {payslips.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm font-medium">{p.employees?.first_name} {p.employees?.last_name}</TableCell>
                    <TableCell className="text-sm">{months[p.period_month - 1]} {p.period_year}</TableCell>
                    <TableCell className="text-sm">{fmt(Number(p.gross_salary))}</TableCell>
                    <TableCell className="text-sm font-semibold">{fmt(Number(p.net_salary))}</TableCell>
                    <TableCell className="text-sm">{fmt(Number(p.total_cost))}</TableCell>
                    <TableCell><Badge variant="secondary" className={p.is_validated ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>{p.is_validated ? 'Validée' : 'Brouillon'}</Badge></TableCell>
                  </TableRow>
                ))}
                {payslips.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune fiche de paie</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Employee Modal */}
      <Dialog open={showEmployeeModal} onOpenChange={(o) => { setShowEmployeeModal(o); if (!o) { setEditingEmployee(null); setEmployeeForm({ first_name: '', last_name: '', email: '', phone: '', position: '', department: '', hire_date: '', gross_salary: '', net_salary: '' }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingEmployee ? 'Modifier l\'employé' : 'Nouvel employé'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prénom *</Label><Input value={employeeForm.first_name} onChange={e => setEmployeeForm(p => ({ ...p, first_name: e.target.value }))} /></div>
              <div><Label>Nom *</Label><Input value={employeeForm.last_name} onChange={e => setEmployeeForm(p => ({ ...p, last_name: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={employeeForm.email} onChange={e => setEmployeeForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Téléphone</Label><Input value={employeeForm.phone} onChange={e => setEmployeeForm(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Poste</Label><Input value={employeeForm.position} onChange={e => setEmployeeForm(p => ({ ...p, position: e.target.value }))} /></div>
              <div><Label>Service</Label><Input value={employeeForm.department} onChange={e => setEmployeeForm(p => ({ ...p, department: e.target.value }))} /></div>
            </div>
            <div><Label>Date d'embauche</Label><Input type="date" value={employeeForm.hire_date} onChange={e => setEmployeeForm(p => ({ ...p, hire_date: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Salaire brut</Label><Input type="number" value={employeeForm.gross_salary} onChange={e => setEmployeeForm(p => ({ ...p, gross_salary: e.target.value }))} /></div>
              <div><Label>Salaire net</Label><Input type="number" value={employeeForm.net_salary} onChange={e => setEmployeeForm(p => ({ ...p, net_salary: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSaveEmployee}>{editingEmployee ? 'Mettre à jour' : 'Ajouter'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Modal */}
      <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouveau contrat</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Employé *</Label>
              <Select value={contractForm.employee_id} onValueChange={v => setContractForm(p => ({ ...p, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Intitulé *</Label><Input value={contractForm.title} onChange={e => setContractForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div>
              <Label>Type</Label>
              <Select value={contractForm.contract_type} onValueChange={v => setContractForm(p => ({ ...p, contract_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(contractTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date de début *</Label><Input type="date" value={contractForm.start_date} onChange={e => setContractForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div><Label>Date de fin</Label><Input type="date" value={contractForm.end_date} onChange={e => setContractForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Heures/semaine</Label><Input type="number" value={contractForm.weekly_hours} onChange={e => setContractForm(p => ({ ...p, weekly_hours: e.target.value }))} /></div>
              <div><Label>Salaire brut</Label><Input type="number" value={contractForm.gross_salary} onChange={e => setContractForm(p => ({ ...p, gross_salary: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSaveContract}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Demande de congé</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Employé *</Label>
              <Select value={leaveForm.employee_id} onValueChange={v => setLeaveForm(p => ({ ...p, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>{employees.filter(e => e.is_active).map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={leaveForm.leave_type} onValueChange={v => setLeaveForm(p => ({ ...p, leave_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(leaveTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Du *</Label><Input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div><Label>Au *</Label><Input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm(p => ({ ...p, end_date: e.target.value }))} /></div>
            </div>
            <div><Label>Nombre de jours</Label><Input type="number" step="0.5" value={leaveForm.days_count} onChange={e => setLeaveForm(p => ({ ...p, days_count: e.target.value }))} /></div>
            <div><Label>Motif</Label><Textarea value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveLeave}>Envoyer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip Modal */}
      <Dialog open={showPayslipModal} onOpenChange={setShowPayslipModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvelle fiche de paie</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Employé *</Label>
              <Select value={payslipForm.employee_id} onValueChange={v => { const emp = employees.find(e => e.id === v); setPayslipForm(p => ({ ...p, employee_id: v, gross_salary: String(emp?.gross_salary || ''), net_salary: String(emp?.net_salary || '') })); }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>{employees.filter(e => e.is_active).map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mois</Label>
                <Select value={payslipForm.period_month} onValueChange={v => setPayslipForm(p => ({ ...p, period_month: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Année</Label><Input type="number" value={payslipForm.period_year} onChange={e => setPayslipForm(p => ({ ...p, period_year: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Brut *</Label><Input type="number" value={payslipForm.gross_salary} onChange={e => setPayslipForm(p => ({ ...p, gross_salary: e.target.value }))} /></div>
              <div><Label>Net *</Label><Input type="number" value={payslipForm.net_salary} onChange={e => setPayslipForm(p => ({ ...p, net_salary: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Charges patronales</Label><Input type="number" value={payslipForm.employer_charges} onChange={e => setPayslipForm(p => ({ ...p, employer_charges: e.target.value }))} /></div>
              <div><Label>Charges salariales</Label><Input type="number" value={payslipForm.employee_charges} onChange={e => setPayslipForm(p => ({ ...p, employee_charges: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Primes</Label><Input type="number" value={payslipForm.bonuses} onChange={e => setPayslipForm(p => ({ ...p, bonuses: e.target.value }))} /></div>
              <div><Label>Retenues</Label><Input type="number" value={payslipForm.deductions} onChange={e => setPayslipForm(p => ({ ...p, deductions: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSavePayslip}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RessourcesHumaines;
