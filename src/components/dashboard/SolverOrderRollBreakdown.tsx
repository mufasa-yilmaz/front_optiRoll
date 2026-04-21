'use client';

import { useMemo, useState } from 'react';
import { useDisplayResult } from '@/contexts/ResultViewContext';
import { getModeComparisonCsvUrl, getSyncComparisonCsvUrl } from '@/lib/api';
import type { CuttingPlanItem } from '@/lib/api';
import { formatTonDisplayTr } from '@/components/dashboard/orders/helpers';

type RollSlice = {
  rollId: number;
  tonnage: number;
  m2: number;
  panelCount: number;
  upperTonnage?: number;
  lowerTonnage?: number;
};

/** Rulo segment rengi — Rulo–Sipariş grafiğinden farklı palet (rulo kimliğine göre). */
const RULO_RENKLERI = [
  '#0f766e',
  '#7c3aed',
  '#c2410c',
  '#0369a1',
  '#b45309',
  '#be185d',
  '#15803d',
  '#4338ca',
  '#a16207',
  '#0e7490',
];

/**
 * Kesim planını sipariş kimliğine göre gruplar; rulo bazlı dilimleri sıralı döner.
 */
function groupCuttingPlanByOrder(cuttingPlan: CuttingPlanItem[]): Map<number, RollSlice[]> {
  const map = new Map<number, RollSlice[]>();
  for (const row of cuttingPlan) {
    const oid = row.orderId;
    const slice: RollSlice = {
      rollId: row.rollId,
      tonnage: row.tonnage,
      m2: row.m2,
      panelCount: row.panelCount,
      upperTonnage: row.upperTonnage,
      lowerTonnage: row.lowerTonnage,
    };
    const list = map.get(oid) ?? [];
    list.push(slice);
    map.set(oid, list);
  }
  map.forEach((list) => {
    list.sort((a: RollSlice, b: RollSlice) => a.rollId - b.rollId);
  });
  return map;
}

const fmt = (n: number, d = 2) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

/**
 * Aynı dilim için ton ile birlikte eşdeğer m² değerini kısa metin olarak döner.
 */
function formatTonWithM2(tonnage: number, m2: number): string {
  return `${formatTonDisplayTr(tonnage)} t · ${fmt(m2)} m²`;
}

/**
 * Operatör tablosu için üst/alt hat hücre metnini üretir (tak/çıkar/devam).
 */
function formatOperatorHatCell(
  rollId: number | null | undefined,
  prevRollId: number | null | undefined,
  action: string | undefined,
): string {
  if (rollId == null) return '—';
  const a = action ?? 'devam';
  if (a === 'devam') return `R${rollId}`;
  if (a === 'takildi') {
    if (prevRollId != null && prevRollId !== rollId) {
      return `R${rollId} takıldı (R${prevRollId} çıkarıldı)`;
    }
    return `R${rollId} takıldı`;
  }
  if (a === 'cikarildi') {
    return prevRollId != null ? `R${prevRollId} çıkarıldı` : '—';
  }
  return `R${rollId}`;
}

/**
 * Sipariş aksiyon türüne göre satır arka plan sınıfı döner.
 */
function scheduleRowClass(orderAction: string | undefined): string {
  if (orderAction === 'geri_donus') return 'bg-amber-50/90';
  if (orderAction === 'tamamlandi') return 'bg-emerald-50/70';
  if (orderAction === 'degisti') return 'bg-sky-50/70';
  return '';
}

/**
 * Aksiyon özetine göre metin rengi (rulo / sipariş / eşzamanlı vurgusu).
 */
function actionSummaryClass(step: {
  upperAction?: string;
  lowerAction?: string;
  orderAction?: string;
}): string {
  const u = step.upperAction === 'takildi' || step.upperAction === 'cikarildi';
  const l = step.lowerAction === 'takildi' || step.lowerAction === 'cikarildi';
  const o = step.orderAction === 'degisti' || step.orderAction === 'geri_donus';
  if (u && l) return 'text-rose-800 font-semibold';
  if (u || l) return 'text-orange-800 font-medium';
  if (o) return 'text-sky-900 font-medium';
  return 'text-gray-700';
}

/**
 * Rulo kimliğine göre tekrarlı renk seçer.
 */
function rollColor(rollId: number): string {
  return RULO_RENKLERI[(rollId - 1) % RULO_RENKLERI.length];
}

type SurfaceLane = 'üst' | 'alt';

/** Görsel üst/alt bölümü: model çıktısı veya ton dengelemeli yedek yerleştirme. */
type VisualSurfacePartition = { upperSlices: RollSlice[]; lowerSlices: RollSlice[] };

/** Mod adını kullanıcıya okunur etiketle gösterir. */
function strategyLabel(mode: string): string {
  if (mode === 'az') return 'Az değişim';
  if (mode === 'orta') return 'Orta (dengeli)';
  if (mode === 'cok') return 'Çok esnek (fire odaklı)';
  if (mode === 'eszamanli') return 'Eşzamanlı';
  return mode;
}

/** Senkron seviye adını kullanıcıya okunur etiketle gösterir. */
function syncLevelLabel(level: string): string {
  if (level === 'serbest') return 'Serbest';
  if (level === 'dengeli') return 'Dengeli';
  if (level === 'siki') return 'Sıkı';
  return level;
}

/**
 * Kesim satırlarında upperTonnage/lowerTonnage tanımlı mı (yeni çift yüzey modeli).
 */
