import React, { useState } from 'react';
import { useData } from '../lib/DataContext';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { km } from 'date-fns/locale';
import { Search, Filter, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export function History() {
  const { readings, houses, loading } = useData();
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  if (loading) return <div className="p-4">កំពុងផ្ទុក...</div>;

  const filteredReadings = readings.filter(r => r.date.startsWith(filterYear));

  // Extract unique years
  const years = Array.from(new Set(readings.map(r => r.date.substring(0, 4)))).sort((a, b) => b.localeCompare(a));
  if (!years.includes(new Date().getFullYear().toString())) {
    years.unshift(new Date().getFullYear().toString());
  }

  return (
    <div className="p-4 pt-8 md:pt-12 mb-20 md:mb-6 max-w-3xl mx-auto flex flex-col gap-6">
      
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
         <h1 className="text-xl font-bold text-gray-900">ប្រវត្តិទិន្នន័យ</h1>
         <div className="flex gap-2">
           <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
             <Search size={18} />
           </button>
           <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
             <Filter size={18} />
           </button>
         </div>
      </header>

      <div className="bg-white rounded-xl p-2 inline-flex shadow-sm border border-gray-200 w-fit">
        <select 
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="bg-transparent text-gray-800 font-medium py-2 px-4 pr-8 focus:outline-none appearance-none cursor-pointer"
          style={{ background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E") no-repeat right 10px center/12px' }}
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredReadings.map((reading, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={reading.id} 
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col gap-4"
          >
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
               <div className="flex items-center gap-2">
                 <Calendar className="text-brand-500" size={18} />
                 <span className="font-bold text-gray-800">
                    ខែ {format(new Date(reading.date), 'MMMM', { locale: km })} {format(new Date(reading.date), 'yyyy')}
                 </span>
               </div>
               <span className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-md font-mono">
                 {format(new Date(reading.date), 'dd/MM/yyyy')}
               </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">គីឡូប្រើសរុប</div>
                <div className="font-mono font-bold text-gray-800">{reading.totalUnits} kWh</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">ទឹកប្រាក់សរុប</div>
                <div className="font-bold text-brand-600 text-lg">{formatCurrency(reading.totalCost)}</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 mt-2">
               {houses.map(house => {
                 const hr = (reading as any).houseReadings?.[house.id!];
                 if(!hr) return null;
                 return (
                   <div key={house.id} className="flex justify-between items-center text-sm">
                     <span className="text-gray-600 font-medium">ផ្ទះ {house.name}</span>
                     <div>
                       <span className="font-mono text-gray-500 mr-3">{hr.units} kWh</span>
                       <span className="font-bold text-gray-800">{formatCurrency(hr.cost)}</span>
                     </div>
                   </div>
                 );
               })}
            </div>
          </motion.div>
        ))}
        {filteredReadings.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500">មិនមានទិន្នន័យក្នុងឆ្នាំនេះទេ</p>
          </div>
        )}
      </div>

    </div>
  );
}
