'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { pb } from '@/lib/pocketbase';
import type { Admin, Record as PocketBaseRecord } from 'pocketbase';

interface AuthContextType {
  user: PocketBaseRecord | Admin | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PocketBaseRecord | Admin | null>(pb.authStore.model);
  
  const isLoggedIn = pb.authStore.isValid && !!user;

  useEffect(() => {
    // This will trigger a re-render when the auth state changes
    const unsubscribe = pb.authStore.onChange(() => {
      setUser(pb.authStore.model);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email, password);
    console.log("Đăng nhập thành công!", pb.authStore.model);
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
    // Use window.location.href for robust redirection
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
