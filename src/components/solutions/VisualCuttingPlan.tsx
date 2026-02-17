'use client';

/**
 * Görsel kesim planı: legend + rulo çubukları (sipariş, stok, fire).
 * Fire bölümü .bg-striped-scrap ile çizgili gösterilir.
 */
const ROLLS = [
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

export function VisualCuttingPlan() {
  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-primary text-lg">Görsel Kesim Planı</h4>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary" aria-hidden />
            <span className="text-xs font-medium text-gray-500">Sipariş</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-200 border border-green-300" aria-hidden />
            <span className="text-xs font-medium text-gray-500">Stok</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full bg-red-400 bg-striped-scrap"
              aria-hidden
            />
            <span className="text-xs font-medium text-gray-500">Fire</span>
          </div>
        </div>
      </div>
      <div className="w-full bg-third rounded-lg p-6 border border-gray-200 flex flex-col gap-6">
        {ROLLS.map((roll) => (
          <div key={roll.id} className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-medium text-gray-500">
              <span>Ana Rulo #{roll.id}</span>
              <span>Kullanım: {roll.utilization}</span>
            </div>
            <div className="h-16 w-full rounded-md overflow-hidden flex bg-gray-200 shadow-sm relative">
              {roll.segments.map((seg, idx) => {
                if (seg.type === 'order')
                  return (
                    <div
                      key={idx}
                      className="h-full bg-secondary flex-shrink-0 border-r border-white/20 flex items-center justify-center group hover:bg-secondary/90 transition-colors"
                      style={{ width: `${seg.width}%` }}
                    >
                      <span className="text-white text-xs font-bold opacity-80 group-hover:opacity-100">
                        {seg.label}
                      </span>
                    </div>
                  );
                if (seg.type === 'stock')
                  return (
                    <div
                      key={idx}
                      className="h-full bg-green-200 flex-shrink-0 border-r border-white/20 flex items-center justify-center hover:bg-green-300 transition-colors"
                      style={{ width: `${seg.width}%` }}
                    >
                      <span className="text-green-800 text-[10px] font-bold">
                        STK
                      </span>
                    </div>
                  );
                return (
                  <div
                    key={idx}
                    className="h-full bg-red-400 bg-striped-scrap flex-shrink-0 hover:brightness-110 transition-all"
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
