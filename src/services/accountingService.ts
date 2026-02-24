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

// Default chart of accounts (French PCG)
export const seedDefaultAccounts = async (establishmentId: string) => {
  const defaults = [
    { account_number: '411', label: 'Clients', account_type: 'tiers' },
    { account_number: '401', label: 'Fournisseurs', account_type: 'tiers' },
    { account_number: '512', label: 'Banque', account_type: 'tresorerie' },
    { account_number: '530', label: 'Caisse', account_type: 'tresorerie' },
    { account_number: '706', label: 'Prestations de services', account_type: 'produit' },
    { account_number: '707', label: 'Vente de marchandises', account_type: 'produit' },
    { account_number: '601', label: 'Achats de matières premières', account_type: 'charge' },
    { account_number: '606', label: 'Achats non stockés', account_type: 'charge' },
    { account_number: '621', label: 'Personnel extérieur', account_type: 'charge' },
    { account_number: '641', label: 'Rémunérations du personnel', account_type: 'charge' },
    { account_number: '645', label: 'Charges sociales', account_type: 'charge' },
    { account_number: '44566', label: 'TVA déductible', account_type: 'tva' },
    { account_number: '44571', label: 'TVA collectée', account_type: 'tva' },
  ];

  const { error } = await supabase
    .from('accounting_accounts')
    .insert(defaults.map(d => ({ ...d, establishment_id: establishmentId })));
  
  if (error) throw error;
};
