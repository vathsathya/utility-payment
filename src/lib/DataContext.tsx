import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { House, MonthlyReading } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  houses: House[];
  readings: MonthlyReading[];
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [houses, setHouses] = useState<House[]>([]);
  const [readings, setReadings] = useState<MonthlyReading[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let unsubscribeHouses: () => void;
    let unsubscribeReadings: () => void;
    
    let housesLoaded = false;
    let readingsLoaded = false;

    const checkLoaded = () => {
      if (housesLoaded && readingsLoaded) setLoading(false);
    };

    try {
      let qHouses;
      if (user.role === 'admin') {
        qHouses = query(collection(db, "houses"), orderBy("createdAt", "asc"));
      } else {
        qHouses = query(collection(db, "houses"), where("sharedWith", "array-contains", user.id));
      }
      
      unsubscribeHouses = onSnapshot(qHouses, (snapshot) => {
        setHouses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as House)));
        housesLoaded = true;
        checkLoaded();
      }, (error) => handleFirestoreError(error, OperationType.GET, "houses"));

      const qReadings = query(collection(db, "readings"), orderBy("date", "desc"));
      unsubscribeReadings = onSnapshot(qReadings, (snapshot) => {
        setReadings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonthlyReading)));
        readingsLoaded = true;
        checkLoaded();
      }, (error) => handleFirestoreError(error, OperationType.GET, "readings"));
      
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
    
    return () => {
      if (unsubscribeHouses) unsubscribeHouses();
      if (unsubscribeReadings) unsubscribeReadings();
    }
  }, [user]);

  return (
    <DataContext.Provider value={{ houses, readings, loading }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
