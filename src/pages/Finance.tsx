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
import { Plus, FileText, Receipt, CreditCard, Users, Search, Trash2, Edit, ArrowRight, Download, Eye } from 'lucide-react';
import { useEstablishment } from '@/hooks/useEstablishment';
import * as financeService from '@/services/financeService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-info/10 text-info',
  accepted: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  expired: 'bg-warning/10 text-warning',
  converted: 'bg-primary/10 text-primary',
  paid: 'bg-success/10 text-success',
  partially_paid: 'bg-warning/10 text-warning',
  overdue: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
  refunded: 'bg-info/10 text-info',
};

const statusLabels: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', rejected: 'Refusé',
  expired: 'Expiré', converted: 'Converti', paid: 'Payée', partially_paid: 'Partiellement payée',
  overdue: 'En retard', cancelled: 'Annulée', refunded: 'Remboursée',
};

const Finance = () => {
  const { establishment } = useEstablishment();
  const [activeTab, setActiveTab] = useState('overview');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showClientModal, setShowClientModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  
  // Forms
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '', address: '', city: '', postal_code: '', siret: '', vat_number: '' });
  const [invoiceForm, setInvoiceForm] = useState({ client_id: '', subject: '', notes: '', due_date: '', tax_rate: '20', items: [{ description: '', quantity: '1', unit_price: '0' }] });
  const [quoteForm, setQuoteForm] = useState({ client_id: '', subject: '', notes: '', validity_date: '', tax_rate: '20', items: [{ description: '', quantity: '1', unit_price: '0' }] });
  const [paymentForm, setPaymentForm] = useState({ invoice_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'bank_transfer', reference: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inv, quo, pay, cli] = await Promise.all([
        financeService.getInvoices(),
        financeService.getQuotes(),
        financeService.getPayments(),
        financeService.getBillingClients(),
      ]);
      setInvoices(inv || []);
      setQuotes(quo || []);
      setPayments(pay || []);
      setClients(cli || []);
    } catch (e: any) {
      toast.error('Erreur de chargement: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total || 0), 0);
  const totalOutstanding = invoices.filter(i => !['paid', 'cancelled', 'refunded'].includes(i.status)).reduce((s, i) => s + (Number(i.total || 0) - Number(i.amount_paid || 0)), 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (Number(i.total || 0) - Number(i.amount_paid || 0)), 0);

  // ============= CLIENT CRUD =============
  const handleSaveClient = async () => {
    try {
      if (!clientForm.name) { toast.error('Le nom est requis'); return; }
      if (editingClient) {
        await financeService.updateBillingClient(editingClient.id, clientForm);
        toast.success('Client mis à jour');
      } else {
        await financeService.createBillingClient({ ...clientForm, establishment_id: establishment?.id });
        toast.success('Client créé');
      }
      setShowClientModal(false);
      setEditingClient(null);
      setClientForm({ name: '', email: '', phone: '', address: '', city: '', postal_code: '', siret: '', vat_number: '' });
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  // ============= INVOICE CRUD =============
  const calculateTotals = (items: any[], taxRate: number) => {
    const subtotal = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);
    const taxAmount = subtotal * (taxRate / 100);
    return { subtotal, tax_amount: taxAmount, total: subtotal + taxAmount };
  };

  const handleSaveInvoice = async () => {
    try {
      if (!invoiceForm.subject) { toast.error('L\'objet est requis'); return; }
      const invoiceNumber = await financeService.generateInvoiceNumber();
      const totals = calculateTotals(invoiceForm.items, Number(invoiceForm.tax_rate));
      const invoice = await financeService.createInvoice({
        establishment_id: establishment?.id,
        client_id: invoiceForm.client_id || null,
        invoice_number: invoiceNumber,
        subject: invoiceForm.subject,
        notes: invoiceForm.notes,
        due_date: invoiceForm.due_date || null,
        tax_rate: Number(invoiceForm.tax_rate),
        ...totals,
      });
      for (const [idx, item] of invoiceForm.items.entries()) {
        if (item.description) {
          await financeService.createInvoiceItem({
            invoice_id: invoice.id,
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: Number(item.quantity) * Number(item.unit_price),
            order_index: idx,
          });
        }
      }
      toast.success(`Facture ${invoiceNumber} créée`);
      setShowInvoiceModal(false);
      setInvoiceForm({ client_id: '', subject: '', notes: '', due_date: '', tax_rate: '20', items: [{ description: '', quantity: '1', unit_price: '0' }] });
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  // ============= QUOTE CRUD =============
  const handleSaveQuote = async () => {
    try {
      if (!quoteForm.subject) { toast.error('L\'objet est requis'); return; }
      const quoteNumber = await financeService.generateQuoteNumber();
      const totals = calculateTotals(quoteForm.items, Number(quoteForm.tax_rate));
      const quote = await financeService.createQuote({
        establishment_id: establishment?.id,
        client_id: quoteForm.client_id || null,
        quote_number: quoteNumber,
        subject: quoteForm.subject,
        notes: quoteForm.notes,
        validity_date: quoteForm.validity_date || null,
        tax_rate: Number(quoteForm.tax_rate),
        ...totals,
      });
      for (const [idx, item] of quoteForm.items.entries()) {
        if (item.description) {
          await financeService.createQuoteItem({
            quote_id: quote.id,
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: Number(item.quantity) * Number(item.unit_price),
            order_index: idx,
          });
        }
      }
      toast.success(`Devis ${quoteNumber} créé`);
      setShowQuoteModal(false);
      setQuoteForm({ client_id: '', subject: '', notes: '', validity_date: '', tax_rate: '20', items: [{ description: '', quantity: '1', unit_price: '0' }] });
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleConvertQuote = async (quoteId: string) => {
    try {
      await financeService.convertQuoteToInvoice(quoteId);
      toast.success('Devis converti en facture');
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  // ============= PAYMENT CRUD =============
  const handleSavePayment = async () => {
    try {
      if (!paymentForm.invoice_id || !paymentForm.amount) { toast.error('Facture et montant requis'); return; }
      await financeService.createPayment({
        establishment_id: establishment?.id,
        invoice_id: paymentForm.invoice_id,
        amount: Number(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference,
      });
      // Update invoice amount_paid
      const invoice = invoices.find(i => i.id === paymentForm.invoice_id);
      if (invoice) {
        const newAmountPaid = Number(invoice.amount_paid || 0) + Number(paymentForm.amount);
        const newStatus = newAmountPaid >= Number(invoice.total) ? 'paid' : 'partially_paid';
        await financeService.updateInvoice(invoice.id, { amount_paid: newAmountPaid, status: newStatus });
      }
      toast.success('Paiement enregistré');
      setShowPaymentModal(false);
      setPaymentForm({ invoice_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'bank_transfer', reference: '' });
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const addItem = (form: 'invoice' | 'quote') => {
    if (form === 'invoice') {
      setInvoiceForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: '1', unit_price: '0' }] }));
    } else {
      setQuoteForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: '1', unit_price: '0' }] }));
    }
  };

  const updateItem = (form: 'invoice' | 'quote', index: number, field: string, value: string) => {
    if (form === 'invoice') {
      setInvoiceForm(prev => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
    } else {
      setQuoteForm(prev => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
    }
  };

  const removeItem = (form: 'invoice' | 'quote', index: number) => {
    if (form === 'invoice') {
      setInvoiceForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    } else {
      setQuoteForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finance</h1>
          <p className="text-sm text-muted-foreground">Gestion des factures, devis et paiements</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setShowClientModal(true)}><Users className="w-4 h-4 mr-1" />Client</Button>
          <Button size="sm" variant="outline" onClick={() => setShowQuoteModal(true)}><FileText className="w-4 h-4 mr-1" />Devis</Button>
          <Button size="sm" onClick={() => setShowInvoiceModal(true)}><Receipt className="w-4 h-4 mr-1" />Facture</Button>
          <Button size="sm" variant="outline" onClick={() => setShowPaymentModal(true)}><CreditCard className="w-4 h-4 mr-1" />Paiement</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Chiffre d'affaires</p><p className="text-xl font-bold text-foreground">{fmt(totalRevenue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Encaissé</p><p className="text-xl font-bold text-success">{fmt(totalPaid)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">En attente</p><p className="text-xl font-bold text-warning">{fmt(totalOutstanding)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">En retard</p><p className="text-xl font-bold text-destructive">{fmt(totalOverdue)}</p></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="invoices">Factures ({invoices.length})</TabsTrigger>
          <TabsTrigger value="quotes">Devis ({quotes.length})</TabsTrigger>
          <TabsTrigger value="payments">Paiements ({payments.length})</TabsTrigger>
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Dernières factures</CardTitle></CardHeader>
              <CardContent>
                {invoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{inv.billing_clients?.name || 'Sans client'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmt(Number(inv.total))}</p>
                      <Badge variant="secondary" className={`text-[10px] ${statusColors[inv.status]}`}>{statusLabels[inv.status]}</Badge>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune facture</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Derniers devis</CardTitle></CardHeader>
              <CardContent>
                {quotes.slice(0, 5).map(q => (
                  <div key={q.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{q.quote_number}</p>
                      <p className="text-xs text-muted-foreground">{q.billing_clients?.name || 'Sans client'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmt(Number(q.total))}</p>
                      <Badge variant="secondary" className={`text-[10px] ${statusColors[q.status]}`}>{statusLabels[q.status]}</Badge>
                    </div>
                  </div>
                ))}
                {quotes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun devis</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>N°</TableHead><TableHead>Client</TableHead><TableHead>Objet</TableHead>
                  <TableHead>Date</TableHead><TableHead>Échéance</TableHead><TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-sm">{inv.invoice_number}</TableCell>
                      <TableCell className="text-sm">{inv.billing_clients?.name || '-'}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{inv.subject}</TableCell>
                      <TableCell className="text-sm">{inv.issue_date}</TableCell>
                      <TableCell className="text-sm">{inv.due_date || '-'}</TableCell>
                      <TableCell className="text-sm font-semibold">{fmt(Number(inv.total))}</TableCell>
                      <TableCell><Badge variant="secondary" className={`text-[10px] ${statusColors[inv.status]}`}>{statusLabels[inv.status]}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => financeService.deleteInvoice(inv.id).then(loadData)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoices.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucune facture</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>N°</TableHead><TableHead>Client</TableHead><TableHead>Objet</TableHead>
                  <TableHead>Date</TableHead><TableHead>Validité</TableHead><TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {quotes.map(q => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium text-sm">{q.quote_number}</TableCell>
                      <TableCell className="text-sm">{q.billing_clients?.name || '-'}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{q.subject}</TableCell>
                      <TableCell className="text-sm">{q.issue_date}</TableCell>
                      <TableCell className="text-sm">{q.validity_date || '-'}</TableCell>
                      <TableCell className="text-sm font-semibold">{fmt(Number(q.total))}</TableCell>
                      <TableCell><Badge variant="secondary" className={`text-[10px] ${statusColors[q.status]}`}>{statusLabels[q.status]}</Badge></TableCell>
                      <TableCell className="flex gap-1">
                        {q.status !== 'converted' && (
                          <Button size="sm" variant="ghost" title="Convertir en facture" onClick={() => handleConvertQuote(q.id)}><ArrowRight className="w-3.5 h-3.5" /></Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => financeService.deleteQuote(q.id).then(loadData)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {quotes.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun devis</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Facture</TableHead><TableHead>Client</TableHead>
                  <TableHead>Montant</TableHead><TableHead>Méthode</TableHead><TableHead>Réf.</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {payments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{p.payment_date}</TableCell>
                      <TableCell className="text-sm font-medium">{p.invoices?.invoice_number || '-'}</TableCell>
                      <TableCell className="text-sm">{p.invoices?.billing_clients?.name || '-'}</TableCell>
                      <TableCell className="text-sm font-semibold text-success">{fmt(Number(p.amount))}</TableCell>
                      <TableCell className="text-sm capitalize">{p.payment_method?.replace('_', ' ')}</TableCell>
                      <TableCell className="text-sm">{p.reference || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun paiement</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Téléphone</TableHead>
                  <TableHead>Ville</TableHead><TableHead>SIRET</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {clients.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-sm">{c.name}</TableCell>
                      <TableCell className="text-sm">{c.email || '-'}</TableCell>
                      <TableCell className="text-sm">{c.phone || '-'}</TableCell>
                      <TableCell className="text-sm">{c.city || '-'}</TableCell>
                      <TableCell className="text-sm">{c.siret || '-'}</TableCell>
                      <TableCell className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingClient(c); setClientForm(c); setShowClientModal(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => financeService.deleteBillingClient(c.id).then(loadData)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {clients.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun client</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Client Modal */}
      <Dialog open={showClientModal} onOpenChange={(o) => { setShowClientModal(o); if (!o) { setEditingClient(null); setClientForm({ name: '', email: '', phone: '', address: '', city: '', postal_code: '', siret: '', vat_number: '' }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingClient ? 'Modifier le client' : 'Nouveau client'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom *</Label><Input value={clientForm.name} onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={clientForm.email} onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Téléphone</Label><Input value={clientForm.phone} onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div><Label>Adresse</Label><Input value={clientForm.address} onChange={e => setClientForm(p => ({ ...p, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ville</Label><Input value={clientForm.city} onChange={e => setClientForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div><Label>Code postal</Label><Input value={clientForm.postal_code} onChange={e => setClientForm(p => ({ ...p, postal_code: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>SIRET</Label><Input value={clientForm.siret} onChange={e => setClientForm(p => ({ ...p, siret: e.target.value }))} /></div>
              <div><Label>N° TVA</Label><Input value={clientForm.vat_number} onChange={e => setClientForm(p => ({ ...p, vat_number: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSaveClient}>{editingClient ? 'Mettre à jour' : 'Créer'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvelle facture</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Client</Label>
                <Select value={invoiceForm.client_id} onValueChange={v => setInvoiceForm(p => ({ ...p, client_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Échéance</Label><Input type="date" value={invoiceForm.due_date} onChange={e => setInvoiceForm(p => ({ ...p, due_date: e.target.value }))} /></div>
            </div>
            <div><Label>Objet *</Label><Input value={invoiceForm.subject} onChange={e => setInvoiceForm(p => ({ ...p, subject: e.target.value }))} /></div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Lignes</Label><Button size="sm" variant="outline" onClick={() => addItem('invoice')}><Plus className="w-3 h-3 mr-1" />Ajouter</Button></div>
              {invoiceForm.items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_30px] gap-2 mb-2">
                  <Input placeholder="Description" value={item.description} onChange={e => updateItem('invoice', i, 'description', e.target.value)} />
                  <Input type="number" placeholder="Qté" value={item.quantity} onChange={e => updateItem('invoice', i, 'quantity', e.target.value)} />
                  <Input type="number" placeholder="Prix HT" value={item.unit_price} onChange={e => updateItem('invoice', i, 'unit_price', e.target.value)} />
                  <Button size="sm" variant="ghost" onClick={() => removeItem('invoice', i)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>TVA (%)</Label><Input type="number" value={invoiceForm.tax_rate} onChange={e => setInvoiceForm(p => ({ ...p, tax_rate: e.target.value }))} /></div>
              <div className="text-right pt-6">
                <p className="text-sm text-muted-foreground">Total TTC: <span className="font-bold text-foreground text-lg">{fmt(calculateTotals(invoiceForm.items, Number(invoiceForm.tax_rate)).total)}</span></p>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea value={invoiceForm.notes} onChange={e => setInvoiceForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveInvoice}>Créer la facture</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Modal */}
      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouveau devis</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Client</Label>
                <Select value={quoteForm.client_id} onValueChange={v => setQuoteForm(p => ({ ...p, client_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date de validité</Label><Input type="date" value={quoteForm.validity_date} onChange={e => setQuoteForm(p => ({ ...p, validity_date: e.target.value }))} /></div>
            </div>
            <div><Label>Objet *</Label><Input value={quoteForm.subject} onChange={e => setQuoteForm(p => ({ ...p, subject: e.target.value }))} /></div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Lignes</Label><Button size="sm" variant="outline" onClick={() => addItem('quote')}><Plus className="w-3 h-3 mr-1" />Ajouter</Button></div>
              {quoteForm.items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_30px] gap-2 mb-2">
                  <Input placeholder="Description" value={item.description} onChange={e => updateItem('quote', i, 'description', e.target.value)} />
                  <Input type="number" placeholder="Qté" value={item.quantity} onChange={e => updateItem('quote', i, 'quantity', e.target.value)} />
                  <Input type="number" placeholder="Prix HT" value={item.unit_price} onChange={e => updateItem('quote', i, 'unit_price', e.target.value)} />
                  <Button size="sm" variant="ghost" onClick={() => removeItem('quote', i)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>TVA (%)</Label><Input type="number" value={quoteForm.tax_rate} onChange={e => setQuoteForm(p => ({ ...p, tax_rate: e.target.value }))} /></div>
              <div className="text-right pt-6">
                <p className="text-sm text-muted-foreground">Total TTC: <span className="font-bold text-foreground text-lg">{fmt(calculateTotals(quoteForm.items, Number(quoteForm.tax_rate)).total)}</span></p>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea value={quoteForm.notes} onChange={e => setQuoteForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveQuote}>Créer le devis</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enregistrer un paiement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Facture *</Label>
              <Select value={paymentForm.invoice_id} onValueChange={v => setPaymentForm(p => ({ ...p, invoice_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une facture..." /></SelectTrigger>
                <SelectContent>{invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').map(i => <SelectItem key={i.id} value={i.id}>{i.invoice_number} - {fmt(Number(i.total))}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Montant *</Label><Input type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} /></div>
            <div><Label>Date</Label><Input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm(p => ({ ...p, payment_date: e.target.value }))} /></div>
            <div>
              <Label>Méthode</Label>
              <Select value={paymentForm.payment_method} onValueChange={v => setPaymentForm(p => ({ ...p, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Virement</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Référence</Label><Input value={paymentForm.reference} onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSavePayment}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Finance;
