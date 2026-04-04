
-- BATCH 2: Financial & HR tables - policies only applied if table exists

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounting_accounts') THEN
    DROP POLICY IF EXISTS "Admins manage accounting accounts" ON public.accounting_accounts;
    CREATE POLICY "Admins manage accounting accounts" ON public.accounting_accounts FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounting_entries') THEN
    DROP POLICY IF EXISTS "Admins manage accounting entries" ON public.accounting_entries;
    CREATE POLICY "Admins manage accounting entries" ON public.accounting_entries FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_clients') THEN
    DROP POLICY IF EXISTS "Admins manage billing clients" ON public.billing_clients;
    CREATE POLICY "Admins manage billing clients" ON public.billing_clients FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contracts') THEN
    DROP POLICY IF EXISTS "Admins manage contracts" ON public.contracts;
    CREATE POLICY "Admins manage contracts" ON public.contracts FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    DROP POLICY IF EXISTS "Admins manage employees" ON public.employees;
    CREATE POLICY "Admins manage employees" ON public.employees FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_reports') THEN
    DROP POLICY IF EXISTS "Admins manage expense reports" ON public.expense_reports;
    CREATE POLICY "Admins manage expense reports" ON public.expense_reports FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'funding_sources') THEN
    DROP POLICY IF EXISTS "Admins manage funding sources" ON public.funding_sources;
    CREATE POLICY "Admins manage funding sources" ON public.funding_sources FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'instructor_hours') THEN
    DROP POLICY IF EXISTS "Admins manage instructor hours" ON public.instructor_hours;
    CREATE POLICY "Admins manage instructor hours" ON public.instructor_hours FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    DROP POLICY IF EXISTS "Admins manage invoices" ON public.invoices;
    CREATE POLICY "Admins manage invoices" ON public.invoices FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_items') THEN
    DROP POLICY IF EXISTS "Admins manage invoice items" ON public.invoice_items;
    CREATE POLICY "Admins manage invoice items" ON public.invoice_items FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_items.invoice_id AND i.establishment_id = get_current_user_establishment()) AND is_current_user_admin())
      WITH CHECK (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_items.invoice_id AND i.establishment_id = get_current_user_establishment()) AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leave_requests') THEN
    DROP POLICY IF EXISTS "Admins manage leave requests" ON public.leave_requests;
    CREATE POLICY "Admins manage leave requests" ON public.leave_requests FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
    CREATE POLICY "Admins manage payments" ON public.payments FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payslips') THEN
    DROP POLICY IF EXISTS "Admins manage payslips" ON public.payslips;
    CREATE POLICY "Admins manage payslips" ON public.payslips FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
    DROP POLICY IF EXISTS "Admins manage quotes" ON public.quotes;
    CREATE POLICY "Admins manage quotes" ON public.quotes FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
    DROP POLICY IF EXISTS "Admins manage quote items" ON public.quote_items;
    CREATE POLICY "Admins manage quote items" ON public.quote_items FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_items.quote_id AND q.establishment_id = get_current_user_establishment()) AND is_current_user_admin())
      WITH CHECK (EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_items.quote_id AND q.establishment_id = get_current_user_establishment()) AND is_current_user_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invitations') THEN
    DROP POLICY IF EXISTS "Admins manage invitations" ON public.invitations;
    CREATE POLICY "Admins manage invitations" ON public.invitations FOR ALL TO authenticated
      USING (establishment_id = get_current_user_establishment() AND is_current_user_admin())
      WITH CHECK (establishment_id = get_current_user_establishment() AND is_current_user_admin());
  END IF;
END $$;
