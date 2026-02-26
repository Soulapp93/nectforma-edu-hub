import { supabase } from '@/integrations/supabase/client';

// ============= ACCOUNTING ACCOUNTS =============
export const getAccountingAccounts = async () => {
  const { data, error } = await supabase
    .from('accounting_accounts')
    .select('*')
    .order('account_number');
  if (error) throw error;
  return data;
};

export const createAccountingAccount = async (account: any) => {
  const { data, error } = await supabase
    .from('accounting_accounts')
    .insert(account)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAccountingAccount = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('accounting_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAccountingAccount = async (id: string) => {
  const { error } = await supabase.from('accounting_accounts').delete().eq('id', id);
  if (error) throw error;
};

// ============= ACCOUNTING ENTRIES =============
export const getAccountingEntries = async (filters?: { startDate?: string; endDate?: string; journal?: string }) => {
  let query = supabase
    .from('accounting_entries')
    .select('*, accounting_accounts(*), invoices(*), payments(*)')
    .order('entry_date', { ascending: false });
  
  if (filters?.startDate) query = query.gte('entry_date', filters.startDate);
  if (filters?.endDate) query = query.lte('entry_date', filters.endDate);
  if (filters?.journal) query = query.eq('journal', filters.journal);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createAccountingEntry = async (entry: any) => {
  const { data, error } = await supabase
    .from('accounting_entries')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAccountingEntry = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('accounting_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAccountingEntry = async (id: string) => {
  const { error } = await supabase.from('accounting_entries').delete().eq('id', id);
  if (error) throw error;
};

// ============= REPORTING =============
export const getFinancialSummary = async (year?: number) => {
  const currentYear = year || new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  const [invoicesRes, paymentsRes, entriesRes] = await Promise.all([
    supabase.from('invoices').select('total, amount_paid, status').gte('issue_date', startDate).lte('issue_date', endDate),
    supabase.from('payments').select('amount').gte('payment_date', startDate).lte('payment_date', endDate),
    supabase.from('accounting_entries').select('debit, credit, journal').gte('entry_date', startDate).lte('entry_date', endDate),
  ]);

  const invoices = invoicesRes.data || [];
  const payments = paymentsRes.data || [];
  const entries = entriesRes.data || [];

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalOutstanding = invoices
    .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, inv) => sum + (Number(inv.total || 0) - Number(inv.amount_paid || 0)), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit || 0), 0);

  return {
    totalRevenue,
    totalPaid,
    totalOutstanding,
    overdueCount,
    totalDebit,
    totalCredit,
    invoiceCount: invoices.length,
    balance: totalCredit - totalDebit,
  };
};

// Default chart of accounts (French PCG adapted for OF/CFA)
export const seedDefaultAccounts = async (establishmentId: string) => {
  const defaults = [
    { account_number: '411', label: 'Clients', account_type: 'tiers' },
    { account_number: '4111', label: 'Clients - Étudiants/Apprenants', account_type: 'tiers' },
    { account_number: '4112', label: 'Clients - OPCO/Financeurs', account_type: 'tiers' },
    { account_number: '4113', label: 'Clients - Entreprises', account_type: 'tiers' },
    { account_number: '401', label: 'Fournisseurs', account_type: 'tiers' },
    { account_number: '512', label: 'Banque', account_type: 'tresorerie' },
    { account_number: '530', label: 'Caisse', account_type: 'tresorerie' },
    { account_number: '706', label: 'Prestations de formation', account_type: 'produit' },
    { account_number: '7061', label: 'Formation initiale', account_type: 'produit' },
    { account_number: '7062', label: 'Formation continue', account_type: 'produit' },
    { account_number: '7063', label: 'Apprentissage', account_type: 'produit' },
    { account_number: '7064', label: 'VAE', account_type: 'produit' },
    { account_number: '7065', label: 'Bilans de compétences', account_type: 'produit' },
    { account_number: '741', label: 'Subventions d\'exploitation', account_type: 'produit' },
    { account_number: '7411', label: 'Subventions OPCO', account_type: 'produit' },
    { account_number: '7412', label: 'CPF', account_type: 'produit' },
    { account_number: '7413', label: 'Pôle Emploi / France Travail', account_type: 'produit' },
    { account_number: '7414', label: 'Région / Collectivités', account_type: 'produit' },
    { account_number: '601', label: 'Achats de matières pédagogiques', account_type: 'charge' },
    { account_number: '606', label: 'Achats non stockés', account_type: 'charge' },
    { account_number: '6132', label: 'Locations de salles', account_type: 'charge' },
    { account_number: '6185', label: 'Frais de sous-traitance pédagogique', account_type: 'charge' },
    { account_number: '621', label: 'Personnel extérieur / Vacataires', account_type: 'charge' },
    { account_number: '6228', label: 'Honoraires formateurs externes', account_type: 'charge' },
    { account_number: '625', label: 'Déplacements, missions', account_type: 'charge' },
    { account_number: '641', label: 'Rémunérations du personnel', account_type: 'charge' },
    { account_number: '6411', label: 'Salaires formateurs', account_type: 'charge' },
    { account_number: '6412', label: 'Salaires administratifs', account_type: 'charge' },
    { account_number: '645', label: 'Charges sociales', account_type: 'charge' },
    { account_number: '44566', label: 'TVA déductible', account_type: 'tva' },
    { account_number: '44571', label: 'TVA collectée', account_type: 'tva' },
  ];

  const { error } = await supabase
    .from('accounting_accounts')
    .insert(defaults.map(d => ({ ...d, establishment_id: establishmentId })));
  
  if (error) throw error;
};

