import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { ConfigurationForm } from './ConfigurationForm';

export const metadata: Metadata = {
  title: 'Konfigürasyon | OptiRoll',
  description:
    'Optimizasyon modeli giriş parametreleri: malzeme özellikleri, senaryo seçimi, maliyet parametreleri ve sipariş özeti.',
};

/**
 * Dashboard konfigürasyon sayfası: giriş parametreleri paneli.
 */
export default function ConfigurationPage() {
  return (
    <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto max-w-[1400px] flex flex-col gap-6">
        <DashboardPageHeader
          title="Konfigürasyon"
          description="Malzeme özellikleri, senaryo ve maliyet parametrelerini yapılandırın."
        />
        <Suspense fallback={<div className="text-sm text-slate-500">Konfigürasyon yükleniyor...</div>}>
          <ConfigurationForm />
        </Suspense>
      </div>
    </main>
  );
}
