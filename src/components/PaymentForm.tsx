import React, { useState } from 'react';
import { CreditCard, DollarSign, FileText, Lock, Mail, User, X } from 'lucide-react';
import { XPayments, PaymentResponse, PaymentError } from '../lib/xPayments';
import { supabase } from '../lib/supabase';

interface PaymentFormProps {
  onSuccess?: (payment: PaymentResponse) => void;
  onError?: (error: PaymentError) => void;
  metadata?: Record<string, any>;
}

export function PaymentForm({ onSuccess, onError, metadata }: PaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting payment submission...');
      
      // Process payment with XPayments
      const payment = await XPayments.createPayment({
        amount: parseFloat(amount),
        currency,
        description,
        metadata,
        customer: {
          email,
          name
        }
      });

      console.log('Payment processed successfully:', payment);

      // Save payment to Supabase
      const supabasePayload = {
        id: payment.id,
        amount: parseFloat(amount),
        currency,
        status: payment.status,
        customer_email: email,
        customer_name: name,
        description,
        metadata: metadata || {}
      };
      
      console.log('Attempting to save to Supabase with payload:', supabasePayload);
      
      const { data, error: supabaseError } = await supabase
        .from('payments')
        .insert([supabasePayload])
        .select();

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(`Failed to save payment record: ${supabaseError.message}`);
      }
      
      console.log('Successfully saved to Supabase:', data);

      onSuccess?.(payment);
    } catch (error) {
      console.error('Payment or Supabase error:', error);
      onError?.(error as PaymentError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 mb-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
          <X className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">X Payments</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Quick and secure payments</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800/50 backdrop-blur-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                max="99999.99"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full pl-10 pr-20 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 dark:text-gray-300 sm:text-sm rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full pl-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#242424] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
                placeholder="Payment description"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] dark:focus:ring-offset-gray-900"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Pay Securely</span>
              </div>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-6">
          <Lock className="w-4 h-4" />
          <span>Secured by X Payments</span>
        </div>
      </form>
    </div>
  );
}