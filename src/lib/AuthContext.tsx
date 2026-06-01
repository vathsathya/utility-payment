import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log("Checking userDoc for", firebaseUser.uid);
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          console.log("userDoc exists:", userDoc.exists());
          if (userDoc.exists()) {
            setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            console.log("Creating new user");
            const isAdmin = firebaseUser.email === "vath.sathya@gmail.com";
            const newUser: Omit<User, 'id'> = {
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "",
              role: isAdmin ? "admin" : "viewer",
              createdAt: serverTimestamp(),
            };
            
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            console.log("Created user successfully");
            setUser({ id: firebaseUser.uid, ...newUser } as User);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth init error details:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
