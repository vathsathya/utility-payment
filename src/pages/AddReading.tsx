import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { formatCurrency, cn } from '../lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Camera, Calculator, CheckCircle2, RefreshCw, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AddReading() {
  const { houses, loading } = useData();
  const { user } = useAuth();
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recognizingId, setRecognizingId] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, getValues, reset } = useForm({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      rate: 730,
      houseReadings: {} as Record<string, { previous: number; current: number }>,
    }
  });

  // Calculate fields
  const [calculatedReadings, setCalculatedReadings] = useState<Record<string, { units: number, cost: number }>>({});
  const [totalUnits, setTotalUnits] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    // Load last month previous readings
    const loadLastReadings = async () => {
      try {
        const q = query(collection(db, 'readings'), orderBy('date', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const lastReading = snapshot.docs[0].data();
          const houseReadings = lastReading.houseReadings || {};
          
          houses.forEach(house => {
            if (houseReadings[house.id!]) {
              setValue(`houseReadings.${house.id!}.previous`, houseReadings[house.id!].current);
            } else {
              setValue(`houseReadings.${house.id!}.previous`, 0);
            }
          });
        }
      } catch(e) {
        console.error(e);
      }
    };
    
    if (houses.length > 0) {
      loadLastReadings();
    }
  }, [houses, setValue]);

  const handleCalculate = () => {
    setIsCalculating(true);
    const data = getValues();
    const rate = Number(data.rate);
    const calcs: Record<string, { units: number; cost: number }> = {};
    let tUnits = 0;
    let tCost = 0;

    houses.forEach((house) => {
      const houseData = data.houseReadings[house.id!];
      const prev = Number(houseData?.previous || 0);
      const curr = Number(houseData?.current || 0);
      
      const units = Math.max(0, curr - prev);
      const cost = units * rate;
      
      calcs[house.id!] = { units, cost };
      tUnits += units;
      tCost += cost;
    });

    setCalculatedReadings(calcs);
    setTotalUnits(tUnits);
    setTotalCost(tCost);
    
    setTimeout(() => setIsCalculating(false), 500);
  };

  const handleRecognizeMeter = async (houseId: string, file: File) => {
    setRecognizingId(houseId);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/recognize-meter", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.reading) {
        setValue(`houseReadings.${houseId}.current`, data.reading);
      } else {
        alert("មិនអាចអានលេខកុងទ័របានទេ សូមសាកល្បងម្ដងទៀត។");
      }
    } catch (e) {
      console.error(e);
      alert("មានបញ្ហាក្នុងការអានរូបភាព");
    } finally {
      setRecognizingId(null);
    }
  };

  const onSubmit = async (data: any) => {
    if (user?.role !== 'admin') {
      alert("មានតែគណនី Admin ប៉ុណ្ណោះដែលអាចបញ្ចូលទិន្នន័យបាន។");
      return;
    }

    if (Object.keys(calculatedReadings).length === 0) {
      alert("សូមចុចប៊ូតុង គណនា ជាមុនសិន។");
      return;
    }

    setIsSaving(true);
    try {
      const monthStr = format(new Date(data.date), 'yyyy-MM');
      const readingId = `${monthStr}-${new Date().getTime()}`;
      
      // Combine data
      const finalHouseReadings: Record<string, any> = {};
      houses.forEach(h => {
         const hId = h.id!;
         const hr = data.houseReadings[hId];
         const calc = calculatedReadings[hId];
         finalHouseReadings[hId] = {
           houseId: hId,
           previous: Number(hr.previous),
           current: Number(hr.current),
           units: calc.units,
           cost: calc.cost
         };
      });

      const payload = {
        date: data.date,
        month: monthStr,
        rate: Number(data.rate),
        totalUnits,
        totalCost,
        houseReadings: finalHouseReadings,
        authorId: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "readings", readingId), payload);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCalculatedReadings({});
        reset();
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "readings");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-4">កំពុងផ្ទុក...</div>;

  return (
    <div className="p-4 md:p-6 mb-20 md:mb-6 max-w-3xl mx-auto">
      <header className="mb-6 pt-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">បញ្ចូលទិន្នន័យថ្មី</h1>
      </header>

      {success && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-brand-50 text-brand-700 p-4 rounded-2xl flex items-center gap-3">
          <CheckCircle2 size={24} />
          <span className="font-medium">ការបញ្ចូលជោគជ័យ!</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Top controls */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex gap-4 md:flex-row flex-col">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-2">កាលបរិច្ឆេទ</label>
            <input 
              type="date" 
              {...register('date')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-2">អត្រាភ្លើង (៛/kWh)</label>
            <input 
              type="number" 
              {...register('rate')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
        </div>

        {/* Houses */}
        {houses.map(house => (
          <div key={house.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 pb-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Home size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">ផ្ទះ: {house.name}</h3>
                <p className="text-xs text-gray-400 font-mono">{house.meterNumber}</p>
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                 <label className="block text-xs font-semibold text-gray-500 mb-1">លេខដើម</label>
                 <input 
                   type="number" 
                   {...register(`houseReadings.${house.id!}.previous`)}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono focus:ring-2 focus:ring-brand-500 text-gray-600"
                 />
              </div>
              <div className="flex-1">
                 <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-500">លេខថ្មី</label>
                    <label className="text-brand-600 cursor-pointer hover:bg-brand-50 p-1 rounded-md transition-colors" title="ស្កេនរូបភាពកុងទ័រ">
                       {recognizingId === house.id ? <RefreshCw className="animate-spin" size={14} /> : <Camera size={14} />}
                       <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                         if(e.target.files?.[0]) handleRecognizeMeter(house.id!, e.target.files[0]);
                       }} />
                    </label>
                 </div>
                 <input 
                   type="number" 
                   {...register(`houseReadings.${house.id!}.current`)}
                   className="w-full bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 font-mono focus:ring-2 focus:ring-brand-500 text-blue-900 font-bold"
                 />
              </div>
            </div>
            
            {calculatedReadings[house.id!] && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 bg-gray-50 rounded-xl p-4 flex justify-between items-center text-sm">
                <div>ប្រើប្រាស់: <strong className="font-mono text-gray-900">{calculatedReadings[house.id!].units} kWh</strong></div>
                <div>តម្លៃ: <strong className="text-brand-600 text-base">{formatCurrency(calculatedReadings[house.id!].cost)}</strong></div>
              </motion.div>
            )}
          </div>
        ))}
        
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCalculate}
            disabled={isCalculating}
            className="flex-1 bg-white border border-gray-200 text-gray-800 font-medium py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            {isCalculating ? <RefreshCw className="animate-spin w-5 h-5" /> : <Calculator className="w-5 h-5" />}
            គណនា
          </button>
        </div>

        {Object.keys(calculatedReadings).length > 0 && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-600 rounded-2xl p-6 shadow-lg shadow-brand-500/20 text-white mt-4">
              <div className="flex justify-between items-end mb-4">
                 <div>
                    <div className="text-brand-100 text-sm mb-1">សរុបប្រាក់ត្រូវបង់</div>
                    <div className="text-3xl font-bold">{formatCurrency(totalCost)}</div>
                 </div>
                 <div className="text-right">
                    <div className="text-brand-100 text-sm mb-1">សរុបគីឡូ (kWh)</div>
                    <div className="text-xl font-bold font-mono text-white">{totalUnits}</div>
                 </div>
              </div>
              <button
                type="submit"
                disabled={isSaving || user?.role !== 'admin'}
                className="w-full bg-white text-brand-700 font-bold py-4 rounded-xl shadow-sm mt-4 hover:bg-brand-50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw className="animate-spin" /> : "រក្សាទុក"}
              </button>
           </motion.div>
        )}

      </form>
    </div>
  );
}
