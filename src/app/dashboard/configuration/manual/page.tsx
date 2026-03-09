import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ManualConfigurationForm } from '../ManualConfigurationForm';

export const metadata: Metadata = {
  title: 'Manuel Analiz & Test | OptiRoll',
  description:
    'Hazır stok ve sipariş setleri olmadan, tamamen manuel girişle optimizasyon senaryolarını analiz edin ve test edin.',
};

/**
 * Dashboard manuel analiz/test sayfası: aynı senaryo düzeni, sol form kartları, sağ özet + CTA.
 */
export default function ManualConfigurationPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-0">
      <Suspense fallback={<div className="text-sm text-slate-500">Manuel konfigürasyon yükleniyor...</div>}>
        <ManualConfigurationForm />
      </Suspense>
    </main>
  );
}

