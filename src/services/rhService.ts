import { supabase } from '@/integrations/supabase/client';

// ============= EMPLOYEES =============
export const getEmployees = async () => {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('last_name');
  if (error) throw error;
  return data;
};

export const getEmployeeById = async (id: string) => {
  const { data, error } = await supabase
    .from('employees')
    .select('*, contracts(*), leave_requests(*), payslips(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const createEmployee = async (employee: any) => {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateEmployee = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteEmployee = async (id: string) => {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
};

// ============= CONTRACTS =============
export const getContracts = async () => {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, employees(*)')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data;
};

export const createContract = async (contract: any) => {
  const { data, error } = await supabase
    .from('contracts')
    .insert(contract)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateContract = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteContract = async (id: string) => {
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) throw error;
};

// ============= LEAVE REQUESTS =============
export const getLeaveRequests = async () => {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, employees(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createLeaveRequest = async (request: any) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert(request)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateLeaveRequest = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteLeaveRequest = async (id: string) => {
  const { error } = await supabase.from('leave_requests').delete().eq('id', id);
  if (error) throw error;
};

// ============= PAYSLIPS =============
export const getPayslips = async () => {
  const { data, error } = await supabase
    .from('payslips')
    .select('*, employees(*)')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });
  if (error) throw error;
  return data;
};

export const createPayslip = async (payslip: any) => {
  const { data, error } = await supabase
    .from('payslips')
    .insert(payslip)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePayslip = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('payslips')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deletePayslip = async (id: string) => {
  const { error } = await supabase.from('payslips').delete().eq('id', id);
  if (error) throw error;
};
