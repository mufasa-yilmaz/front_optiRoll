import type { Metadata } from 'next';
import Link from 'next/link';
import { DashboardPageHeader, SonucListTable } from '@/components/dashboard';

export const metadata: Metadata = {
  title: 'Geçmiş Sonuçlar | OptiRoll',
  description: 'Optimizasyon çalıştırma geçmişi ve sonuç listesi.',
};

/**
 * Geçmiş sonuçlar sayfası: tablo ile tüm çalıştırmalar listelenir.
 */
export default function SonucPage() {
  return (
    <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto max-w-[1200px] flex flex-col gap-6">
        <DashboardPageHeader
          title="Geçmiş Sonuçlar"
          description="Kayıtlı optimizasyon çalıştırmaları"
          action={
            <Link
              href="/dashboard/configuration"
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              <span className="material-symbols-outlined">add</span>
              <span>Yeni Optimizasyon</span>
            </Link>
          }
        />
        <SonucListTable />
      </div>
    </main>
  );
}