function slicesHaveModelSurfaceSplit(slices: RollSlice[]): boolean {
  if (slices.length === 0) return false;
  return slices.every(
    (s) => typeof s.upperTonnage === 'number' && typeof s.lowerTonnage === 'number',
  );
}

/**
 * Optimizasyonun üst/alt ton dağılımına göre satır dilimlerini üretir (tonaj = o yüzey payı).
 */
function modelBackedPartition(slices: RollSlice[]): VisualSurfacePartition {
  const upperSlices: RollSlice[] = [];
  const lowerSlices: RollSlice[] = [];
  for (const s of slices) {
    const u = s.upperTonnage ?? 0;
    const l = s.lowerTonnage ?? 0;
    if (u > 1e-6) {
      const ratio = s.tonnage > 0 ? u / s.tonnage : 0;
      upperSlices.push({
        rollId: s.rollId,
        tonnage: u,
        m2: s.m2 * ratio,
        panelCount: Math.round(s.panelCount * ratio),
        upperTonnage: u,
        lowerTonnage: 0,
      });
    }
    if (l > 1e-6) {
      const ratio = s.tonnage > 0 ? l / s.tonnage : 0;
      lowerSlices.push({
        rollId: s.rollId,
        tonnage: l,
        m2: s.m2 * ratio,
        panelCount: Math.round(s.panelCount * ratio),
        upperTonnage: 0,
        lowerTonnage: l,
      });
    }
  }
  const byRollId = (a: RollSlice, b: RollSlice) => a.rollId - b.rollId;
  upperSlices.sort(byRollId);
  lowerSlices.sort(byRollId);
  return { upperSlices, lowerSlices };
}

/**
 * Çift yüzey grafiği için ruloları üst/alt satırlara böler: büyük dilimden başlayarak,
 * o an daha hafif olan tarafa ekler — satır toplamlarını yüzey başı hedefine yaklaştırır (yalnızca sunum).
 */
function partitionSlicesForVisualSurfaces(slices: RollSlice[]): VisualSurfacePartition {
  const sorted = [...slices].sort((a, b) => b.tonnage - a.tonnage);
  const upperSlices: RollSlice[] = [];
  const lowerSlices: RollSlice[] = [];
  let upperSum = 0;
  let lowerSum = 0;
  for (const sl of sorted) {
    if (upperSum <= lowerSum) {
      upperSlices.push(sl);
      upperSum += sl.tonnage;
    } else {
      lowerSlices.push(sl);
      lowerSum += sl.tonnage;
    }
  }
  const byRollId = (a: RollSlice, b: RollSlice) => a.rollId - b.rollId;
  upperSlices.sort(byRollId);
  lowerSlices.sort(byRollId);
  return { upperSlices, lowerSlices };
}

/**
 * Önbellekli bölüm ile dilimin görsel üst/alt satırındaki sırasını döner (iş akışı / etiket).
 */
function laneSlotForSlice(
  slice: RollSlice,
  slicesForOrder: RollSlice[],
  partition?: VisualSurfacePartition,
): { lane: SurfaceLane; ordinalInLane: number } | null {
  const { upperSlices, lowerSlices } = partition ?? partitionSlicesForVisualSurfaces(slicesForOrder);
  const iu = upperSlices.findIndex((s) => s.rollId === slice.rollId);
  if (iu >= 0) return { lane: 'üst', ordinalInLane: iu + 1 };
  const il = lowerSlices.findIndex((s) => s.rollId === slice.rollId);
  if (il >= 0) return { lane: 'alt', ordinalInLane: il + 1 };
  return null;
}

/**
 * Kesim satırında üst/alt payı varsa tablo için kısa etiket (aynı ruloda ikisi de olabilir).
 */
function bandLabelForModelSlice(s: RollSlice): string {
  const u = s.upperTonnage ?? 0;
  const l = s.lowerTonnage ?? 0;
  if (u > 1e-6 && l > 1e-6) return 'Üst + Alt';
  if (u > 1e-6) return 'Üst';
  if (l > 1e-6) return 'Alt';
  return '—';
}

/**
 * Görsel banttaki kısa etiket: Üst, Alt veya Üst-2, Alt-2 …
 */
function bandShortLabelFromSlot(slot: { lane: SurfaceLane; ordinalInLane: number }): string {
  if (slot.lane === 'üst') {
    return slot.ordinalInLane === 1 ? 'Üst' : `Üst-${slot.ordinalInLane}`;
  }
  return slot.ordinalInLane === 1 ? 'Alt' : `Alt-${slot.ordinalInLane}`;
}

/**
 * Üst veya alt satırdaki dilimler için toplam ton, m² ve panel.
 */
function aggregateLaneMetrics(slices: RollSlice[]): { ton: number; m2: number; panels: number } {
  return slices.reduce(
    (acc, x) => ({
      ton: acc.ton + x.tonnage,
      m2: acc.m2 + x.m2,
      panels: acc.panels + x.panelCount,
    }),
    { ton: 0, m2: 0, panels: 0 },
  );
}

/**
 * Görsel üst veya alt satırdaki ruloları okunabilir metin olarak birleştirir.
 */
function formatLaneRollList(laneSlices: RollSlice[]): string {
  if (laneSlices.length === 0) return '—';
  return laneSlices.map((e) => `R${e.rollId} (${formatTonWithM2(e.tonnage, e.m2)})`).join(' + ');
}

