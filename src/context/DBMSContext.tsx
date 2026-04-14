'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface SQLTrace {
  id: string;
  sql: string;
  description: string;
  timestamp: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
}

interface DBMSContextType {
  traces: SQLTrace[];
  addTrace: (trace: Omit<SQLTrace, 'id' | 'timestamp'>) => void;
  clearTraces: () => void;
  isConsoleOpen: boolean;
  setIsConsoleOpen: (open: boolean) => void;
}

const DBMSContext = createContext<DBMSContextType | undefined>(undefined);

export function DBMSProvider({ children }: { children: React.ReactNode }) {
  const [traces, setTraces] = useState<SQLTrace[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  const addTrace = useCallback((trace: Omit<SQLTrace, 'id' | 'timestamp'>) => {
    const newTrace: SQLTrace = {
      ...trace,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
    };
    setTraces((prev) => [newTrace, ...prev].slice(0, 50)); // Keep last 50
    setIsConsoleOpen(true); // Automatically open when new action occurs
  }, []);

  const clearTraces = useCallback(() => setTraces([]), []);

  return (
    <DBMSContext.Provider value={{ traces, addTrace, clearTraces, isConsoleOpen, setIsConsoleOpen }}>
      {children}
    </DBMSContext.Provider>
  );
}

export function useDBMS() {
  const context = useContext(DBMSContext);
  if (context === undefined) {
    throw new Error('useDBMS must be used within a DBMSProvider');
  }
  return context;
}
