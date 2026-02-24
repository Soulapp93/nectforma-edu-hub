
-- =============================================
-- MODULE FINANCE : Devis, Factures, Paiements
-- =============================================

-- Statuts pour devis et factures
CREATE TYPE public.quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded');
CREATE TYPE public.payment_method AS ENUM ('bank_transfer', 'check', 'cash', 'card', 'other');

-- Table des clients (contacts de facturation)
CREATE TABLE public.billing_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'France',
  siret TEXT,
  vat_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Devis
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.billing_clients(id),
  quote_number TEXT NOT NULL,
  status public.quote_status NOT NULL DEFAULT 'draft',
  subject TEXT NOT NULL,
  notes TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  validity_date DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 20.00,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  converted_invoice_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lignes de devis
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Factures
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.billing_clients(id),
  quote_id UUID REFERENCES public.quotes(id),
  invoice_number TEXT NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  subject TEXT NOT NULL,
  notes TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 20.00,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lignes de facture
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Paiements
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method public.payment_method NOT NULL DEFAULT 'bank_transfer',
  reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- MODULE RH : Personnel, Contrats, Congés, Paie
-- =============================================

CREATE TYPE public.contract_type AS ENUM ('CDI', 'CDD', 'interim', 'freelance', 'apprenticeship', 'internship', 'other');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE public.leave_type AS ENUM ('paid_leave', 'sick_leave', 'unpaid_leave', 'maternity', 'paternity', 'training', 'other');

-- Employés / Personnel
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  user_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  date_of_birth DATE,
  social_security_number TEXT,
  position TEXT,
  department TEXT,
  hire_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  gross_salary NUMERIC(12,2),
  net_salary NUMERIC(12,2),
  profile_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contrats
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  contract_type public.contract_type NOT NULL DEFAULT 'CDI',
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  weekly_hours NUMERIC(5,2) DEFAULT 35,
  gross_salary NUMERIC(12,2),
  trial_period_end DATE,
  document_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Demandes de congés
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type public.leave_type NOT NULL DEFAULT 'paid_leave',
  status public.leave_status NOT NULL DEFAULT 'pending',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count NUMERIC(5,1) NOT NULL DEFAULT 1,
  reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fiches de paie
CREATE TABLE public.payslips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL,
  gross_salary NUMERIC(12,2) NOT NULL,
  net_salary NUMERIC(12,2) NOT NULL,
  employer_charges NUMERIC(12,2) DEFAULT 0,
  employee_charges NUMERIC(12,2) DEFAULT 0,
  bonuses NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  document_url TEXT,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period_month, period_year)
);

-- =============================================
-- MODULE COMPTABILITÉ
-- =============================================

-- Plan comptable
CREATE TABLE public.accounting_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  label TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'general',
  parent_account_id UUID REFERENCES public.accounting_accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, account_number)
);

-- Écritures comptables
CREATE TABLE public.accounting_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  journal TEXT NOT NULL DEFAULT 'OD',
  piece_number TEXT,
  label TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounting_accounts(id),
  debit NUMERIC(12,2) NOT NULL DEFAULT 0,
  credit NUMERIC(12,2) NOT NULL DEFAULT 0,
  invoice_id UUID REFERENCES public.invoices(id),
  payment_id UUID REFERENCES public.payments(id),
  is_validated BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.billing_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;

-- Finance: Admin/AdminPrincipal only
CREATE POLICY "Admins manage billing clients" ON public.billing_clients FOR ALL
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());

CREATE POLICY "Admins manage quotes" ON public.quotes FOR ALL
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());

CREATE POLICY "Admins manage quote items" ON public.quote_items FOR ALL
  USING (quote_id IN (SELECT id FROM public.quotes WHERE establishment_id = get_current_user_establishment()) AND is_current_user_admin());

CREATE POLICY "Admins manage invoices" ON public.invoices FOR ALL
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());

CREATE POLICY "Admins manage invoice items" ON public.invoice_items FOR ALL
  USING (invoice_id IN (SELECT id FROM public.invoices WHERE establishment_id = get_current_user_establishment()) AND is_current_user_admin());

CREATE POLICY "Admins manage payments" ON public.payments FOR ALL
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());

-- RH: Admin/AdminPrincipal only
CREATE POLICY "Admins manage employees" ON public.employees FOR ALL
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());

CREATE POLICY "Admins manage contracts" ON public.contracts FOR ALL
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());

CREATE POLICY "Admins manage leave requests" ON public.leave_requests FOR ALL
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());

CREATE POLICY "Admins manage payslips" ON public.payslips FOR ALL
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());

-- Comptabilité: Admin/AdminPrincipal only
CREATE POLICY "Admins manage accounting accounts" ON public.accounting_accounts FOR ALL
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());

CREATE POLICY "Admins manage accounting entries" ON public.accounting_entries FOR ALL
  USING (establishment_id = get_current_user_establishment() AND is_current_user_admin());

-- Triggers updated_at
CREATE TRIGGER update_billing_clients_updated_at BEFORE UPDATE ON public.billing_clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_payslips_updated_at BEFORE UPDATE ON public.payslips FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_accounting_accounts_updated_at BEFORE UPDATE ON public.accounting_accounts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_accounting_entries_updated_at BEFORE UPDATE ON public.accounting_entries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