/**
 * Çift yüzey tablosunda satırları operatör okumasına göre sıralar: önce üst bant (iç sıra), sonra alt bant.
 * Model satırlarında (upper/lower kolonları) davranışı bozmamak için rollId sırası korunur.
 */
function sortSlicesForOperatorTable(
  slices: RollSlice[],
  partition: VisualSurfacePartition | null,
  modelSplit: boolean,
): RollSlice[] {
  if (!partition || modelSplit) {
    return [...slices].sort((a, b) => a.rollId - b.rollId);
  }
  const laneRank = (lane: SurfaceLane) => (lane === 'üst' ? 0 : 1);
  return [...slices].sort((a, b) => {
    const sa = laneSlotForSlice(a, slices, partition);
    const sb = laneSlotForSlice(b, slices, partition);
    if (!sa || !sb) return a.rollId - b.rollId;
    const lr = laneRank(sa.lane) - laneRank(sb.lane);
    if (lr !== 0) return lr;
    const or = sa.ordinalInLane - sb.ordinalInLane;
    if (or !== 0) return or;
    return a.rollId - b.rollId;
  });
}

/**
 * Model çift yüzey tablosunda bir kesim satırı için üst/alt çubuktaki sıra etiketini üretir (aynı rulo iki yüzeyde olabilir).
 */
