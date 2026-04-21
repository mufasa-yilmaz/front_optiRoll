'use client';

import { useMemo } from 'react';
import { useDisplayResult } from '@/contexts/ResultViewContext';
import type { LineScheduleStepItem, RollStatusItem } from '@/lib/api';
import { formatTonDisplayTr } from '@/components/dashboard/orders/helpers';

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

/**
 * Bir hat adımında verilen rulo için cuts içinden tonaj okur.
 */
function tonnageCutForRollOnStep(step: LineScheduleStepItem, rollId: number | null): number {
  if (rollId == null) return 0;
  const cut = step.cuts.find((c) => c.rollId === rollId);
  return cut?.tonnage ?? 0;
}

/**
 * Bu adımda verilen banddaki rulo için, çizelgede sonraki kesim yoksa true döner (rulo sonu artığı).
 */
function isLastRollCutInSchedule(
  schedule: LineScheduleStepItem[],
  stepIdx: number,
  rollId: number | null,
  band: 'upper' | 'lower',
): boolean {
  if (rollId == null) return false;
  const step = schedule[stepIdx];
  const bandId = band === 'upper' ? step.upperRollId : step.lowerRollId;
  if (bandId !== rollId) return false;
  if (tonnageCutForRollOnStep(step, rollId) <= 1e-6) return false;
  for (let k = stepIdx + 1; k < schedule.length; k += 1) {
    if (tonnageCutForRollOnStep(schedule[k], rollId) > 1e-6) return false;
  }
  return true;
}

/**
 * Gri segment metni: ara adımlarda kalan ton; son kesimde rollStatus ile stok/fire etiketi.
 */
function graySegmentLabel(
  remainingAfterTon: number,
  endOfRollTail: { fire: number; stock: number } | null | undefined,
): { main: string; title: string } {
  if (!endOfRollTail) {
    return {
      main: `Kalan ${formatTonDisplayTr(remainingAfterTon)} t`,
      title: `Kalan (bu adım sonrası): ${formatTonDisplayTr(remainingAfterTon)} t`,
    };
  }
  const parts: string[] = [];
  if (endOfRollTail.stock > 1e-4) {
    parts.push(`Stok ${formatTonDisplayTr(endOfRollTail.stock)} t`);
  }
  if (endOfRollTail.fire > 1e-4) {
    parts.push(`Fire ${formatTonDisplayTr(endOfRollTail.fire)} t`);
  }
  if (parts.length === 0 && remainingAfterTon > 1e-4) {
    parts.push(`Fire ${formatTonDisplayTr(remainingAfterTon)} t`);
  }
  const main = parts.length > 0 ? parts.join(' · ') : '—';
  return { main, title: `Rulo sonu — ${main}` };
}

/**
 * Bu adım başında ruloda kalan ton: stok toplamı eksi önceki adımlardaki kesimler (schedule sırası).
 */
function remainingTonBeforeStep(
  schedule: LineScheduleStepItem[],
  stepIndex: number,
  rollId: number | null,
  rollTotals: Map<number, number>,
  fallbackTotal: number,
): number {
  if (rollId == null) return 0;
  const initial = rollTotals.get(rollId) ?? fallbackTotal;
  let consumed = 0;
  for (let j = 0; j < stepIndex; j += 1) {
    consumed += tonnageCutForRollOnStep(schedule[j], rollId);
  }
  return Math.max(0, initial - consumed);
}

type ScheduleLaneProps = {
  bandLabel: string;
  rollId: number | null | undefined;
  orderId: number;
  tonnage: number;
  m2: number;
  /** Stok / rollStatus başlangıç toplamı (tooltip). */
  initialRollTon: number;
  /** Bu adım öncesi ruloda kalan ton (önceki adımlar düşülmüş). */
  remainingBeforeStepTon: number;
  /**
   * Çalıştırmadaki en büyük rulo toplam tonu; tüm adımlarda aynı px/ton ölçeği.
   * Aynı tonaj kesimi üst/alt ve adımlar arası aynı mavi genişliğe denk gelir.
   */
  chartScaleTon: number;
  /** Bu kesimden sonra bu ruloda başka kesim yoksa stok/fire (gri alanda "Kalan" yerine). */
  endOfRollTail?: { fire: number; stock: number } | null;
};

/**
 * Tek hat (üst veya alt) için tek adımlık segment çubuğu çizer.
 * Grafik genişliği chartScaleTon (en büyük rulo) ile sabitlenir; çubuk uzunluğu bu adım öncesi
 * kalan tona göre kısalır. Mavi = bu adım kesimi, gri = kesim sonrası kalan (kümülatif).
 */
