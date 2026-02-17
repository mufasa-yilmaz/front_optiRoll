'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { OptimizeResponse } from '@/lib/api';
import { useOptimization } from './OptimizationContext';

type ResultViewContextType = OptimizeResponse | null;

const ResultViewContext = createContext<ResultViewContextType>(null);

/**
 * Detay sayfasında gösterilecek sonucu sağlar.
 * Provider verilmezse veya null ise OptimizationContext.lastResult kullanılır.
 */
export function ResultViewProvider({
  result,
  children,
}: {
  result: OptimizeResponse | null;
  children: ReactNode;
}) {
  return (
    <ResultViewContext.Provider value={result}>
      {children}
    </ResultViewContext.Provider>
  );
}

export function useResultView() {
  return useContext(ResultViewContext);
}

/**
 * Gösterilecek sonucu döndürür: ResultViewContext > OptimizationContext.lastResult
 */
export function useDisplayResult(): OptimizeResponse | null {
  const viewResult = useResultView();
  const { lastResult } = useOptimization();
  return viewResult ?? lastResult;
}