function sequenceLabelForModelRow(s: RollSlice, partition: VisualSurfacePartition): string {
  const u = s.upperTonnage ?? 0;
  const l = s.lowerTonnage ?? 0;
  const iu = u > 1e-6 ? partition.upperSlices.findIndex((x) => x.rollId === s.rollId) : -1;
  const il = l > 1e-6 ? partition.lowerSlices.findIndex((x) => x.rollId === s.rollId) : -1;
  const parts: string[] = [];
  if (iu >= 0) parts.push(`Üst · ${iu + 1}.`);
  if (il >= 0) parts.push(`Alt · ${il + 1}.`);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

/**
 * Sipariş kartında operatöre: hangi yüzeyde, soldan sağa hangi ruloların takılacağını gösteren kutu.
 */
function OperatorRollMountingGuide({
  orderId,
  upperSlices,
  lowerSlices,
  modelSplit,
}: {
  orderId: number;
  upperSlices: RollSlice[];
  lowerSlices: RollSlice[];
  modelSplit: boolean;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2.5 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-amber-700 text-[20px] shrink-0 mt-0.5">precision_manufacturing</span>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-xs font-bold text-amber-900">Operatör — rulo takma sırası (Sipariş #{String(orderId).padStart(2, '0')})</p>
            <p className="text-[10px] text-amber-900/85 leading-snug mt-0.5">
              Üst ve alt çubukta <strong>soldan sağa</strong> giden sıra, o yüzeyde hatta dizilecek ruloların takılma sırasıdır
              (soldaki önce, sağdaki sonra). Üst satır <strong>üst yüzey</strong>, alt satır <strong>alt yüzey</strong> içindir.
              {modelSplit ? (
                <>
                  {' '}
                  Bu kayıtta sıra <strong>model üst/alt ton</strong> dağılımına göredir.
                </>
              ) : (
                <>
                  {' '}
                  Bu kayıtta grafik satırları ton dengelemeli yedek yerleşimdir; yine de üst/alt ayrımı okuma içindir.
                </>
              )}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-white/80 border border-amber-100 px-2.5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800 mb-1.5">Üst yüzey — sıra</p>
              {upperSlices.length === 0 ? (
                <p className="text-[11px] text-gray-500">—</p>
              ) : (
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-800 font-medium leading-relaxed">
                  {upperSlices.map((s) => (
                    <li key={`op-u-${orderId}-${s.rollId}-${s.tonnage}`}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: rollColor(s.rollId) }} />
                        R{s.rollId}
                        <span className="text-gray-600 font-normal">({formatTonWithM2(s.tonnage, s.m2)})</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="rounded-md bg-white/80 border border-amber-100 px-2.5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800 mb-1.5">Alt yüzey — sıra</p>
              {lowerSlices.length === 0 ? (
                <p className="text-[11px] text-gray-500">—</p>
              ) : (
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-800 font-medium leading-relaxed">
                  {lowerSlices.map((s) => (
                    <li key={`op-l-${orderId}-${s.rollId}-${s.tonnage}`}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: rollColor(s.rollId) }} />
                        R{s.rollId}
                        <span className="text-gray-600 font-normal">({formatTonWithM2(s.tonnage, s.m2)})</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Üst/alt satırda yatay yığılmış rulo dilimleri (çift yüzey görseli).
 */
function SurfaceLaneStackedRow({
  bandLabel,
  bandSubLabel,
  laneSlices,
  orderId,
  barDenominatorTon,
  slicesForOrder,
  partition,
}: {
  bandLabel: string;
  bandSubLabel?: string;
  laneSlices: RollSlice[];
  orderId: number;
  /** Çubuk genişlikleri bu tona göre oranlanır (çift yüzeyde genelde yüzey başı D/2). */
  barDenominatorTon: number;
  slicesForOrder: RollSlice[];
  partition: VisualSurfacePartition;
}) {
  return (
    <div className="flex gap-2 sm:gap-3 items-stretch min-w-0">
      <div className="w-[4.75rem] sm:w-[5.5rem] shrink-0 flex flex-col justify-center border-r border-gray-100 pr-2">
        <span className="text-[11px] font-bold text-slate-700 leading-tight">{bandLabel}</span>
        {bandSubLabel ? (
          <span className="text-[9px] text-slate-500 leading-tight mt-0.5">{bandSubLabel}</span>
        ) : null}
      </div>
      <div className="flex-1 min-w-0 min-h-11 h-11 sm:h-12 rounded-lg overflow-hidden flex border border-gray-200 bg-gray-200/60">
        {laneSlices.length === 0 ? (
          <div className="w-full flex items-center justify-center text-[10px] text-gray-500">—</div>
        ) : (
          laneSlices.map((s) => {
            const ww = barDenominatorTon > 0 ? (s.tonnage / barDenominatorTon) * 100 : 0;
            const slot = laneSlotForSlice(s, slicesForOrder, partition);
            const short = slot ? bandShortLabelFromSlot(slot) : null;
            const title = `${short ? `${short} · ` : ''}Rulo ${s.rollId} · Sipariş ${orderId}: ${formatTonDisplayTr(s.tonnage)} ton · ${fmt(s.m2)} m²`;
            return (
              <div
                key={s.rollId}
                className="relative h-full flex flex-col items-center justify-center text-white text-[10px] sm:text-xs font-bold px-0.5 text-center leading-tight border-r border-white/30 last:border-r-0 shrink-0 py-0.5"
                style={{
                  flex: `0 0 ${ww}%`,
                  minWidth: ww > 0 && ww < 12 ? '2.75rem' : undefined,
                  backgroundColor: rollColor(s.rollId),
                }}
                title={title}
              >
                {short ? <span className="text-[9px] opacity-95 leading-none">{short}</span> : null}
                <span>R{s.rollId}</span>
                <span className="opacity-90 font-semibold leading-none">{formatTonDisplayTr(s.tonnage)}t</span>
                <span className="opacity-85 text-[8px] sm:text-[9px] font-semibold leading-none">{fmt(s.m2)} m²</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Sonuç ekranı: sipariş–rulo stacked şema ve üst/alt bandı bilgisi.
 */
export function SolverOrderRollBreakdown() {
  const result = useDisplayResult();
  const [showOrderPlan, setShowOrderPlan] = useState(false);
  /** useMemo ile referans sabitlenir; aşağıdaki useMemo bağımlılık uyarılarını önler. */
  const cuttingPlan = useMemo(
    () => result?.cuttingPlan ?? [],
    [result?.cuttingPlan],
  );
  const modeComparisons = result?.modeComparisons ?? [];
  const syncComparisons = result?.syncComparisons ?? [];
  const lineSchedule = result?.lineSchedule ?? [];
  const lineTransitionsSummary = result?.lineTransitionsSummary;
  const selectedModesCount = result?.selectedModesCount ?? result?.selectedModes?.length ?? 0;
  const showComparison = (result?.comparisonEnabled ?? false) || selectedModesCount > 1;
  const selectedSyncLevelsCount = result?.selectedSyncLevelsCount ?? result?.selectedSyncLevels?.length ?? 0;
  const showSyncComparison = selectedSyncLevelsCount > 1 && syncComparisons.length > 0;
  const input = result?.inputData;
  /** Kayıtta yoksa (yeni çalıştırmalar) çift yüzey varsayılır; eski kayıtlarda 1 ise tek-yüzey sunumu korunur. */
  const surfaceFactor = input?.surfaceFactor ?? 2;
  /** Çift yüzey (2× talep): model üst/alt tonajı D/2; eski kayıtta alan yoksa grafik ton dengelemeli yedek. */
  const emphasizeCoatingLanes = surfaceFactor >= 2;

  const byOrder = useMemo(() => groupCuttingPlanByOrder(cuttingPlan), [cuttingPlan]);

  /** Sipariş başına üst/alt dilimler: önce model (upperTonnage/lowerTonnage), yoksa görsel denge yedeği. */
  const visualSurfacePartitionByOrder = useMemo(() => {
    const m = new Map<number, VisualSurfacePartition>();
    if (!emphasizeCoatingLanes) return m;
    byOrder.forEach((slices, oid) => {
      if (slices.length >= 2) {
        m.set(
          oid,
          slicesHaveModelSurfaceSplit(slices)
            ? modelBackedPartition(slices)
            : partitionSlicesForVisualSurfaces(slices),
        );
      }
    });
    return m;
  }, [byOrder, emphasizeCoatingLanes]);
  const orderIds = useMemo(
    () => Array.from(byOrder.keys()).sort((a, b) => a - b),
    [byOrder],
  );

  const usedRollIds = useMemo(() => {
    const s = new Set<number>();
    cuttingPlan.forEach((c) => s.add(c.rollId));
    return Array.from(s).sort((a, b) => a - b);
  }, [cuttingPlan]);

  if (!result || orderIds.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
            <span className="material-symbols-outlined text-primary text-[22px]">layers</span>
            Sipariş — rulo dağılımı
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Tonaj doğrudan modelden gelir.{' '}
            {emphasizeCoatingLanes ? (
              <>
                <strong>Çift yüzey:</strong> Talep 2× hesaplanır, sipariş başına en az iki rulo kullanılır.
                Optimizasyon her sipariş için <strong>üst ve alt yüzey tonajını ayrı kısıtlayarak</strong> tam{' '}
                <strong>D/2</strong> yapar (iki yüzey aynı m² → eşit metal). Grafikteki üst/alt satırlar bu model
                çıktısıdır; eski kayıtlarda alan yoksa satırlar yalnızca okuma için ton dengelemeli yerleştirilir.
              </>
            ) : (
              <>Tek yüzey çarpanı ile kaydedilmiş koşu.</>
            )}
          </p>
        </div>
        {emphasizeCoatingLanes && (
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
            <span className="rounded-full bg-indigo-100 text-indigo-800 px-2 py-1">Çift yüzey (2× talep)</span>
          </div>
        )}
      </div>

      <div className="px-4 md:px-6 pt-5 pb-2 border-b border-gray-100">
        <h4 className="text-sm font-bold text-navy-custom flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">stacked_bar_chart</span>
          Sipariş – Rulo kullanım şeması (ton)
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          Her renkli dilim bir rulo katkısını gösterir.
          {emphasizeCoatingLanes
            ? ' Yeni çözümlerde her satır bir yüzeyin model tonajını gösterir (satır toplamı = toplam talebin yarısı). Eski sonuçlarda satırlar yalnızca denge yedeğidir. Çift yüzeyde çubukta soldan sağa sıra, o yüzeyde takılacak ruloların diziliş sırasıdır.'
            : ''}
        </p>
      </div>
      {showComparison && modeComparisons.length > 0 ? (
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 bg-slate-50/40">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-bold text-navy-custom flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">compare</span>
              Çok modlu özet karşılaştırma
            </h4>
            {result?.fileId ? (
              <a
                href={getModeComparisonCsvUrl(result.fileId)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                CSV indir
              </a>
            ) : null}
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="uppercase tracking-wide text-gray-500 border-b border-gray-100">
                  <th className="px-3 py-2 font-semibold">Mod</th>
                  <th className="px-3 py-2 font-semibold">Durum</th>
                  <th className="px-3 py-2 font-semibold text-right">Fire (t)</th>
                  <th className="px-3 py-2 font-semibold text-right">Maliyet</th>
                  <th className="px-3 py-2 font-semibold text-right">Rulo değişimi</th>
                  <th className="px-3 py-2 font-semibold text-right">Sync ihlali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {modeComparisons.map((item) => (
                  <tr key={`${item.mode}-${item.status}`} className="hover:bg-gray-50/70">
                    <td className="px-3 py-2.5 font-semibold text-navy-custom">{strategyLabel(item.mode)}</td>
                    <td className="px-3 py-2.5">
                      {item.status === 'Optimal' ? (
                        <span className="text-emerald-700 font-semibold">Optimal</span>
                      ) : (
                        <span className="text-rose-700 font-semibold">{item.status}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-700">
                      {typeof item.totalFire === 'number' ? formatTonDisplayTr(item.totalFire) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-700">
                      {typeof item.totalCost === 'number' ? fmt(item.totalCost) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-700">
                      {typeof item.rollChangeCount === 'number' ? item.rollChangeCount : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-700">
                      {typeof item.surfaceSyncViolations === 'number' ? item.surfaceSyncViolations : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Etiketleme: en düşük maliyet ve en düşük fire bilgisi karşılaştırma amaçlıdır; karar için operasyon kısıtlarıyla birlikte değerlendirin.
          </p>
        </div>
      ) : null}

      {showSyncComparison ? (
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 bg-cyan-50/30">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-bold text-navy-custom flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">hub</span>
              Senkron seviye kisa karsilastirma
            </h4>
            {result?.fileId ? (
              <a
                href={getSyncComparisonCsvUrl(result.fileId)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Sync CSV
              </a>
            ) : null}
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="uppercase tracking-wide text-gray-500 border-b border-gray-100">
                  <th className="px-3 py-2 font-semibold">Seviye</th>
                  <th className="px-3 py-2 font-semibold">Durum</th>
                  <th className="px-3 py-2 font-semibold text-right">Fire (t)</th>
                  <th className="px-3 py-2 font-semibold text-right">Maliyet</th>
                  <th className="px-3 py-2 font-semibold text-right">Degisim</th>
                  <th className="px-3 py-2 font-semibold text-right">Eszamanli</th>
                  <th className="px-3 py-2 font-semibold text-right">Bagimsiz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {syncComparisons.map((item) => (
                  <tr key={`${item.syncLevel}-${item.status}`} className="hover:bg-gray-50/70">
                    <td className="px-3 py-2.5 font-semibold text-navy-custom">{syncLevelLabel(item.syncLevel)}</td>
                    <td className="px-3 py-2.5">{item.status}</td>
                    <td className="px-3 py-2.5 text-right">{typeof item.totalFire === 'number' ? formatTonDisplayTr(item.totalFire) : '—'}</td>
                    <td className="px-3 py-2.5 text-right">{typeof item.totalCost === 'number' ? fmt(item.totalCost) : '—'}</td>
                    <td className="px-3 py-2.5 text-right">{item.rollChangeCount ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right">{item.synchronousChanges ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right">{item.independentChanges ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="px-4 md:px-6 py-4 border-b border-gray-100 bg-emerald-50/30">
        <h4 className="text-sm font-bold text-navy-custom mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">timeline</span>
          Hat olayları ve operatör adım planı
        </h4>
        <p className="text-[10px] text-gray-600 mb-2 leading-snug">
          Her adımda üst ve alt hat aynı siparişi keser. Aksiyon özeti MILP sıralaması ve rulo geçmişiyle üretilir.
        </p>
        {lineTransitionsSummary ? (
          <div className="flex flex-wrap gap-3 text-[11px] text-gray-700 mb-2">
            <span>Toplam değişim: <strong>{lineTransitionsSummary.totalChanges}</strong></span>
            <span>Eşzamanlı: <strong>{lineTransitionsSummary.synchronousChanges}</strong></span>
            <span>Bağımsız: <strong>{lineTransitionsSummary.independentChanges}</strong></span>
            <span>Adım: <strong>{lineTransitionsSummary.stepCount ?? lineSchedule.length}</strong></span>
          </div>
        ) : null}
        {lineSchedule.length > 0 ? (
          <div className="mb-3 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="uppercase tracking-wide text-gray-500 border-b border-gray-100">
                  <th className="px-3 py-2 font-semibold whitespace-nowrap">Adım</th>
                  <th className="px-3 py-2 font-semibold min-w-[140px]">Üst Hat</th>
                  <th className="px-3 py-2 font-semibold min-w-[140px]">Alt Hat</th>
                  <th className="px-3 py-2 font-semibold whitespace-nowrap">Aktif Sipariş</th>
                  <th className="px-3 py-2 font-semibold min-w-[180px]">Aksiyon</th>
                  <th className="px-3 py-2 font-semibold">Kesilen Parça</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineSchedule.map((step) => (
                  <tr
                    key={`sch-${step.step}-${step.orderId}-${step.upperRollId ?? 'u'}-${step.lowerRollId ?? 'l'}`}
                    className={`hover:bg-gray-50/70 ${scheduleRowClass(step.orderAction)}`}
                  >
                    <td className="px-3 py-2.5 font-semibold text-navy-custom whitespace-nowrap">{step.step}</td>
                    <td className="px-3 py-2.5 text-gray-800 leading-snug">
                      {formatOperatorHatCell(
                        step.upperRollId,
                        step.prevUpperRollId ?? undefined,
                        step.upperAction,
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-800 leading-snug">
                      {formatOperatorHatCell(
                        step.lowerRollId,
                        step.prevLowerRollId ?? undefined,
                        step.lowerAction,
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-medium text-navy-custom">#{step.orderId}</td>
                    <td className={`px-3 py-2.5 leading-snug ${actionSummaryClass(step)}`}>
                      {step.actionSummary ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 leading-snug">
                      {step.cuts
                        .map((c) => `S${c.orderId}/R${c.rollId}: ${formatTonWithM2(c.tonnage, c.m2)}`)
                        .join(' · ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="px-4 md:px-6 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
        <h4 className="text-sm font-bold text-navy-custom">Sipariş Bazlı Kesim Planı</h4>
        <button
          type="button"
          onClick={() => setShowOrderPlan((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
        >
          <span className="material-symbols-outlined text-[16px]">{showOrderPlan ? 'visibility_off' : 'visibility'}</span>
          {showOrderPlan ? 'Gizle' : 'Goster'}
        </button>
      </div>

      {showOrderPlan ? (
      <div className="p-4 md:p-6 space-y-4">
        {orderIds.map((orderId) => {
          const slices = byOrder.get(orderId) ?? [];
          const totalTon = slices.reduce((s, x) => s + x.tonnage, 0);
          const totalM2 = slices.reduce((s, x) => s + x.m2, 0);
          const totalPanels = slices.reduce((s, x) => s + x.panelCount, 0);
          const perSurfaceTon = totalTon / 2;
          const perSurfaceM2 = totalM2 / 2;
          const showDualSurfaceChart = emphasizeCoatingLanes && slices.length >= 2;
          const partition = showDualSurfaceChart
            ? (visualSurfacePartitionByOrder.get(orderId) ?? partitionSlicesForVisualSurfaces(slices))
            : null;
          const upperSlices = partition?.upperSlices ?? [];
          const lowerSlices = partition?.lowerSlices ?? [];
          const upperAgg = showDualSurfaceChart ? aggregateLaneMetrics(upperSlices) : null;
          const lowerAgg = showDualSurfaceChart ? aggregateLaneMetrics(lowerSlices) : null;
          const tonBalanceDiff =
            upperAgg && lowerAgg ? Math.abs(upperAgg.ton - lowerAgg.ton) : 0;
          const showDetailTable = slices.length > 2;
          const modelSplit = slicesHaveModelSurfaceSplit(slices);
          const upperBarDen = modelSplit
            ? perSurfaceTon
            : Math.max(upperAgg?.ton ?? 0, 1e-9);
          const lowerBarDen = modelSplit
            ? perSurfaceTon
            : Math.max(lowerAgg?.ton ?? 0, 1e-9);

          return (
            <div
              key={orderId}
              className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-navy-custom/5 border-b border-gray-100">
                <span className="font-bold text-navy-custom">
                  Sipariş #{String(orderId).padStart(2, '0')}
                </span>
                <div className="text-xs text-gray-600 flex flex-wrap gap-3">
                  <span>
                    Toplam: <strong>{formatTonWithM2(totalTon, totalM2)}</strong> (plan)
                  </span>
                  <span>
                    <strong>{slices.length}</strong> rulo
                  </span>
                </div>
              </div>

              <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-28 shrink-0 text-sm font-medium text-gray-700">
                  Sipariş {orderId}
                  <div className="text-[11px] font-normal text-gray-400 mt-0.5">{formatTonWithM2(totalTon, totalM2)}</div>
                </div>
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  {showDualSurfaceChart && partition ? (
                    <>
                      <SurfaceLaneStackedRow
                        bandLabel="Üst"
                        bandSubLabel={modelSplit ? 'üst yüzey (model)' : 'görsel bant'}
                        laneSlices={upperSlices}
                        orderId={orderId}
                        barDenominatorTon={upperBarDen}
                        slicesForOrder={slices}
                        partition={partition}
                      />
                      <SurfaceLaneStackedRow
                        bandLabel="Alt"
                        bandSubLabel={modelSplit ? 'alt yüzey (model)' : 'görsel bant'}
                        laneSlices={lowerSlices}
                        orderId={orderId}
                        barDenominatorTon={lowerBarDen}
                        slicesForOrder={slices}
                        partition={partition}
                      />
                    </>
                  ) : (
                    <div className="min-h-11 h-11 sm:h-12 rounded-lg overflow-hidden flex bg-gray-100">
                      {slices.map((s) => {
                        const w = totalTon > 0 ? (s.tonnage / totalTon) * 100 : 0;
                        return (
                          <div
                            key={`${orderId}-${s.rollId}`}
                            className="relative h-full flex flex-col items-center justify-center text-white text-[10px] sm:text-xs font-bold border-r border-white/30 px-0.5 py-0.5"
                            style={{
                              width: `${w}%`,
                              backgroundColor: rollColor(s.rollId),
                              minWidth: s.tonnage > 0.4 ? undefined : 48,
                            }}
                            title={`Rulo ${s.rollId} · Sipariş ${orderId}: ${formatTonDisplayTr(s.tonnage)} ton · ${fmt(s.m2)} m²`}
                          >
                            <span className="text-center leading-tight z-[1] px-0.5 flex flex-col items-center">
                              <span>R{s.rollId}</span>
                              <span className="opacity-90 leading-none">{formatTonDisplayTr(s.tonnage)}t</span>
                              <span className="opacity-85 text-[8px] sm:text-[9px] leading-none">{fmt(s.m2)} m²</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {showDualSurfaceChart && partition ? (
                <div className="px-4 pb-3">
                  <OperatorRollMountingGuide
                    orderId={orderId}
                    upperSlices={upperSlices}
                    lowerSlices={lowerSlices}
                    modelSplit={modelSplit}
                  />
                </div>
              ) : null}

              {emphasizeCoatingLanes && (
                <div className="px-4 pb-3 pt-1">
                  <div className="flex flex-wrap items-center gap-4 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 text-[18px]">layers</span>
                      <span className="text-[11px] font-semibold text-indigo-800">Çift yüzey</span>
                    </div>
                    <span className="text-[11px] text-indigo-700">
                      Üst yüzey: <strong>{formatTonWithM2(perSurfaceTon, perSurfaceM2)}</strong>
                    </span>
                    <span className="text-[11px] text-indigo-700">
                      Alt yüzey: <strong>{formatTonWithM2(perSurfaceTon, perSurfaceM2)}</strong>
                    </span>
                    <span className="text-[10px] text-indigo-500">
                      {modelSplit ? '(model ile zorunlu)' : '(hedef; eski grafik yedeğinde satırlar yaklaşık)'}
                    </span>
                  </div>
                </div>
              )}

              {showDualSurfaceChart && upperAgg && lowerAgg ? (
                <div className="px-4 pb-3 space-y-1.5 border-t border-gray-50 pt-3">
                  {modelSplit ? (
                    <>
                      <p className="text-[11px] text-gray-700 leading-relaxed">
                        <strong>Model:</strong> Üst yüzey toplamı <strong>{formatTonWithM2(upperAgg.ton, upperAgg.m2)}</strong> · alt
                        yüzey toplamı <strong>{formatTonWithM2(lowerAgg.ton, lowerAgg.m2)}</strong> (her yüzey hedefi talebin yarısı:{' '}
                        <strong>{formatTonWithM2(perSurfaceTon, perSurfaceM2)}</strong>; yuvarlama ile küçük fark görünebilir).
                      </p>
                      <p className="text-[10px] text-slate-600 leading-snug">
                        Çözüm, her sipariş için üst ve alt yüzeyde ayrı ayrı tam D/2 tonaj kısıtı ile üretilir; yüzeyler
                        kapalıdır.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-gray-700 leading-relaxed">
                        Üst satır toplamı <strong>{formatTonWithM2(upperAgg.ton, upperAgg.m2)}</strong> · alt satır{' '}
                        <strong>{formatTonWithM2(lowerAgg.ton, lowerAgg.m2)}</strong> · yüzey başı hedef{' '}
                        <strong>{formatTonWithM2(perSurfaceTon, perSurfaceM2)}</strong> · satır farkı{' '}
                        <strong>{formatTonDisplayTr(tonBalanceDiff)}</strong> t
                      </p>
                      <p className="text-[10px] text-slate-600 leading-snug">
                        Bu kayıtta üst/alt model alanları yok; satırlar yalnızca okuma için ton dengelemeli yerleştirme.
                        Yeni optimizasyonlarda her yüzey D/2 modelde zorunludur.
                      </p>
                    </>
                  )}
                </div>
              ) : null}

              {showDetailTable && (
                <div className="overflow-x-auto px-2 pb-4">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-100">
                        {emphasizeCoatingLanes && partition ? (
                          <th className="px-3 py-2 font-semibold">
                            {modelSplit ? 'Yüzey (model)' : 'Yüzey / görsel bant'}
                          </th>
                        ) : null}
                        {emphasizeCoatingLanes && partition ? (
                          <th className="px-3 py-2 font-semibold whitespace-nowrap">
                            {modelSplit ? 'Sıra (yüzeyde)' : 'Takma sırası'}
                          </th>
                        ) : null}
                        <th className="px-3 py-2 font-semibold">Rulo</th>
                        {modelSplit ? (
                          <>
                            <th className="px-3 py-2 font-semibold text-right">Üst (t)</th>
                            <th className="px-3 py-2 font-semibold text-right">Alt (t)</th>
                          </>
                        ) : null}
                        <th className="px-3 py-2 font-semibold text-right">Tonaj</th>
                        <th className="px-3 py-2 font-semibold text-right">m²</th>
                        <th className="px-3 py-2 font-semibold text-right">Panel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sortSlicesForOperatorTable(slices, partition && emphasizeCoatingLanes ? partition : null, modelSplit).map((s) => {
                        const slot =
                          emphasizeCoatingLanes && partition
                            ? laneSlotForSlice(s, slices, partition)
                            : null;
                        const bandLabel = modelSplit
                          ? bandLabelForModelSlice(s)
                          : slot
                            ? bandShortLabelFromSlot(slot)
                            : null;
                        const sequenceLabel =
                          emphasizeCoatingLanes && partition
                            ? modelSplit
                              ? sequenceLabelForModelRow(s, partition)
                              : slot
                                ? `${slot.lane === 'üst' ? 'Üst' : 'Alt'} · ${slot.ordinalInLane}. (soldan)`
                                : '—'
                            : null;
                        return (
                          <tr key={`${orderId}-${s.rollId}-tbl`} className="hover:bg-gray-50/80">
                            {emphasizeCoatingLanes && partition ? (
                              <td className="px-3 py-2.5 text-gray-600">{bandLabel ?? '—'}</td>
                            ) : null}
                            {emphasizeCoatingLanes && partition ? (
                              <td className="px-3 py-2.5 text-gray-700 text-xs whitespace-nowrap">
                                {sequenceLabel ?? '—'}
                              </td>
                            ) : null}
                            <td className="px-3 py-2.5">
                              <span className="inline-flex items-center gap-2 font-semibold text-navy-custom">
                                <span
                                  className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                                  style={{ backgroundColor: rollColor(s.rollId) }}
                                />
                                R{s.rollId}
                              </span>
                            </td>
                            {modelSplit ? (
                              <>
                                <td className="px-3 py-2.5 text-right text-gray-800">
                                  {formatTonDisplayTr(s.upperTonnage ?? 0)}
                                </td>
                                <td className="px-3 py-2.5 text-right text-gray-800">
                                  {formatTonDisplayTr(s.lowerTonnage ?? 0)}
                                </td>
                              </>
                            ) : null}
                            <td className="px-3 py-2.5 text-right text-gray-800">{formatTonDisplayTr(s.tonnage)} ton</td>
                            <td className="px-3 py-2.5 text-right text-gray-700">{fmt(s.m2)}</td>
                            <td className="px-3 py-2.5 text-right text-gray-600">{s.panelCount}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-50 font-semibold text-xs">
                        <td
                          className="px-3 py-2"
                          colSpan={emphasizeCoatingLanes && partition ? 3 : 1}
                        >
                          Toplam
                        </td>
                        {modelSplit ? (
                          <>
                            <td className="px-3 py-2 text-right">{formatTonDisplayTr(perSurfaceTon)}</td>
                            <td className="px-3 py-2 text-right">{formatTonDisplayTr(perSurfaceTon)}</td>
                          </>
                        ) : null}
                        <td className="px-3 py-2 text-right">{formatTonDisplayTr(totalTon)} ton</td>
                        <td className="px-3 py-2 text-right">{fmt(totalM2)}</td>
                        <td className="px-3 py-2 text-right">{totalPanels}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
      ) : (
        <div className="px-4 md:px-6 py-4 text-xs text-gray-500">Sipariş bazlı kesim planı varsayılan olarak gizlidir.</div>
      )}

      {emphasizeCoatingLanes && orderIds.length > 0 && (
        <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-slate-50/50">
          <h4 className="text-sm font-bold text-navy-custom mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">table_chart</span>
            Yüzey–rulo özeti
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Yeni çözümlerde sütunlar model üst/alt ton dağılımıdır (satır toplamları D/2). Eski kayıtlarda ton
            dengelemeli yedek yerleştirmedir.
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-100">
                  <th className="px-3 py-2 font-semibold">Sipariş</th>
                  <th className="px-3 py-2 font-semibold">Üst (görsel)</th>
                  <th className="px-3 py-2 font-semibold">Alt (görsel)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orderIds.map((oid) => {
                  const sl = byOrder.get(oid) ?? [];
                  const p = visualSurfacePartitionByOrder.get(oid);
                  if (sl.length < 2 || !p) {
                    return (
                      <tr key={`map-${oid}`}>
                        <td className="px-3 py-2.5 font-semibold text-navy-custom">#{oid}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500" colSpan={2}>
                          İki satırlı görsel için en az iki rulo gerekir.
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={`map-${oid}`} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2.5 font-semibold text-navy-custom">#{oid}</td>
                      <td className="px-3 py-2.5 text-gray-800 text-xs leading-relaxed">
                        {formatLaneRollList(p.upperSlices)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-800 text-xs leading-relaxed">
                        {formatLaneRollList(p.lowerSlices)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="px-4 md:px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs font-semibold text-gray-600 mb-2">Rulo renk anahtarı</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {usedRollIds.map((rid) => (
            <span key={rid} className="flex items-center gap-1.5 text-xs text-gray-700">
              <span
                className="inline-block w-3 h-3 rounded"
                style={{ backgroundColor: rollColor(rid) }}
              />
              Rulo {rid}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