function ScheduleLaneBar({
  bandLabel,
  rollId,
  orderId,
  tonnage,
  m2,
  initialRollTon,
  remainingBeforeStepTon,
  chartScaleTon,
  endOfRollTail = null,
}: ScheduleLaneProps) {
  const M = Math.max(chartScaleTon, 1e-9);
  const col = orderColor(orderId);
  const remBefore = Math.max(0, remainingBeforeStepTon);
  /** Bu adım öncesi kalan, max ruloya göre — rulonun “fiziksel” uzunluğu adımlarla kısalır. */
  const trackPct = Math.min(100, (remBefore / M) * 100);
  const remainingAfterTon = Math.max(0, remBefore - tonnage);
  const grayLabel = graySegmentLabel(remainingAfterTon, endOfRollTail);
  const hasRoll = rollId != null && initialRollTon > 1e-6;
  /** Bu adımda kesilen pay, adım öncesi kalan içinde (mavi / gri). */
  const usedFracOfRoll =
    tonnage > 1e-6 && remBefore > 1e-9 ? Math.min(1, tonnage / remBefore) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 shrink-0 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
        {bandLabel}
      </div>
      <div className="w-24 shrink-0 text-sm font-medium text-gray-700">
        {rollId != null ? `Rulo #${rollId}` : '—'}
      </div>
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <div className="w-full flex min-w-0">
          <div
            className="h-9 rounded-lg overflow-hidden flex bg-gray-100 border border-gray-100 shrink-0"
            style={{ minHeight: 36, width: `${trackPct}%` }}
          >
            {!hasRoll ? (
              <div className="h-full flex-1 flex items-center justify-center text-gray-400 text-[11px] italic">
                —
              </div>
            ) : tonnage > 1e-6 ? (
              <>
                <div
                  className="h-full flex items-center justify-center text-white text-[11px] font-bold border-r border-white/25 px-1 shrink-0 overflow-hidden"
                  style={{
                    flex: `0 0 ${usedFracOfRoll * 100}%`,
                    backgroundColor: col,
                    minWidth:
                      usedFracOfRoll > 0 && usedFracOfRoll * 100 < 18 ? '4.5rem' : undefined,
                  }}
                  title={`Sipariş ${orderId}: ${formatTonDisplayTr(tonnage)} t · ${fmtM2(m2)} m² · Adım öncesi kalan ${formatTonDisplayTr(remBefore)} t`}
                >
                  <span className="truncate text-center leading-tight">
                    S{orderId} ({formatTonDisplayTr(tonnage)}t)
                  </span>
                </div>
                <div
                  className={`h-full flex-1 min-w-0 flex items-center justify-center bg-gray-200/80 text-[10px] sm:text-[11px] font-semibold px-1 overflow-hidden ${
                    endOfRollTail ? 'text-red-700' : 'text-slate-600'
                  }`}
                  title={grayLabel.title}
                >
                  {remainingAfterTon > 1e-4 ? (
                    <span className="truncate text-center leading-tight">{grayLabel.main}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">—</span>
                  )}
                </div>
              </>
            ) : (
              <div
                className="h-full flex-1 flex items-center justify-center bg-gray-200/80 text-slate-600 text-[10px] sm:text-[11px] font-semibold px-2"
                title={`Kalan: ${formatTonDisplayTr(remBefore)} t`}
              >
                Kalan {formatTonDisplayTr(remBefore)} t
              </div>
            )}
          </div>
        </div>
        <div className="text-[10px] text-gray-500">
          Adım ton: {formatTonDisplayTr(tonnage)} t · {fmtM2(m2)} m²
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
            ? `Hat adımları (üst / alt); ölçek: en büyük rulo ${formatTonDisplayTr(maxTonaj)} t — aynı kesim tonajı aynı mavi genişlikte; rulolar önceki adımlar düşülerek kısalır`
            : 'Her rulonun sipariş bazında dağılımı (ton)'}
        </p>
      </div>
      <div className="p-6">
        {hasSchedule ? (
          <div className="space-y-6">
            {schedule.map((step: LineScheduleStepItem, stepIdx: number) => {
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
              const uRemBefore = remainingTonBeforeStep(schedule, stepIdx, uId, rollTotals, maxTonaj);
              const lRemBefore = remainingTonBeforeStep(schedule, stepIdx, lId, rollTotals, maxTonaj);
              const uRemAfter = Math.max(0, uRemBefore - uTon);
              const lRemAfter = Math.max(0, lRemBefore - lTon);
              const uTail =
                isLastRollCutInSchedule(schedule, stepIdx, uId, 'upper') && uTon > 1e-6
                  ? (() => {
                      const rs = rollStatus.find((r) => r.rollId === uId);
                      return rs ? { fire: rs.fire, stock: rs.stock } : { fire: uRemAfter, stock: 0 };
                    })()
                  : null;
              const lTail =
                isLastRollCutInSchedule(schedule, stepIdx, lId, 'lower') && lTon > 1e-6
                  ? (() => {
                      const rs = rollStatus.find((r) => r.rollId === lId);
                      return rs ? { fire: rs.fire, stock: rs.stock } : { fire: lRemAfter, stock: 0 };
                    })()
                  : null;

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
                      initialRollTon={uTotal}
                      remainingBeforeStepTon={uRemBefore}
                      chartScaleTon={maxTonaj}
                      endOfRollTail={uTail}
                    />
                    <ScheduleLaneBar
                      bandLabel="Alt"
                      rollId={lId}
                      orderId={oid}
                      tonnage={lTon}
                      m2={lM2}
                      initialRollTon={lTotal}
                      remainingBeforeStepTon={lRemBefore}
                      chartScaleTon={maxTonaj}
                      endOfRollTail={lTail}
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
                            title={`Sipariş ${seg.orderId}: ${formatTonDisplayTr(seg.tonnage)} ton`}
                          >
                            {seg.tonnage > 0.5 ? (
                              <>S{seg.orderId} ({formatTonDisplayTr(seg.tonnage)}t)</>
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
                            Stok ({formatTonDisplayTr(roll.stock)}t)
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
                            Fire ({formatTonDisplayTr(roll.fire)}t)
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Toplam: {formatTonDisplayTr(roll.totalTonnage)} ton
                    {!roll.isUnused && (
                      <>
                        {' '}
                        · Kullanılan: {formatTonDisplayTr(roll.used)} ton
                        {roll.stock > 0 && ` · Stok: ${formatTonDisplayTr(roll.stock)} ton`}
                        {roll.fire > 0 && ` · Fire: ${formatTonDisplayTr(roll.fire)} ton`}
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
