import type { Metadata } from 'next';
import {
  ResultsSummaryHeader,
  ResultsSummaryKpiCards,
  PatternBreakdownTable,
} from '@/components/dashboard';

export const metadata: Metadata = {
  title: 'Kesim Karşılaştırması | OptiRoll',
  description:
    'Optimizasyon sonuç özeti: toplam maliyet, fire, stok, desen dağılımı ve verimlilik karşılaştırması.',
};

/**
 * Dashboard kesim karşılaştırma sayfası: optimizasyon sonuç özeti ve desen dağılımı tablosu.
 */
export default function KesimKarsilastirmaPage() {
  return (
    <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto max-w-[1400px]">
        <ResultsSummaryHeader />
        <ResultsSummaryKpiCards />
        <PatternBreakdownTable />
      </div>
    </main>
  );
}
