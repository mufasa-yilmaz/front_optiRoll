'use client';

import Link from 'next/link';
import { useDisplayResult } from '@/contexts/ResultViewContext';

/**
 * Sonuç sayfasında optimizasyon henüz çalıştırılmamışsa gösterilen bilgi bandı.
 */
export function SonucEmptyBanner() {
  const lastResult = useDisplayResult();

  if (lastResult) return null;

  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-amber-600 text-2xl">
          info
        </span>
        <div>
          <p className="font-semibold text-amber-900">
            Henüz optimizasyon çalıştırılmadı
          </p>
          <p className="text-sm text-amber-800 mt-0.5">
            Sonuçları görmek için Optimizasyon sayfasından modeli çalıştırın.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/configuration"
        className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">settings</span>
        Optimizasyona Git
      </Link>
    </div>
  );
}
