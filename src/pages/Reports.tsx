import React, { useState } from 'react';
import { useData } from '../lib/DataContext';
import { formatCurrency } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { km } from 'date-fns/locale';
import { Brain, FileText, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export function Reports() {
  const { readings, houses, loading } = useData();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisValue, setAnalysisValue] = useState("");
  const [forecasting, setForecasting] = useState(false);
  const [forecastValue, setForecastValue] = useState("");

  if (loading) return <div className="p-4">កំពុងផ្ទុក...</div>;

  // Prepare chart data (reverse readings for chronological order)
  const chartData = [...readings].reverse().slice(-12).map(r => {
    const d = { month: format(new Date(r.date), 'MMM', { locale: km }) };
    houses.forEach(h => {
      (d as any)[h.name] = (r as any).houseReadings?.[h.id!]?.units || 0;
    });
    return d;
  });

  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const historicalData = readings.slice(1, 6).map(r => ({ date: r.month, units: r.totalUnits }));
      const currentMonth = readings[0] ? { date: readings[0].month, units: readings[0].totalUnits } : null;
      
      const res = await fetch("/api/analyze-consumption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historicalData, currentMonth })
      });
      const data = await res.json();
      setAnalysisValue(data.analysis);
    } catch(e) {
      alert("មានបញ្ហា ក្នុងការវិភាគ");
    }
    setAnalyzing(false);
  };

  const handleForecast = async () => {
    setForecasting(true);
    try {
      const historicalData = readings.slice(0, 6).map(r => ({ date: r.month, units: r.totalUnits }));
      
      const res = await fetch("/api/predict-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historicalData })
      });
      const data = await res.json();
      setForecastValue(data.forecast);
    } catch(e) {
      alert("មានបញ្ហា");
    }
    setForecasting(false);
  };

  return (
    <div className="p-4 pt-8 md:pt-12 mb-20 md:mb-6 max-w-3xl mx-auto flex flex-col gap-6">
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
         <h1 className="text-xl font-bold text-gray-900">របាយការណ៍ និងក្រាហ្វិក</h1>
      </header>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-2">
        <div className="flex items-center justify-between mb-6">
           <h2 className="font-bold text-gray-800 flex items-center gap-2">
             <Activity className="text-brand-600" size={18} />
             ការប្រើប្រាស់ (kWh)
           </h2>
           <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">១២ ខែចុងក្រោយ</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              {houses.map((h, i) => (
                 <Line key={h.id} type="monotone" dataKey={h.name} stroke={colors[i % colors.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Helper Box: Analyze */}
        <div className="bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-500 p-5 rounded-2xl relative overflow-hidden">
           <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-brand-600">
                <Brain size={20} />
              </div>
              <button 
                onClick={handleAnalyze} disabled={analyzing}
                className="bg-brand-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-brand-700 transition"
              >
                {analyzing ? 'កំពុងវិភាគ...' : 'វិភាគទិន្នន័យ (AI)'}
              </button>
           </div>
           <h3 className="font-bold text-gray-900 relative z-10 mb-2">មូលហេតុនៃការប្រែប្រួល</h3>
           <div className="text-sm text-gray-700 relative z-10 leading-relaxed min-h-[40px]">
             {analysisValue ? analysisValue : 'ចុចលើប៊ូតុងដើម្បីឱ្យ AI វិភាគ។'}
           </div>
        </div>

        {/* Helper Box: Forecast */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-500 p-5 rounded-2xl relative overflow-hidden">
           <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-blue-600">
                <Activity size={20} />
              </div>
              <button 
                onClick={handleForecast} disabled={forecasting}
                className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
              >
                {forecasting ? 'កំពុងគណនា...' : 'ព្យាករណ៍ខែបន្ទាប់'}
              </button>
           </div>
           <h3 className="font-bold text-gray-900 relative z-10 mb-2">ការព្យាករណ៍ (AI)</h3>
           <div className="text-sm text-gray-700 relative z-10 leading-relaxed min-h-[40px]">
             {forecastValue ? forecastValue : 'ចុចលើប៊ូតុងដើម្បីឱ្យ AI ព្យាករណ៍។'}
           </div>
        </div>
      </div>

    </div>
  );
}
