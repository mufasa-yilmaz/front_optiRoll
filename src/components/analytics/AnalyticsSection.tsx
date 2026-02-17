/**
 * Analitik ve sonuçlar ana bölümü.
 * Başlık, grafikler ve kimler için bölümünü bir araya getirir.
 */
import { AnalyticsHeader } from './AnalyticsHeader';
import { TotalCostChart } from './TotalCostChart';
import { CostBreakdownChart } from './CostBreakdownChart';
import { PersonasSection } from './PersonasSection';

export function AnalyticsSection() {
  return (
    <main className="flex-grow flex flex-col items-center">
      <section className="w-full max-w-6xl px-4 md:px-10 py-12">
        <AnalyticsHeader />
        <div className="flex flex-col lg:flex-row gap-6">
          <TotalCostChart />
          <CostBreakdownChart />
        </div>
      </section>
      <PersonasSection />
    </main>
  );
}
