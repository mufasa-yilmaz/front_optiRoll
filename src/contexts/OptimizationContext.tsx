'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { OptimizeResponse } from '@/lib/api';

type OptimizationContextType = {
  lastResult: OptimizeResponse | null;
  setLastResult: (r: OptimizeResponse | null) => void;
  isLoading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;
};

const OptimizationContext = createContext<OptimizationContextType | null>(null);

/**
 * Optimizasyon sonuç context provider.
 */
export function OptimizationProvider({ children }: { children: ReactNode }) {
  const [lastResult, setLastResultState] = useState<OptimizeResponse | null>(
    () => {
      if (typeof window === 'undefined') return null;
      try {
        const s = sessionStorage.getItem('optiroll-last-result');
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    }
  );
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLastResult = useCallback((r: OptimizeResponse | null) => {
    setLastResultState(r);
    if (typeof window !== 'undefined') {
      if (r) sessionStorage.setItem('optiroll-last-result', JSON.stringify(r));
      else sessionStorage.removeItem('optiroll-last-result');
    }
  }, []);

  return (
    <OptimizationContext.Provider
      value={{
        lastResult,
        setLastResult,
        isLoading,
        setLoading,
        error,
        setError,
      }}
    >
      {children}
    </OptimizationContext.Provider>
  );
}

/**
 * Optimizasyon context hook.
 */
export function useOptimization() {
  const ctx = useContext(OptimizationContext);
  if (!ctx) {
    throw new Error('useOptimization must be used within OptimizationProvider');
  }
  return ctx;
}
