import type { Metadata } from 'next';
import { AnalyticsSection } from '@/components/analytics';

export const metadata: Metadata = {
  title: 'Analitik | OptiRoll',
  description:
    'Yapay zeka destekli rulo optimizasyonunun üretim maliyetleri ve malzeme verimliliği üzerindeki etkisini görselleştirin.',
};

/**
 * Analitik sayfası: optimizasyon sonuçları, grafikler ve kişi kartları.
 */
export default function AnalyticsPage() {
  return <AnalyticsSection />;
}