// ============= BPF (Bilan Pédagogique et Financier) =============
export const generateBPF = async (year?: number) => {
  const currentYear = year || new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  const [formationsRes, invoicesRes, employeesRes, hoursRes, fundingRes, feesRes] = await Promise.all([
    supabase.from('formations').select('*').gte('start_date', startDate).lte('start_date', endDate),
    supabase.from('invoices').select('total, status, subject').gte('issue_date', startDate).lte('issue_date', endDate),
    supabase.from('employees').select('*, contracts(*)').eq('is_active', true),
    supabase.from('instructor_hours').select('*').eq('period_year', currentYear),
    supabase.from('funding_sources').select('*').gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('student_fees').select('*').gte('created_at', startDate).lte('created_at', endDate),
  ]);

  const formations = formationsRes.data || [];
  const invoices = invoicesRes.data || [];
  const employees = employeesRes.data || [];
  const hours = hoursRes.data || [];
  const funding = fundingRes.data || [];
  const fees = feesRes.data || [];

  const totalCA = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const totalFunding = funding.reduce((s, f) => s + Number(f.amount_granted || 0), 0);
  const totalFees = fees.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalHoursPlanned = hours.reduce((s, h) => s + Number(h.planned_hours || 0), 0);
  const totalHoursActual = hours.reduce((s, h) => s + Number(h.actual_hours || 0), 0);
  const totalInstructorCost = hours.reduce((s, h) => s + Number(h.total_cost || 0), 0);

  const fundingByType: Record<string, number> = {};
  funding.forEach(f => {
    fundingByType[f.funding_type] = (fundingByType[f.funding_type] || 0) + Number(f.amount_granted || 0);
  });

  return {
    year: currentYear,
    formationsCount: formations.length,
    totalCA,
    totalFunding,
    totalStudentFees: totalFees,
    fundingByType,
    employeesCount: employees.length,
    instructorsCount: employees.filter(e => e.department === 'Formation' || e.position?.includes('formateur')).length,
    totalHoursPlanned,
    totalHoursActual,
    totalInstructorCost,
    hoursCompletionRate: totalHoursPlanned > 0 ? Math.round((totalHoursActual / totalHoursPlanned) * 100) : 0,
  };
};

// ============= COST CENTERS =============
export const getCostCenterReport = async (year?: number) => {
  const currentYear = year || new Date().getFullYear();

  const [formationsRes, hoursRes, expensesRes, invoicesRes] = await Promise.all([
    supabase.from('formations').select('id, title, price, max_students'),
    supabase.from('instructor_hours').select('*, formations(title)').eq('period_year', currentYear),
    supabase.from('expense_reports').select('*, formations(title)').gte('expense_date', `${currentYear}-01-01`),
    supabase.from('invoices').select('total, subject').gte('issue_date', `${currentYear}-01-01`).lte('issue_date', `${currentYear}-12-31`),
  ]);

  const formations = formationsRes.data || [];
  const hours = hoursRes.data || [];
  const expenses = expensesRes.data || [];

  const costByFormation = formations.map(f => {
    const formationHours = hours.filter(h => h.formation_id === f.id);
    const formationExpenses = expenses.filter(e => e.formation_id === f.id);
    const instructorCost = formationHours.reduce((s, h) => s + Number(h.total_cost || 0), 0);
    const expenseCost = formationExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const revenue = Number(f.price || 0) * Number(f.max_students || 0);

    return {
      formationId: f.id,
      formationTitle: f.title,
      instructorCost,
      expenseCost,
      totalCost: instructorCost + expenseCost,
      estimatedRevenue: revenue,
      margin: revenue - (instructorCost + expenseCost),
    };
  });

  return { year: currentYear, costByFormation };
};
