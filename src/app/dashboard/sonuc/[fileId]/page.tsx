'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  SolverResultsHeader,
  SolverStatusCards,
  SolverDetailedSummary,
  SolverOrderRollBreakdown,
  RuloSiparisKullanimChart,
  SolverBreakdownTabs,
} from '@/components/dashboard';
import { useOptimization } from '@/contexts/OptimizationContext';
import { ResultViewProvider } from '@/contexts/ResultViewContext';
import { getRun, type RunDetail } from '@/lib/api';

/**
 * Sonuç detay sayfası: tek bir optimizasyon çalıştırmasının tam görünümü.
 */
export default function SonucDetailPage() {
  const params = useParams();
  const { lastResult } = useOptimization();
  const fileId = params.fileId as string;
  const [result, setResult] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;
    getRun(fileId)
      .then((data) => {
        setResult({ ...data, reportUrl: data.reportUrl });
      })
      .catch(async () => {
        if (lastResult?.fileId === fileId) {
          setResult(lastResult as RunDetail);
          setError(null);
        } else {
          setError('Sonuç bulunamadı');
        }
      })
      .finally(() => setLoading(false));
  }, [fileId, lastResult]);

  if (loading) {
    return (
      <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
        <div className="container mx-auto max-w-[1200px] flex flex-col items-center justify-center min-h-[300px]">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary mb-4">
            progress_activity
          </span>
          <p className="text-gray-500">Sonuç yükleniyor...</p>
        </div>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
        <div className="container mx-auto max-w-[1200px]">
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4">
            <p className="font-semibold text-red-900">
              {error || 'Sonuç bulunamadı'}
            </p>
            <p className="text-sm text-red-800 mt-1">
              Bu çalıştırma silinmiş veya erişilemiyor olabilir.
            </p>
            <Link
              href="/dashboard/sonuc"
              className="mt-4 inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Geçmişe Dön
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <ResultViewProvider result={result}>
      <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
        <div className="container mx-auto max-w-[1200px] flex flex-col gap-6">
          <Link
            href="/dashboard/sonuc"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Geçmişe Dön
          </Link>
          <SolverResultsHeader />
          <SolverStatusCards />
          <RuloSiparisKullanimChart />
          <SolverDetailedSummary />
          <SolverOrderRollBreakdown />
          <SolverBreakdownTabs />
        </div>
      </main>
    </ResultViewProvider>
  );
}
