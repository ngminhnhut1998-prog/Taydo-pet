"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  isReadOnly: boolean;
  toggleReadOnly: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('isReadOnly');
      if (savedState) {
        setIsReadOnly(JSON.parse(savedState));
      }
    } catch (error) {
        console.error("Failed to read read-only state from localStorage", error);
        setIsReadOnly(false);
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

  return (
    <SettingsContext.Provider value={{ isReadOnly, toggleReadOnly }}>
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
