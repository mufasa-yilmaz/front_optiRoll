import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { ManualConfigurationForm } from '../ManualConfigurationForm';

export const metadata: Metadata = {
  title: 'Manuel Analiz & Test | OptiRoll',
  description:
    'Hazır stok ve sipariş setleri olmadan, tamamen manuel girişle optimizasyon senaryolarını analiz edin ve test edin.',
};

/**
 * Dashboard manuel analiz/test konfigürasyon sayfası.
 * Stok ve sipariş setleri yerine tamamen manuel giriş ile çalışır.
 */
export default function ManualConfigurationPage() {
  return (
    <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto max-w-[1400px] flex flex-col gap-6">
        <DashboardPageHeader
          title="Manuel Analiz & Test"
          description="Stok ve sipariş setleri olmadan, tamamen manuel girişle farklı senaryoları test edin."
        />
        <Suspense fallback={<div className="text-sm text-slate-500">Manuel konfigürasyon yükleniyor...</div>}>
          <ManualConfigurationForm />
        </Suspense>
      </div>
    </main>
  );
}

