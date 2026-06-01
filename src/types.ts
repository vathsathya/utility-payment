export type Role = "admin" | "viewer";

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: Role;
  createdAt: any;
}

export interface House {
  id?: string;
  name: string;
  meterNumber: string;
  isActive: boolean;
  sharedWith?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface HouseReading {
  houseId: string;
  previous: number;
  current: number;
  units: number;
  cost: number;
}

export interface MonthlyReading {
  id?: string;
  date: string;
  month: string;
  rate: number;
  totalUnits: number;
  totalCost: number;
  authorId: string;
  createdAt: any;
  updatedAt: any;
  // Denormalized house readings for simple querying
  // In Firestore, we use subcollections for security purposes mostly, but in this setup, 
  // keeping it flat is fine. Actually our firestore rules define houseReadings 
  // as a subcollection. Let's stick with that.
}
