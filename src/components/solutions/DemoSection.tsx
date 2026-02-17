/**
 * İnteraktif demo bölümü: sol sidebar + KPI kartları ve görsel kesim planı.
 * Tek bir dashboard kartı içinde bir araya getirir.
 */
import { DemoSidebar } from './DemoSidebar';
import { KpiCards } from './KpiCards';
import { VisualCuttingPlan } from './VisualCuttingPlan';

export function DemoSection() {
  return (
    <section className="bg-[#f6f7f8] py-16 px-4 md:px-6 lg:px-16">
      <div className="max-w-[1024px] mx-auto flex flex-col">
        <div className="text-center mb-10 animate-fade-in-up">
          <h2 className="text-primary text-[28px] font-bold leading-tight tracking-tight">
            İnteraktif Demo
          </h2>
          <p className="text-gray-500 mt-2 text-base">
            Parametreleri yapılandırın ve optimizasyon motorunu canlı izleyin.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col md:flex-row overflow-hidden min-h-[550px] animate-scale-in">
          <DemoSidebar />
          <div className="flex-1 p-6 md:p-8 flex flex-col gap-8 bg-white">
            <KpiCards />
            <VisualCuttingPlan />
          </div>
        </div>
      </div>
    </section>
  );
}
