/**
 * Çözümler sayfası: nasıl çalışır bölümü ve interaktif demo.
 */
import type { Metadata } from 'next';
import { DemoSection, SolutionHowItWorks } from '@/components/solutions';

export const metadata: Metadata = {
  title: 'Çözümler & Demo | OptiRoll',
  description:
    'Nasıl çalışır ve interaktif demo ile optimizasyon motorunu keşfedin.',
};

export default function SolutionsPage() {
  return (
    <>
      <SolutionHowItWorks />
      <DemoSection />
    </>
  );
}
