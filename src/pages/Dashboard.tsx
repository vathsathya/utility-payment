import React from 'react';
import { useData } from '../lib/DataContext';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Zap, Calendar, Home, Wallet, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { km } from 'date-fns/locale';

export function Dashboard() {
  const { houses, readings, loading } = useData();

  if (loading) {
    return <div className="p-4">កំពុងផ្ទុកទិន្នន័យ...</div>;
  }

  // Get current active reading (most recent)
  const currentReading = readings.length > 0 ? readings[0] : null;

  return (
    <div className="p-4 pt-8 md:pt-12 min-h-screen bg-gray-50 flex flex-col gap-6">
      
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
            <Zap size={20} />
          </div>
          <h1 className="text-lg font-bold text-gray-900">ថ្លៃអគ្គិសនី</h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100">
          <Bell size={20} />
        </button>
      </header>

      {currentReading ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="bg-white border text-center border-brand-100 rounded-2xl p-4 shadow-sm flex items-center justify-center gap-2">
             <Calendar className="text-brand-600" size={20} />
             <span className="font-semibold text-gray-800 text-sm">
                ខែ {format(new Date(currentReading.date), 'MMMM yyyy', { locale: km })}
             </span>
          </div>

          {houses.map((house) => {
            const houseReading = (currentReading as any).houseReadings?.[house.id!];
            if (!houseReading) return null;

            return (
              <div key={house.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
                    <Home size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">ផ្ទះ: {house.name}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">{house.meterNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900">{houseReading.units} kWh</div>
                  <div className="text-brand-600 font-bold mt-1">{formatCurrency(houseReading.cost)}</div>
                </div>
              </div>
            );
          })}

          <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-sm border-none mt-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-brand-400">
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-300">ការទស្សន៍ទាយសម្រាប់ការប្រើប្រាស់ខែក្រោយ</h3>
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2 relative z-10">
              {formatCurrency(currentReading.totalCost)}
            </div>
            <div className="text-gray-400 font-medium relative z-10">
              សរុប {currentReading.totalUnits} kWh
            </div>
          </div>

        </motion.div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
          <p className="text-gray-500 mb-4">មិនទាន់មានទិន្នន័យ</p>
        </div>
      )}
      
    </div>
  );
}
