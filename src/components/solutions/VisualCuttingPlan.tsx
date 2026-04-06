'use client';

import type { CuttingPlanItem, RollStatusItem } from '@/lib/api';

/**
 * Statik örnek (API sonucu yokken).
 */
const STATIC_ROLLS = [
  {
    id: '1042',
    utilization: '%97,6',
    segments: [
      { type: 'order' as const, width: 30, label: 'ORD-12' },
      { type: 'order' as const, width: 45, label: 'ORD-15' },
      { type: 'order' as const, width: 15, label: 'ORD-09' },
      { type: 'stock' as const, width: 8, label: 'STK' },
      { type: 'scrap' as const, width: 2 },
    ],
  },
  {
    id: '1043',
    utilization: '%99,1',
    segments: [
      { type: 'order' as const, width: 20, label: 'ORD-22' },
      { type: 'order' as const, width: 20, label: 'ORD-22' },
      { type: 'order' as const, width: 59, label: 'ORD-41 (L)' },
      { type: 'scrap' as const, width: 1 },
    ],
  },
];

type Segment = { type: 'order' | 'stock' | 'scrap'; width: number; label?: string };

/**
 * API kesim planı ve rulo durumundan çubuk segmentleri üretir.
 *
 * @param rollStatus - Rulo listesi
 * @param cuttingPlan - Kesim satırları
 */
function buildLiveRollBars(rollStatus: RollStatusItem[], cuttingPlan: CuttingPlanItem[]): Segment[][] {
  const byRoll: Record<number, CuttingPlanItem[]> = {};
  for (const row of cuttingPlan) {
    const rid = row.rollId;
    if (!byRoll[rid]) byRoll[rid] = [];
    byRoll[rid].push(row);
  }

  return rollStatus
    .filter((r) => Number(r.used) > 1e-6)
    .map((r) => {
      const total = Math.max(Number(r.totalTonnage), 1e-6);
      const rows = byRoll[r.rollId] || [];
      const segments: Segment[] = [];
      for (const row of rows) {
        const w = Math.max(0, (Number(row.tonnage) / total) * 100);
        if (w < 0.05) continue;
        segments.push({
          type: 'order',
          width: w,
          label: `S${row.orderId}`,
        });
      }
      const stockW = Math.max(0, (Number(r.stock) / total) * 100);
      const fireW = Math.max(0, (Number(r.fire) / total) * 100);
      if (stockW >= 0.05) segments.push({ type: 'stock', width: stockW, label: 'STK' });
      if (fireW >= 0.05) segments.push({ type: 'scrap', width: fireW });
      const sum = segments.reduce((s, x) => s + x.width, 0);
      if (sum < 99 && sum > 0) {
        const last = segments[segments.length - 1];
        if (last) last.width += 100 - sum;
      }
      return segments.length ? segments : [{ type: 'order' as const, width: 100, label: '—' }];
    });
}

export interface VisualCuttingPlanProps {
  rollStatus?: RollStatusItem[] | null;
  cuttingPlan?: CuttingPlanItem[] | null;
}

/**
 * Görsel kesim planı: API sonucu veya statik örnek.
 */
export function VisualCuttingPlan({ rollStatus, cuttingPlan }: VisualCuttingPlanProps) {
  const useLive =
    rollStatus &&
    cuttingPlan &&
    rollStatus.length > 0 &&
    cuttingPlan.length > 0;

  const liveBars = useLive ? buildLiveRollBars(rollStatus, cuttingPlan) : null;
  const liveRolls =
    useLive && liveBars
      ? rollStatus!
          .filter((r) => Number(r.used) > 1e-6)
          .map((r, idx) => {
            const pct = Math.min(100, Math.round((Number(r.used) / Math.max(Number(r.totalTonnage), 1e-6)) * 1000) / 10);
            return {
              id: String(r.rollId),
              utilization: `%${pct}`,
              segments: liveBars[idx] || [],
            };
          })
      : null;

  const rolls =
    liveRolls && liveRolls.length > 0
      ? liveRolls
      : STATIC_ROLLS.map((x) => ({ ...x, id: x.id }));

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-bold text-primary text-lg">Görsel Kesim Planı</h4>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary" aria-hidden />
            <span className="text-xs font-medium text-gray-500">Sipariş</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-200 border border-green-300" aria-hidden />
            <span className="text-xs font-medium text-gray-500">Stok</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400 bg-striped-scrap" aria-hidden />
            <span className="text-xs font-medium text-gray-500">Fire</span>
          </div>
        </div>
      </div>
      {!useLive && (
        <p className="text-xs text-gray-500">Örnek görünüm; hesaplama sonrası gerçek dağılım gösterilir.</p>
      )}
      <div className="w-full bg-third rounded-lg p-6 border border-gray-200 flex flex-col gap-6">
        {rolls.map((roll) => (
          <div key={roll.id} className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-medium text-gray-500">
              <span>Rulo #{roll.id}</span>
              <span>Kullanım: {roll.utilization}</span>
            </div>
            <div className="h-16 w-full rounded-md overflow-hidden flex bg-gray-200 shadow-sm relative">
              {roll.segments.map((seg, idx) => {
                if (seg.type === 'order')
                  return (
                    <div
                      key={idx}
                      className="h-full bg-secondary flex-shrink-0 border-r border-white/20 flex items-center justify-center group hover:bg-secondary/90 transition-colors min-w-0"
                      style={{ width: `${seg.width}%` }}
                    >
                      <span className="text-white text-[10px] sm:text-xs font-bold truncate px-0.5 opacity-90">
                        {seg.label}
                      </span>
                    </div>
                  );
                if (seg.type === 'stock')
                  return (
                    <div
                      key={idx}
                      className="h-full bg-green-200 flex-shrink-0 border-r border-white/20 flex items-center justify-center hover:bg-green-300 transition-colors min-w-0"
                      style={{ width: `${seg.width}%` }}
                    >
                      <span className="text-green-800 text-[10px] font-bold">STK</span>
                    </div>
                  );
                return (
                  <div
                    key={idx}
                    className="h-full bg-red-400 bg-striped-scrap flex-shrink-0 hover:brightness-110 transition-all min-w-0"
                    style={{ width: `${seg.width}%` }}
                    title="Fire"
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
