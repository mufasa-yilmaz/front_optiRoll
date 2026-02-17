import { DashboardOverviewHeader, ResultsKpiGrid } from '@/components';

/**
 * Dashboard optimizasyon ana sayfası: genel bakış başlığı ve KPI kartları.
 */
export default function DashboardPage() {
  return (
    <main className="flex-1 px-4 py-8 md:py-12 bg-background-light">
      <DashboardOverviewHeader />
      <ResultsKpiGrid />
    </main>
  );
}
