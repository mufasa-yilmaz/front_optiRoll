'use client';

import { useDisplayResult } from '@/contexts/ResultViewContext';

/** Sipariş bazlı segment rengi - proje paleti */
const SIPARIS_RENKLERI = [
  '#153b6a', // primary
  '#4A90E2', // secondary
  '#10b981', // accent-green
  '#f97316', // accent-orange
  '#8b5cf6', // mor
  '#ec4899', // pembe
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f59e0b', // amber
  '#6366f1', // indigo
];

const formatTon = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Rulo-sipariş kullanım yatay stacked bar chart.
 * Python main.py'deki şema görselinin React/Tailwind karşılığı.
 */
export function RuloSiparisKullanimChart() {
  const lastResult = useDisplayResult();

  if (!lastResult) return null;

  const { cuttingPlan, rollStatus } = lastResult;
  const maxTonaj = Math.max(...rollStatus.map((r) => r.totalTonnage), 1);

  const rollSegments: {
    rollId: number;
    totalTonnage: number;
    used: number;
    segments: { orderId: number; tonnage: number }[];
    stock: number;
    fire: number;
    isUnused: boolean;
  }[] = rollStatus.map((r) => {
    const segs = cuttingPlan
      .filter((c) => c.rollId === r.rollId)
      .map((c) => ({ orderId: c.orderId, tonnage: c.tonnage }));
    const isUnused = r.used < 0.0001;
    return {
      rollId: r.rollId,
      totalTonnage: r.totalTonnage,
      used: r.used,
      segments: segs,
      stock: r.stock,
      fire: r.fire,
      isUnused,
    };
  });

  /** Benzersiz sipariş ID'lerini al (Set iterasyonu yerine filter kullanımı - ES5 uyumluluğu) */
  const orderIds = cuttingPlan.map((c) => c.orderId);
  const uniqueOrderIds = orderIds.filter((id, i) => orderIds.indexOf(id) === i).sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-navy-custom px-6 py-4 border-b border-navy-custom">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined">stacked_bar_chart</span>
          Rulo – Sipariş Kullanım Şeması
        </h2>
        <p className="text-sm text-white/80 mt-1">
          Her rulonun sipariş bazında dağılımı (ton)
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {rollSegments.map((roll) => (
            <div key={roll.rollId} className="flex items-center gap-4">
              <div className="w-24 shrink-0 text-sm font-medium text-gray-700">
                Rulo #{roll.rollId}
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div
                  className="h-10 rounded-lg overflow-hidden flex bg-gray-100"
                  style={{ minHeight: 40 }}
                >
                  {roll.isUnused ? (
                    <div
                      className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm italic"
                      style={{
                        width: `${Math.min(100, (roll.totalTonnage / maxTonaj) * 100)}%`,
                      }}
                    >
                      Kullanılmadı
                    </div>
                  ) : (
                    <>
                      {roll.segments.map((seg, idx) => (
                        <div
                          key={`${roll.rollId}-${seg.orderId}-${idx}`}
                          className="h-full flex items-center justify-center text-white text-xs font-bold border-r border-white/30"
                          style={{
                            width: `${(seg.tonnage / roll.totalTonnage) * 100}%`,
                            backgroundColor:
                              SIPARIS_RENKLERI[(seg.orderId - 1) % SIPARIS_RENKLERI.length],
                            minWidth: seg.tonnage > 0.5 ? undefined : 60,
                          }}
                          title={`Sipariş ${seg.orderId}: ${formatTon(seg.tonnage)} ton`}
                        >
                          {seg.tonnage > 0.5 ? (
                            <>S{seg.orderId} ({formatTon(seg.tonnage)}t)</>
                          ) : (
                            <>S{seg.orderId}</>
                          )}
                        </div>
                      ))}
                      {roll.stock > 0.0001 && (
                        <div
                          className="h-full flex items-center justify-center text-gray-800 text-xs font-bold bg-accent-green/80"
                          style={{
                            width: `${(roll.stock / roll.totalTonnage) * 100}%`,
                            minWidth: roll.stock > 0.5 ? undefined : 50,
                          }}
                        >
                          Stok ({formatTon(roll.stock)}t)
                        </div>
                      )}
                      {roll.fire > 0.0001 && (
                        <div
                          className="h-full flex items-center justify-center text-white text-xs font-bold bg-accent-red"
                          style={{
                            width: `${(roll.fire / roll.totalTonnage) * 100}%`,
                            minWidth: roll.fire > 0.5 ? undefined : 50,
                          }}
                        >
                          Fire ({formatTon(roll.fire)}t)
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Toplam: {formatTon(roll.totalTonnage)} ton
                  {!roll.isUnused && (
                    <>
                      {' '}
                      · Kullanılan: {formatTon(roll.used)} ton
                      {roll.stock > 0 && ` · Stok: ${formatTon(roll.stock)} ton`}
                      {roll.fire > 0 && ` · Fire: ${formatTon(roll.fire)} ton`}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
            {uniqueOrderIds.map((oid) => (
              <span key={oid} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded"
                  style={{
                    backgroundColor: SIPARIS_RENKLERI[(oid - 1) % SIPARIS_RENKLERI.length],
                  }}
                />
                Sipariş {oid}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
