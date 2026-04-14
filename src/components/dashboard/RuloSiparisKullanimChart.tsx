'use client';

import { useMemo } from 'react';
import { useDisplayResult } from '@/contexts/ResultViewContext';
import type { LineScheduleStepItem, RollStatusItem } from '@/lib/api';

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

const fmtM2 = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Sipariş kimliğine göre şema rengi döner.
 */
function orderColor(orderId: number): string {
  return SIPARIS_RENKLERI[(orderId - 1) % SIPARIS_RENKLERI.length];
}

/**
 * Rulo durum listesinden rollId → toplam tonaj haritası üretir.
 */
function rollTotalMap(rollStatus: RollStatusItem[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const r of rollStatus) {
    m.set(r.rollId, r.totalTonnage);
  }
  return m;
}

type ScheduleLaneProps = {
  bandLabel: string;
  rollId: number | null | undefined;
  orderId: number;
  tonnage: number;
  m2: number;
  rollTotalTon: number;
  globalMaxTon: number;
};

/**
 * Tek hat (üst veya alt) için tek adımlık segment çubuğu çizer.
 */
function ScheduleLaneBar({
  bandLabel,
  rollId,
  orderId,
  tonnage,
  m2,
  rollTotalTon,
  globalMaxTon,
}: ScheduleLaneProps) {
  const denom = Math.max(rollTotalTon, globalMaxTon, 1e-6);
  const trackPct = Math.min(100, (rollTotalTon / globalMaxTon) * 100);
  const segPct = tonnage > 1e-6 ? Math.min(100, (tonnage / denom) * 100) : 0;
  const col = orderColor(orderId);

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 shrink-0 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
        {bandLabel}
      </div>
      <div className="w-24 shrink-0 text-sm font-medium text-gray-700">
        {rollId != null ? `Rulo #${rollId}` : '—'}
      </div>
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <div
          className="h-9 rounded-lg overflow-hidden flex bg-gray-100 border border-gray-100"
          style={{ minHeight: 36, width: `${trackPct}%`, minWidth: tonnage > 1e-6 ? 120 : 80 }}
        >
          {tonnage > 1e-6 ? (
            <div
              className="h-full flex items-center justify-center text-white text-[11px] font-bold border-r border-white/25 px-1"
              style={{
                width: `${segPct}%`,
                backgroundColor: col,
                minWidth: tonnage > 0.4 ? undefined : 56,
              }}
              title={`Sipariş ${orderId}: ${formatTon(tonnage)} t · ${fmtM2(m2)} m²`}
            >
              S{orderId} ({formatTon(tonnage)}t)
            </div>
          ) : (
            <div className="h-full flex-1 flex items-center justify-center text-gray-400 text-[11px] italic">
              —
            </div>
          )}
        </div>
        <div className="text-[10px] text-gray-500">
          Adım ton: {formatTon(tonnage)} t · {fmtM2(m2)} m²
        </div>
      </div>
    </div>
  );
}

/**
 * Rulo–sipariş kullanım şeması: `lineSchedule` varsa üst/alt çiftleri MILP sırasıyla;
 * yoksa klasik rulo satırı görünümü.
 */
export function RuloSiparisKullanimChart() {
  const lastResult = useDisplayResult();

  const schedule = lastResult?.lineSchedule ?? [];
  const hasSchedule = schedule.length > 0;

  const { cuttingPlan, rollStatus } = lastResult ?? {
    cuttingPlan: [],
    rollStatus: [],
  };

  const maxTonaj =
    rollStatus.length > 0 ? Math.max(...rollStatus.map((r) => r.totalTonnage), 1) : 1;
  const rollTotals = useMemo(() => rollTotalMap(rollStatus), [rollStatus]);

  const rollSegments = useMemo(
    () =>
      rollStatus.map((r) => {
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
      }),
    [cuttingPlan, rollStatus],
  );

  const orderIds = cuttingPlan.map((c) => c.orderId);
  const uniqueOrderIds = orderIds.filter((id, i) => orderIds.indexOf(id) === i).sort((a, b) => a - b);

  if (!lastResult) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-navy-custom px-6 py-4 border-b border-navy-custom">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined">stacked_bar_chart</span>
          Rulo – Sipariş Kullanım Şeması
        </h2>
        <p className="text-sm text-white/80 mt-1">
          {hasSchedule
            ? 'Hat adımları (üst / alt sırayla); her adımda iki hat aynı siparişi keser · ton'
            : 'Her rulonun sipariş bazında dağılımı (ton)'}
        </p>
      </div>
      <div className="p-6">
        {hasSchedule ? (
          <div className="space-y-6">
            {schedule.map((step: LineScheduleStepItem) => {
              const oid = step.orderId;
              const uId = step.upperRollId ?? null;
              const lId = step.lowerRollId ?? null;
              const upperCut =
                step.cuts.find((c) => c.rollId === uId) ??
                step.cuts.find((c) => (c.upperTonnage ?? 0) > 1e-6);
              const lowerCut =
                step.cuts.find((c) => c.rollId === lId) ??
                step.cuts.find((c) => (c.lowerTonnage ?? 0) > 1e-6);
              const uTon = upperCut?.tonnage ?? 0;
              const uM2 = upperCut?.m2 ?? 0;
              const lTon = lowerCut?.tonnage ?? 0;
              const lM2 = lowerCut?.m2 ?? 0;
              const uTotal = uId != null ? rollTotals.get(uId) ?? maxTonaj : maxTonaj;
              const lTotal = lId != null ? rollTotals.get(lId) ?? maxTonaj : maxTonaj;

              return (
                <div
                  key={`sch-${step.step}-${oid}-${uId ?? 'u'}-${lId ?? 'l'}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-bold text-navy-custom">
                      Adım {step.step} · Sipariş #{oid}
                    </span>
                    {step.actionSummary ? (
                      <span className="text-[10px] text-slate-600 max-w-[70%] text-right leading-snug">
                        {step.actionSummary}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <ScheduleLaneBar
                      bandLabel="Üst"
                      rollId={uId}
                      orderId={oid}
                      tonnage={uTon}
                      m2={uM2}
                      rollTotalTon={uTotal}
                      globalMaxTon={maxTonaj}
                    />
                    <ScheduleLaneBar
                      bandLabel="Alt"
                      rollId={lId}
                      orderId={oid}
                      tonnage={lTon}
                      m2={lM2}
                      rollTotalTon={lTotal}
                      globalMaxTon={maxTonaj}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {rollSegments.map((roll) => (
              <div key={roll.rollId} className="flex items-center gap-4">
                <div className="w-24 shrink-0 text-sm font-medium text-gray-700">Rulo #{roll.rollId}</div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="h-10 rounded-lg overflow-hidden flex bg-gray-100" style={{ minHeight: 40 }}>
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
                              backgroundColor: SIPARIS_RENKLERI[(seg.orderId - 1) % SIPARIS_RENKLERI.length],
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
        )}
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
