import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, BookOpen, PenLine, BarChart3, Download, Trash2, Settings } from 'lucide-react';
import { useEstablishment } from '@/hooks/useEstablishment';
import * as accountingService from '@/services/accountingService';

const Comptabilite = () => {
  const { establishment } = useEstablishment();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);

  // Forms
  const [accountForm, setAccountForm] = useState({ account_number: '', label: '', account_type: 'general' });
  const [entryForm, setEntryForm] = useState({ entry_date: new Date().toISOString().split('T')[0], journal: 'OD', piece_number: '', label: '', account_id: '', debit: '0', credit: '0' });

  // Filters
  const [dateFilter, setDateFilter] = useState({ startDate: `${new Date().getFullYear()}-01-01`, endDate: `${new Date().getFullYear()}-12-31` });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [acc, ent, sum] = await Promise.all([
        accountingService.getAccountingAccounts(),
        accountingService.getAccountingEntries(dateFilter),
        accountingService.getFinancialSummary(),
      ]);
      setAccounts(acc || []);
      setEntries(ent || []);
      setSummary(sum);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  const handleSeedAccounts = async () => {
    try {
      if (!establishment?.id) return;
      await accountingService.seedDefaultAccounts(establishment.id);
      toast.success('Plan comptable initialisé');
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveAccount = async () => {
    try {
      if (!accountForm.account_number || !accountForm.label) { toast.error('Numéro et libellé requis'); return; }
      await accountingService.createAccountingAccount({ ...accountForm, establishment_id: establishment?.id });
      toast.success('Compte créé');
      setShowAccountModal(false);
      setAccountForm({ account_number: '', label: '', account_type: 'general' });
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSaveEntry = async () => {
    try {
      if (!entryForm.label || !entryForm.account_id) { toast.error('Libellé et compte requis'); return; }
      if (Number(entryForm.debit) === 0 && Number(entryForm.credit) === 0) { toast.error('Débit ou crédit requis'); return; }
      await accountingService.createAccountingEntry({
        ...entryForm,
        establishment_id: establishment?.id,
        debit: Number(entryForm.debit),
        credit: Number(entryForm.credit),
      });
      toast.success('Écriture créée');
      setShowEntryModal(false);
      setEntryForm({ entry_date: new Date().toISOString().split('T')[0], journal: 'OD', piece_number: '', label: '', account_id: '', debit: '0', credit: '0' });
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const totalDebit = entries.reduce((s, e) => s + Number(e.debit || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + Number(e.credit || 0), 0);

  const exportFEC = () => {
    const header = 'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|PieceRef|EcritureLib|Debit|Credit';
    const rows = entries.map(e => 
      `${e.journal}|${e.journal}|${e.id.slice(0,8)}|${e.entry_date}|${e.accounting_accounts?.account_number || ''}|${e.accounting_accounts?.label || ''}|${e.piece_number || ''}|${e.label}|${Number(e.debit).toFixed(2)}|${Number(e.credit).toFixed(2)}`
    );
    const content = [header, ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `FEC_${new Date().getFullYear()}.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('FEC exporté');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comptabilité</h1>
          <p className="text-sm text-muted-foreground">Plan comptable, journal des écritures et tableau de bord financier</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowAccountModal(true)}><BookOpen className="w-4 h-4 mr-1" />Compte</Button>
          <Button size="sm" onClick={() => setShowEntryModal(true)}><PenLine className="w-4 h-4 mr-1" />Écriture</Button>
          <Button size="sm" variant="outline" onClick={exportFEC}><Download className="w-4 h-4 mr-1" />Export FEC</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">CA Facturé</p><p className="text-xl font-bold text-foreground">{fmt(summary?.totalRevenue || 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Encaissé</p><p className="text-xl font-bold text-success">{fmt(summary?.totalPaid || 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Débit</p><p className="text-xl font-bold text-foreground">{fmt(totalDebit)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Crédit</p><p className="text-xl font-bold text-foreground">{fmt(totalCredit)}</p></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="journal">Journal ({entries.length})</TabsTrigger>
          <TabsTrigger value="accounts">Plan comptable ({accounts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Résumé financier {new Date().getFullYear()}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Factures émises</span><span className="font-semibold">{summary?.invoiceCount || 0}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Chiffre d'affaires</span><span className="font-semibold">{fmt(summary?.totalRevenue || 0)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Encaissé</span><span className="font-semibold text-success">{fmt(summary?.totalPaid || 0)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">En attente</span><span className="font-semibold text-warning">{fmt(summary?.totalOutstanding || 0)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Factures en retard</span><span className="font-semibold text-destructive">{summary?.overdueCount || 0}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Balance comptable</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Débit</span><span className="font-semibold">{fmt(totalDebit)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Crédit</span><span className="font-semibold">{fmt(totalCredit)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="text-sm font-medium">Solde</span><span className={`font-bold ${totalCredit - totalDebit >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(totalCredit - totalDebit)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Nombre d'écritures</span><span className="font-semibold">{entries.length}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Comptes actifs</span><span className="font-semibold">{accounts.filter(a => a.is_active).length}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journal">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Input type="date" className="w-40" value={dateFilter.startDate} onChange={e => setDateFilter(p => ({ ...p, startDate: e.target.value }))} />
                <span className="text-sm text-muted-foreground">au</span>
                <Input type="date" className="w-40" value={dateFilter.endDate} onChange={e => setDateFilter(p => ({ ...p, endDate: e.target.value }))} />
                <Button size="sm" variant="outline" onClick={loadData}>Filtrer</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Journal</TableHead><TableHead>N° pièce</TableHead>
                  <TableHead>Compte</TableHead><TableHead>Libellé</TableHead><TableHead className="text-right">Débit</TableHead>
                  <TableHead className="text-right">Crédit</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {entries.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{e.entry_date}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{e.journal}</Badge></TableCell>
                      <TableCell className="text-sm">{e.piece_number || '-'}</TableCell>
                      <TableCell className="text-sm font-mono">{e.accounting_accounts?.account_number} - {e.accounting_accounts?.label}</TableCell>
                      <TableCell className="text-sm">{e.label}</TableCell>
                      <TableCell className="text-sm text-right">{Number(e.debit) > 0 ? fmt(Number(e.debit)) : '-'}</TableCell>
                      <TableCell className="text-sm text-right">{Number(e.credit) > 0 ? fmt(Number(e.credit)) : '-'}</TableCell>
                      <TableCell>
                        {!e.is_validated && <Button size="sm" variant="ghost" onClick={() => accountingService.deleteAccountingEntry(e.id).then(loadData)}><Trash2 className="w-3.5 h-3.5" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {entries.length > 0 && (
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={5} className="text-right">Total</TableCell>
                      <TableCell className="text-right">{fmt(totalDebit)}</TableCell>
                      <TableCell className="text-right">{fmt(totalCredit)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                  {entries.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucune écriture</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Plan comptable</CardTitle>
                {accounts.length === 0 && (
                  <Button size="sm" variant="outline" onClick={handleSeedAccounts}><Settings className="w-4 h-4 mr-1" />Initialiser le PCG</Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>N° Compte</TableHead><TableHead>Libellé</TableHead><TableHead>Type</TableHead><TableHead>Statut</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {accounts.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono font-medium text-sm">{a.account_number}</TableCell>
                      <TableCell className="text-sm">{a.label}</TableCell>
                      <TableCell className="text-sm capitalize">{a.account_type}</TableCell>
                      <TableCell><Badge variant="secondary" className={a.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>{a.is_active ? 'Actif' : 'Inactif'}</Badge></TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => accountingService.deleteAccountingAccount(a.id).then(loadData)}><Trash2 className="w-3.5 h-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {accounts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun compte — cliquez sur "Initialiser le PCG" pour créer les comptes de base</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Account Modal */}
      <Dialog open={showAccountModal} onOpenChange={setShowAccountModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouveau compte</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>N° Compte *</Label><Input value={accountForm.account_number} onChange={e => setAccountForm(p => ({ ...p, account_number: e.target.value }))} /></div>
            <div><Label>Libellé *</Label><Input value={accountForm.label} onChange={e => setAccountForm(p => ({ ...p, label: e.target.value }))} /></div>
            <div>
              <Label>Type</Label>
              <Select value={accountForm.account_type} onValueChange={v => setAccountForm(p => ({ ...p, account_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Général</SelectItem>
                  <SelectItem value="tiers">Tiers</SelectItem>
                  <SelectItem value="tresorerie">Trésorerie</SelectItem>
                  <SelectItem value="charge">Charge</SelectItem>
                  <SelectItem value="produit">Produit</SelectItem>
                  <SelectItem value="tva">TVA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSaveAccount}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entry Modal */}
      <Dialog open={showEntryModal} onOpenChange={setShowEntryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvelle écriture</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date *</Label><Input type="date" value={entryForm.entry_date} onChange={e => setEntryForm(p => ({ ...p, entry_date: e.target.value }))} /></div>
              <div>
                <Label>Journal</Label>
                <Select value={entryForm.journal} onValueChange={v => setEntryForm(p => ({ ...p, journal: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OD">OD (Opérations Diverses)</SelectItem>
                    <SelectItem value="VE">VE (Ventes)</SelectItem>
                    <SelectItem value="AC">AC (Achats)</SelectItem>
                    <SelectItem value="BQ">BQ (Banque)</SelectItem>
                    <SelectItem value="CA">CA (Caisse)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>N° pièce</Label><Input value={entryForm.piece_number} onChange={e => setEntryForm(p => ({ ...p, piece_number: e.target.value }))} /></div>
            <div>
              <Label>Compte *</Label>
              <Select value={entryForm.account_id} onValueChange={v => setEntryForm(p => ({ ...p, account_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un compte..." /></SelectTrigger>
                <SelectContent>{accounts.filter(a => a.is_active).map(a => <SelectItem key={a.id} value={a.id}>{a.account_number} - {a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Libellé *</Label><Input value={entryForm.label} onChange={e => setEntryForm(p => ({ ...p, label: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Débit</Label><Input type="number" step="0.01" value={entryForm.debit} onChange={e => setEntryForm(p => ({ ...p, debit: e.target.value, credit: e.target.value !== '0' ? '0' : p.credit }))} /></div>
              <div><Label>Crédit</Label><Input type="number" step="0.01" value={entryForm.credit} onChange={e => setEntryForm(p => ({ ...p, credit: e.target.value, debit: e.target.value !== '0' ? '0' : p.debit }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSaveEntry}>Créer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Comptabilite;
