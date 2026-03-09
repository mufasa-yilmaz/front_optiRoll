import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ConfigurationForm } from './ConfigurationForm';

export const metadata: Metadata = {
  title: 'Optimizasyon | OptiRoll',
  description:
    'Optimizasyon modeli giriş parametreleri: malzeme özellikleri, senaryo seçimi, maliyet parametreleri ve sipariş özeti.',
};

/**
 * Dashboard optimizasyon sayfası: yeni senaryo düzeni, sol form kartları, sağ özet + CTA.
 */
export default function ConfigurationPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-0">
      <Suspense fallback={<div className="text-sm text-slate-500">Optimizasyon sayfası yükleniyor...</div>}>
        <ConfigurationForm />
      </Suspense>
    </main>
  );
}
