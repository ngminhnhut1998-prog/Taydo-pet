
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  isReadOnly: boolean;
  toggleReadOnly: () => void;
  lockdownDate: string | null;
  setLockdownDate: (date: string | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [lockdownDate, setLockdownDateState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedReadOnlyState = localStorage.getItem('isReadOnly');
      if (savedReadOnlyState) {
        setIsReadOnly(JSON.parse(savedReadOnlyState));
      }
      const savedLockdownDate = localStorage.getItem('lockdownDate');
      if (savedLockdownDate) {
        setLockdownDateState(savedLockdownDate);
      }
    } catch (error) {
        console.error("Failed to read settings from localStorage", error);
    }
  }, []);

  const toggleReadOnly = () => {
    setIsReadOnly(prev => {
      const newState = !prev;
      try {
        localStorage.setItem('isReadOnly', JSON.stringify(newState));
      } catch (error) {
        console.error("Failed to save read-only state to localStorage", error);
      }
      return newState;
    });
  };
  
  const setLockdownDate = (date: string | null) => {
      setLockdownDateState(date);
      try {
        if (date) {
            localStorage.setItem('lockdownDate', date);
        } else {
            localStorage.removeItem('lockdownDate');
        }
      } catch (error) {
        console.error("Failed to save lockdown date to localStorage", error);
      }
  };

  return (
    <SettingsContext.Provider value={{ isReadOnly, toggleReadOnly, lockdownDate, setLockdownDate }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
