import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-8"
      >
        <div className="mx-auto w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mb-4">
          <Zap size={32} />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Electricity Billing</h1>
          <p className="text-gray-500">គ្រប់គ្រងការប្រើប្រាស់អគ្គិសនីប្រចាំខែ</p>
        </div>

        <button
          onClick={login}
          className="w-full bg-brand-600 text-white font-medium py-4 rounded-2xl hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-600/20"
        >
          ចូលប្រើប្រាស់គណនី Google
        </button>
      </motion.div>
    </div>
  );
}
