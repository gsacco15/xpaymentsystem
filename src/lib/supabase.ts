import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Initializing Supabase with URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type PaymentRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  amount: number;
  currency: string;
  status: string;
  customer_email?: string;
  customer_name?: string;
  description?: string;
  metadata?: Record<string, any>;
};

export async function createPaymentRecord(payment: Omit<PaymentRecord, 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('payments')
    .insert([payment])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPaymentById(id: string) {
  const { data, error } = await supabase
    .from('payments')
    .select()
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updatePaymentStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('payments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRecentPayments(limit = 10) {
  const { data, error } = await supabase
    .from('payments')
    .select()
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getPaymentsByEmail(email: string) {
  const { data, error } = await supabase
    .from('payments')
    .select()
    .eq('customer_email', email)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
} 