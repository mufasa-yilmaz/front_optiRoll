import type { Metadata } from 'next';
import Link from 'next/link';
import { SonucListTable } from '@/components/dashboard';

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0f141a]">
              Geçmiş Sonuçlar
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Kayıtlı optimizasyon çalıştırmaları
            </p>
          </div>
          <Link
            href="/dashboard/configuration"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Yeni Optimizasyon
          </Link>
        </div>
        <SonucListTable />
      </div>
    </main>
  );
}
