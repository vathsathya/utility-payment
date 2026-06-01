import React, { useState } from 'react';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, deleteDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { LogOut, Home, Key, User, Plus, Trash2, Share2, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../types';

export function Settings() {
  const { houses, loading } = useData();
  const { user, logout } = useAuth();
  
  const [newHouseName, setNewHouseName] = useState("");
  const [newMeterNum, setNewMeterNum] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [sharingHouseId, setSharingHouseId] = useState<string | null>(null);

  React.useEffect(() => {
    if (user?.role === 'admin') {
      const fetchUsers = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'users'));
          setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserType)));
        } catch (error) {
          console.error("Failed to fetch users");
        }
      };
      fetchUsers();
    }
  }, [user]);

  const handleShareToggle = async (houseId: string, userId: string, isShared: boolean) => {
    const house = houses.find(h => h.id === houseId);
    if (!house) return;
    const currentShared = house.sharedWith || [];
    const newShared = isShared ? currentShared.filter(id => id !== userId) : [...currentShared, userId];
    try {
      await updateDoc(doc(db, 'houses', houseId), { 
        sharedWith: newShared,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
      alert("បរាជ័យក្នុងការចែករំលែក");
    }
  };

  const handleAddHouse = async () => {
    if (!newHouseName || !newMeterNum) return;
    if (user?.role !== 'admin') {
       alert("មានតែអ្នកគ្រប់គ្រង (Admin) ទើបមានសិទ្ធិបន្ថែមផ្ទះ។");
       return;
    }
    
    setIsAdding(true);
    try {
      const houseId = `house_${new Date().getTime()}`;
      await setDoc(doc(db, "houses", houseId), {
        name: newHouseName,
        meterNumber: newMeterNum,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewHouseName("");
      setNewMeterNum("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "houses");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteHouse = async (houseId: string) => {
    if (user?.role !== 'admin') return;
    if (confirm("តើអ្នកពិតជាចង់លុបផ្ទះនេះមែនទេ?")) {
      try {
        await deleteDoc(doc(db, "houses", houseId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, "houses");
      }
    }
  };

  if (loading) return <div className="p-4">កំពុងផ្ទុក...</div>;

  return (
    <div className="p-4 pt-8 md:pt-12 mb-20 md:mb-6 max-w-2xl mx-auto flex flex-col gap-6">
      
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
         <h1 className="text-xl font-bold text-gray-900">ការកំណត់</h1>
      </header>

      {/* User Info */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
             <User size={24} />
           </div>
           <div>
              <div className="font-bold text-gray-900">{user?.displayName || "គណនី"}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
           </div>
        </div>
        <div className="bg-brand-50 text-brand-600 px-3 py-1 rounded-lg text-xs font-bold uppercase border border-brand-100">
           {user?.role}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Home size={18} className="text-gray-400" />
          គ្រប់គ្រងផ្ទះ
        </h2>
        
        <div className="space-y-3 mb-6">
          {houses.map(house => (
            <div key={house.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50">
              <div>
                <div className="font-bold text-gray-800">ផ្ទះ: {house.name}</div>
                <div className="text-xs text-gray-500 font-mono">{house.meterNumber}</div>
              </div>
              <div className="flex gap-2">
                {user?.role === 'admin' && (
                  <>
                    <button 
                      onClick={() => setSharingHouseId(house.id!)}
                      className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition"
                      title="ចែករំលែក"
                    >
                      <Share2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteHouse(house.id!)}
                      className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition"
                      title="លុបផ្ទះ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {user?.role === 'admin' && (
           <div className="border-t border-gray-100 pt-4 flex gap-2">
             <input 
               type="text" placeholder="ឈ្មោះផ្ទះ (ឧ. C)" 
               value={newHouseName} onChange={e => setNewHouseName(e.target.value)}
               className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
             />
             <input 
               type="text" placeholder="លេខកុងទ័រ" 
               value={newMeterNum} onChange={e => setNewMeterNum(e.target.value)}
               className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
             />
             <button
               onClick={handleAddHouse}
               disabled={isAdding}
               className="bg-brand-600 text-white p-2 rounded-xl hover:bg-brand-700 active:scale-95 disabled:opacity-50"
             >
               <Plus size={20} />
             </button>
           </div>
        )}
      </div>

      <button
        onClick={logout}
        className="w-full bg-white border border-red-200 text-red-500 font-bold py-4 rounded-2xl shadow-sm hover:bg-red-50 flex items-center justify-center gap-2 transition active:scale-[0.98]"
      >
        <LogOut size={20} />
        ចាកចេញ
      </button>

      <AnimatePresence>
        {sharingHouseId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Share2 className="text-brand-500" /> ចែករំលែកផ្ទះ
                </h3>
                <button onClick={() => setSharingHouseId(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {allUsers.filter(u => u.id !== user?.id).map(u => {
                  const house = houses.find(h => h.id === sharingHouseId);
                  const isShared = house?.sharedWith?.includes(u.id) || false;
                  return (
                    <div key={u.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50">
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{u.email}</div>
                        <div className="text-xs text-gray-500 uppercase">{u.role}</div>
                      </div>
                      <button
                        onClick={() => handleShareToggle(sharingHouseId, u.id, isShared)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition ${
                          isShared ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isShared ? 'ឈប់ចែករំលែក' : 'ចែករំលែក'}
                      </button>
                    </div>
                  );
                })}
                {allUsers.filter(u => u.id !== user?.id).length === 0 && (
                  <div className="text-center text-gray-500 py-4 text-sm mt-4">
                    គ្មានអ្នកប្រើប្រាស់ផ្សេងទៀតទេ
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
