import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { ConfigurationForm } from './ConfigurationForm';

export const metadata: Metadata = {
  title: 'Optimizasyon | OptiRoll',
  description:
    'Optimizasyon modeli giriş parametreleri: malzeme özellikleri, senaryo seçimi, maliyet parametreleri ve sipariş özeti.',
};

/**
 * Dashboard optimizasyon sayfası: giriş parametreleri paneli.
 */
export default function ConfigurationPage() {
  return (
    <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto max-w-[1400px] flex flex-col gap-6">
        <DashboardPageHeader
          title="Optimizasyon"
          description="Malzeme, senaryo ve maliyet parametrelerini ayarlayın, optimizasyonu başlatın."
        />
        <Suspense fallback={<div className="text-sm text-slate-500">Optimizasyon sayfası yükleniyor...</div>}>
          <ConfigurationForm />
        </Suspense>
      </div>
    </main>
  );
}
