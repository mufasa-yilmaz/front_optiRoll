import type { Metadata } from 'next';
import { ScrapComparisonSection, ScrapCtaBox } from '@/components/scrap-comparison';

export const metadata: Metadata = {
  title: 'Fire Karşılaştırması | OptiRoll',
  description:
    'Geleneksel yaklaşım ile dinamik optimizasyon modelinin fire oluşumu üzerindeki karşılaştırması.',
};

/**
 * Fire karşılaştırması sayfası: geleneksel vs modern yaklaşım ve CTA.
 */
export default function ScrapComparisonPage() {
  return (
    <>
      <ScrapComparisonSection />
      <ScrapCtaBox />
    </>
  );
}
