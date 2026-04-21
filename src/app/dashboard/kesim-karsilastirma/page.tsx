import type { Metadata } from 'next';
import { KesimKarsilastirmaCompare } from '@/components/dashboard/KesimKarsilastirmaCompare';

export const metadata: Metadata = {
  title: 'Kesim Karşılaştırması | OptiRoll',
  description:
    'İki geçmiş çalıştırmayı KPI, maliyet kırılımı, grafikler ve rapor indirmeleriyle karşılaştırın.',
};

/**
 * Kesim karşılaştırma: geçmiş run seçimi ve yan yana özet.
 */
export default function KesimKarsilastirmaPage() {
  return (
    <main className="flex-1 py-8 px-4 md:px-6 bg-background-light overflow-x-hidden min-w-0">
      <div className="container mx-auto max-w-[1400px] min-w-0">
        <div className="mb-8 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-primary font-display">
            Kesim karşılaştırması
          </h1>
          <p className="text-gray-500 mt-1 text-sm max-w-3xl">
            İki çalıştırmayı yan yana özet tablolar, SVG analiz grafikleri (toplam maliyet, TL kırılımı, fire/stok
            tonajı), detaylı maliyet kalemleri ve Excel / CSV indirmeleriyle inceleyin. Depoda görsel rapor URL’i
            varsa küçük önizleme gösterilir.
          </p>
        </div>
        <KesimKarsilastirmaCompare />
      </div>
    </main>
  );
}
