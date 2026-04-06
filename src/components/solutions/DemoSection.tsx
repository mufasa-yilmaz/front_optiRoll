'use client';

/**
 * İnteraktif demo: state, API çağrısı ve sonuçların KPI + kesim planına aktarılması.
 */
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { optimize, type OptimizeResponse } from '@/lib/api';
import { buildDemoOptimizeRequest } from './demoConstants';
import { DemoSidebar } from './DemoSidebar';
import { KpiCards } from './KpiCards';
import { VisualCuttingPlan } from './VisualCuttingPlan';

/**
 * Ortam değişkeninde API tabanı tanımlı mı kontrol eder (`api.ts` ile uyumlu).
 */
function getHasApiUrl(): boolean {
  const raw = process.env.NEXT_PUBLIC_API_URL || '';
  return raw.trim().length > 0;
}

/**
 * Çözümler sayfası interaktif demo: parametre state ve `optimize` çağrısı.
 */
export function DemoSection() {
  const hasApiUrl = useMemo(() => getHasApiUrl(), []);

  const [thickness, setThickness] = useState(0.75);
  const [maxInterleavingOrders, setMaxInterleavingOrders] = useState(2);
  const [interleavingPenaltyCost, setInterleavingPenaltyCost] = useState(60);
  const [maxOrdersPerRoll, setMaxOrdersPerRoll] = useState(4);
  const [maxRollsPerOrder, setMaxRollsPerOrder] = useState(5);

  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleRun = useCallback(async () => {
    if (!hasApiUrl) {
      toast.error('API adresi tanımlı değil (.env: NEXT_PUBLIC_API_URL).');
      return;
    }
    if (maxRollsPerOrder < 2) {
      toast.error('Çift yüzey senaryosunda sipariş başına en az 2 rulo gerekir.');
      return;
    }
    setLoading(true);
    setLastError(null);
    try {
      const req = buildDemoOptimizeRequest(
        thickness,
        maxInterleavingOrders,
        interleavingPenaltyCost,
        maxOrdersPerRoll,
        maxRollsPerOrder,
      );
      const res = await optimize(req);
      setResult(res);
      if (res.status !== 'Optimal') {
        toast.message(`Çözüm durumu: ${res.status}`);
      } else {
        toast.success('Optimizasyon tamamlandı.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Hesaplama başarısız';
      setLastError(msg);
      toast.error(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [
    hasApiUrl,
    thickness,
    maxInterleavingOrders,
    interleavingPenaltyCost,
    maxOrdersPerRoll,
    maxRollsPerOrder,
  ]);

  const summary = result?.summary ?? null;

  return (
    <section className="bg-[#f6f7f8] py-16 px-4 md:px-6 lg:px-16">
      <div className="max-w-[1024px] mx-auto flex flex-col">
        <div className="text-center mb-10 animate-fade-in-up">
          <h2 className="text-primary text-[28px] font-bold leading-tight tracking-tight">
            İnteraktif Demo
          </h2>
          <p className="text-gray-500 mt-2 text-base">
            Dashboard ile aynı optimizasyon parametrelerini deneyin; sonuçlar canlı güncellenir.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col md:flex-row overflow-hidden min-h-[550px] animate-scale-in">
          <DemoSidebar
            thickness={thickness}
            onThicknessChange={setThickness}
            maxInterleavingOrders={maxInterleavingOrders}
            onMaxInterleavingOrdersChange={setMaxInterleavingOrders}
            interleavingPenaltyCost={interleavingPenaltyCost}
            onInterleavingPenaltyCostChange={setInterleavingPenaltyCost}
            maxOrdersPerRoll={maxOrdersPerRoll}
            onMaxOrdersPerRollChange={setMaxOrdersPerRoll}
            maxRollsPerOrder={maxRollsPerOrder}
            onMaxRollsPerOrderChange={setMaxRollsPerOrder}
            onRun={handleRun}
            loading={loading}
            hasApiUrl={hasApiUrl}
            lastError={lastError}
          />
          <div className="flex-1 p-6 md:p-8 flex flex-col gap-8 bg-white min-w-0">
            <KpiCards summary={summary} loading={loading} status={result?.status ?? null} />
            <VisualCuttingPlan rollStatus={result?.rollStatus} cuttingPlan={result?.cuttingPlan} />
          </div>
        </div>
      </div>
    </section>
  );
}
