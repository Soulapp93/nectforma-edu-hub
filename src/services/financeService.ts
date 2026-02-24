import { supabase } from '@/integrations/supabase/client';

// ============= BILLING CLIENTS =============
export const getBillingClients = async () => {
  const { data, error } = await supabase
    .from('billing_clients')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
};

export const createBillingClient = async (client: any) => {
  const { data, error } = await supabase
    .from('billing_clients')
    .insert(client)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateBillingClient = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('billing_clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteBillingClient = async (id: string) => {
  const { error } = await supabase.from('billing_clients').delete().eq('id', id);
  if (error) throw error;
};

// ============= QUOTES =============
export const getQuotes = async () => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, billing_clients(*), quote_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getQuoteById = async (id: string) => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, billing_clients(*), quote_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const createQuote = async (quote: any) => {
  const { data, error } = await supabase
    .from('quotes')
    .insert(quote)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateQuote = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('quotes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteQuote = async (id: string) => {
  const { error } = await supabase.from('quotes').delete().eq('id', id);
  if (error) throw error;
};

// ============= QUOTE ITEMS =============
export const createQuoteItem = async (item: any) => {
  const { data, error } = await supabase
    .from('quote_items')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateQuoteItem = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('quote_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteQuoteItem = async (id: string) => {
  const { error } = await supabase.from('quote_items').delete().eq('id', id);
  if (error) throw error;
};

// ============= INVOICES =============
export const getInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, billing_clients(*), invoice_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getInvoiceById = async (id: string) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, billing_clients(*), invoice_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const createInvoice = async (invoice: any) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateInvoice = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteInvoice = async (id: string) => {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
};

// ============= INVOICE ITEMS =============
export const createInvoiceItem = async (item: any) => {
  const { data, error } = await supabase
    .from('invoice_items')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateInvoiceItem = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('invoice_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteInvoiceItem = async (id: string) => {
  const { error } = await supabase.from('invoice_items').delete().eq('id', id);
  if (error) throw error;
};

// ============= PAYMENTS =============
export const getPayments = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select('*, invoices(*, billing_clients(*))')
    .order('payment_date', { ascending: false });
  if (error) throw error;
  return data;
};

export const createPayment = async (payment: any) => {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deletePayment = async (id: string) => {
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
};

// ============= UTILITIES =============
export const generateQuoteNumber = async () => {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true });
  return `DEV-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
};

export const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true });
  return `FAC-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
};

export const convertQuoteToInvoice = async (quoteId: string) => {
  const quote = await getQuoteById(quoteId);
  if (!quote) throw new Error('Devis introuvable');

  const invoiceNumber = await generateInvoiceNumber();
  
  const invoice = await createInvoice({
    establishment_id: quote.establishment_id,
    client_id: quote.client_id,
    quote_id: quoteId,
    invoice_number: invoiceNumber,
    subject: quote.subject,
    notes: quote.notes,
    subtotal: quote.subtotal,
    tax_rate: quote.tax_rate,
    tax_amount: quote.tax_amount,
    total: quote.total,
    discount_percent: quote.discount_percent,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_by: quote.created_by,
  });

  // Copy items
  if (quote.quote_items) {
    for (const item of quote.quote_items) {
      await createInvoiceItem({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        order_index: item.order_index,
      });
    }
  }

  // Update quote status
  await updateQuote(quoteId, { status: 'converted', converted_invoice_id: invoice.id });

  return invoice;
};
