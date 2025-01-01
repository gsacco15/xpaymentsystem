import React, { useState } from 'react';
import { PaymentForm } from './components/PaymentForm';
import { XPayments, PaymentResponse, PaymentError } from './lib/xPayments';
import { ShieldCheck, AlertCircle, Moon, Sun } from 'lucide-react';

// Initialize X Payments with test API key
XPayments.init({
  apiKey: 'test_key_123',
  mode: 'test',
});

function App() {
  const [result, setResult] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState<PaymentError | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const handleSuccess = (payment: PaymentResponse) => {
    setResult(payment);
    setError(null);
  };

  const handleError = (error: PaymentError) => {
    setError(error);
    setResult(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-[#111111]' : 'bg-gray-50'}`}>
      <div className="relative py-12 px-4 sm:px-6 lg:px-8">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors duration-200 hover:bg-gray-300 dark:hover:bg-gray-700"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="max-w-md mx-auto">
          <PaymentForm 
            onSuccess={handleSuccess} 
            onError={handleError}
            metadata={{ source: 'web', version: '1.0.0' }}
          />
          
          {result && (
            <div className="mt-6 p-6 bg-white dark:bg-[#1a1a1a] border border-green-100 dark:border-green-900/30 rounded-xl shadow-xl animate-fade-in backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <ShieldCheck className="h-6 w-6 text-green-500 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Successful</h3>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Payment ID:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-200">{result.id}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">
                    {result.amount} {result.currency}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                    {result.status}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Date:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">
                    {new Date(result.created_at).toLocaleString()}
                  </span>
                </p>
                {result.description && (
                  <p className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Description:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">{result.description}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-6 bg-white dark:bg-[#1a1a1a] border border-red-100 dark:border-red-900/30 rounded-xl shadow-xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Failed</h3>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Error Code: {error.code}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;