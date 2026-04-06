'use client';

import { useMemo } from 'react';
import { useDisplayResult } from '@/contexts/ResultViewContext';
import type { CuttingPlanItem } from '@/lib/api';

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

/**
 * API'de yoksa kesim planı satır sırasına göre rulodaki sipariş sırasını türetir.
 */
function rollSequenceFromCuttingPlan(cuttingPlan: CuttingPlanItem[], rollId: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const row of cuttingPlan) {
    if (row.rollId !== rollId) continue;
    if (seen.has(row.orderId)) continue;
    seen.add(row.orderId);
    out.push(row.orderId);
  }
  return out;
}

/**
 * rollOrderSequences nesnesini sayı anahtarlı sıra haritasına çevirir.
 */
function normalizeRollSequences(
  rollOrderSequences: Record<string, number[]> | undefined,
  cuttingPlan: CuttingPlanItem[],
  rollIds: number[],
): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const rid of rollIds) {
    const key = String(rid);
    const fromApi = rollOrderSequences?.[key];
    if (fromApi && fromApi.length > 0) {
      map.set(rid, [...fromApi]);
    } else {
      map.set(rid, rollSequenceFromCuttingPlan(cuttingPlan, rid));
    }
  }
  return map;
}

const fmt = (n: number, d = 2) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

const formatTon = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Rulo kimliğine göre tekrarlı renk seçer.
 */
function rollColor(rollId: number): string {
  return RULO_RENKLERI[(rollId - 1) % RULO_RENKLERI.length];
}

type SurfaceLane = 'üst' | 'alt';

/** Görsel üst/alt bölümü: model çıktısı veya ton dengelemeli yedek yerleştirme. */
type VisualSurfacePartition = { upperSlices: RollSlice[]; lowerSlices: RollSlice[] };

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
  return laneSlices.map((e) => `R${e.rollId} (${formatTon(e.tonnage)} t)`).join(' + ');
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
      <div className="flex-1 min-w-0 h-10 rounded-lg overflow-hidden flex border border-gray-200 bg-gray-200/60">
        {laneSlices.length === 0 ? (
          <div className="w-full flex items-center justify-center text-[10px] text-gray-500">—</div>
        ) : (
          laneSlices.map((s) => {
            const ww = barDenominatorTon > 0 ? (s.tonnage / barDenominatorTon) * 100 : 0;
            const slot = laneSlotForSlice(s, slicesForOrder, partition);
            const short = slot ? bandShortLabelFromSlot(slot) : null;
            const title = `${short ? `${short} · ` : ''}Rulo ${s.rollId} · Sipariş ${orderId}: ${formatTon(s.tonnage)} ton · ${fmt(s.m2)} m²`;
            return (
              <div
                key={s.rollId}
                className="relative h-full flex flex-col items-center justify-center text-white text-[10px] sm:text-xs font-bold px-0.5 text-center leading-tight border-r border-white/30 last:border-r-0 shrink-0"
                style={{
                  flex: `0 0 ${ww}%`,
                  minWidth: ww > 0 && ww < 12 ? '2.75rem' : undefined,
                  backgroundColor: rollColor(s.rollId),
                }}
                title={title}
              >
                {short ? <span className="text-[9px] opacity-95 leading-none">{short}</span> : null}
                <span>R{s.rollId}</span>
                <span className="opacity-90 font-semibold">{formatTon(s.tonnage)}t</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * İş akışı metninde kullanılan yüzey / rulo sıfatı.
 */
function surfaceWorkflowQualifier(
  rollId: number,
  orderId: number,
  byOrder: Map<number, RollSlice[]>,
  emphasizeCoating: boolean,
  partitionByOrder?: Map<number, VisualSurfacePartition>,
): string {
  const slices = byOrder.get(orderId) ?? [];
  if (!emphasizeCoating || slices.length < 2) return 'tek hat veya çift yüzey gösterimi kapalı';
  const slice = slices.find((s) => s.rollId === rollId);
  if (!slice) return 'bu siparişte dilim yok';
  const partition = partitionByOrder?.get(orderId);
  const slot = laneSlotForSlice(slice, slices, partition);
  if (!slot) return 'bilinmeyen rulo';
  const side = slot.lane === 'üst' ? 'üst' : 'alt';
  const modelSplit = slicesHaveModelSurfaceSplit(slices);
  if (modelSplit) {
    const u = slice.upperTonnage ?? 0;
    const l = slice.lowerTonnage ?? 0;
    if (u > 1e-6 && l > 1e-6) {
      return `üst ve alt yüzey (aynı rulo, model: ${formatTon(u)} t / ${formatTon(l)} t)`;
    }
    if (u > 1e-6) {
      if (slot.ordinalInLane === 1) return `üst yüzey (model — 1. rulo)`;
      return `üst yüzey (model — ${slot.ordinalInLane}. rulo)`;
    }
    if (l > 1e-6) {
      if (slot.ordinalInLane === 1) return `alt yüzey (model — 1. rulo)`;
      return `alt yüzey (model — ${slot.ordinalInLane}. rulo)`;
    }
    return 'model dilimi';
  }
  if (slot.ordinalInLane === 1) return `${side} yüzey (grafikte 1. rulo — ton dengelemeli görsel)`;
  return `${side} yüzey (grafikte ${slot.ordinalInLane}. rulo — aynı görsel bantta)`;
}

type WorkflowStepItem = {
  id: string;
  title: string;
  detail?: string;
};

/**
 * Birleştirilmiş sıra indeksinde her rulonun hangi siparişte olduğunu ve yüzey nitelemesini döner.
 */
function ordersAtSequenceIndex(
  seqByRoll: Map<number, number[]>,
  rollIds: number[],
  index: number,
): { rollId: number; orderId: number | null }[] {
  const out: { rollId: number; orderId: number | null }[] = [];
  for (const rid of rollIds) {
    const seq = seqByRoll.get(rid) ?? [];
    out.push({ rollId: rid, orderId: index < seq.length ? seq[index]! : null });
  }
  return out;
}

/**
 * Kesim planı sırasından türetilen adımlar: her pozisyonda hat durumu, ardından sipariş/rulo geçişleri.
 * Gerçek zaman çizelgesi değildir; aynı pozisyonda listelenen rulolar plan sırasında eş faz kabul edilir.
 */
function buildChronologicalWorkflow(
  seqByRoll: Map<number, number[]>,
  byOrder: Map<number, RollSlice[]>,
  emphasizeCoating: boolean,
  partitionByOrder?: Map<number, VisualSurfacePartition>,
): WorkflowStepItem[] {
  const rollIds = Array.from(seqByRoll.keys()).sort((a, b) => a - b);
  const maxLen = Math.max(0, ...rollIds.map((r) => (seqByRoll.get(r) ?? []).length));
  const steps: WorkflowStepItem[] = [];

  if (maxLen === 0) {
    steps.push({
      id: 'empty-seq',
      title: 'Sıra bilgisi yok',
      detail: 'Kesim planında rulo–sipariş satırı bulunamadı.',
    });
    return steps;
  }

  for (let i = 0; i < maxLen; i++) {
    const at = ordersAtSequenceIndex(seqByRoll, rollIds, i);
    const active = at.filter((x) => x.orderId != null);
    const lines = active.map(({ rollId, orderId }) => {
      const oid = orderId!;
      const sl = (byOrder.get(oid) ?? []).find((s) => s.rollId === rollId);
      const ton = sl ? `${formatTon(sl.tonnage)} t (bu rulo)` : '';
      const q = surfaceWorkflowQualifier(rollId, oid, byOrder, emphasizeCoating, partitionByOrder);
      return `• Rulo #${rollId} — ${q}: Sipariş ${oid}${ton ? ` · ${ton}` : ''}`;
    });
    const idle = at.filter((x) => x.orderId == null).map((x) => `• Rulo #${x.rollId}: bu planda bu sıra adımında kesim yok (rulo değişimi veya boşta olabilir).`);
    steps.push({
      id: `pos-${i}`,
      title: `Sıra ${i + 1}/${maxLen} — eşzamanlı hat görünümü`,
      detail: [...lines, ...idle].join('\n') || 'Aktif kesim satırı yok.',
    });
  }

  for (let i = 0; i < maxLen - 1; i++) {
    const before = ordersAtSequenceIndex(seqByRoll, rollIds, i);
    const after = ordersAtSequenceIndex(seqByRoll, rollIds, i + 1);
    const changes: string[] = [];
    for (let j = 0; j < rollIds.length; j++) {
      const rid = rollIds[j]!;
      const prevO = before[j]?.orderId ?? null;
      const nextO = after[j]?.orderId ?? null;
      if (prevO === nextO) continue;
      const oidForQualifier = nextO ?? prevO;
      const q =
        oidForQualifier != null
          ? surfaceWorkflowQualifier(rid, oidForQualifier, byOrder, emphasizeCoating, partitionByOrder)
          : '';
      if (prevO != null && nextO != null) {
        changes.push(
          `• Rulo #${rid} (${q}): Sipariş ${prevO} bu ruloda tamamlandı sayılır → Sipariş ${nextO} başlar (aynı fiziksel rulo, sipariş değişimi).`,
        );
      } else if (prevO != null && nextO == null) {
        changes.push(
          `• Rulo #${rid}: Sipariş ${prevO} sonrası bu rulo için planda yeni sipariş yok; rulo sökülüp yenisi takılabilir veya hat durur.`,
        );
      } else if (prevO == null && nextO != null) {
        changes.push(
          `• Rulo #${rid} (${q}): Bu adımda kesime giriş — Sipariş ${nextO} (önceki adımda bu ruloda iş yoktu; yeni rulo veya gecikmeli başlama).`,
        );
      }
    }
    if (changes.length > 0) {
      steps.push({
        id: `transition-${i}-${i + 1}`,
        title: `Sıra ${i + 1} → ${i + 2} geçişi`,
        detail: changes.join('\n'),
      });
    }
  }

  const lastIndex = maxLen - 1;
  const finalOrders = new Set(
    ordersAtSequenceIndex(seqByRoll, rollIds, lastIndex)
      .map((x) => x.orderId)
      .filter((o): o is number => o != null),
  );
  steps.push({
    id: 'footnote-rolls',
    title: 'Rulo seti ve süreklilik',
    detail: `Çözümde kullanılan rulolar: ${rollIds.map((r) => `#${r}`).join(', ')}. Üstteki geçişlerde "aynı rulo" deniyorsa fiziksel malzeme değişmeden sipariş sırası değişmiş demektir; "yeni rulo" veya "kesim yok" ifadesi planda bu hat için devam siparişi olmadığını gösterir (gerçek saha sırası üretim yönetimine bağlıdır). Son sıra adımında aktif siparişler: ${Array.from(finalOrders)
      .sort((a, b) => a - b)
      .join(', ') || '—'}.`,
  });

  return steps;
}

/**
 * Sonuç ekranı: sipariş–rulo stacked şema, üst/alt bandı bilgisi ve üretim iş akışı özeti.
 */
export function SolverOrderRollBreakdown() {
  const result = useDisplayResult();
  const cuttingPlan = result?.cuttingPlan ?? [];
  const rollOrderSequences = result?.rollOrderSequences;
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

  const seqByRoll = useMemo(
    () => normalizeRollSequences(rollOrderSequences, cuttingPlan, usedRollIds),
    [rollOrderSequences, cuttingPlan, usedRollIds],
  );

  const workflowSteps = useMemo(
    () =>
      buildChronologicalWorkflow(seqByRoll, byOrder, emphasizeCoatingLanes, visualSurfacePartitionByOrder),
    [seqByRoll, byOrder, emphasizeCoatingLanes, visualSurfacePartitionByOrder],
  );

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
            ? ' Yeni çözümlerde her satır bir yüzeyin model tonajını gösterir (satır toplamı = toplam talebin yarısı). Eski sonuçlarda satırlar yalnızca denge yedeğidir.'
            : ''}
        </p>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {orderIds.map((orderId) => {
          const slices = byOrder.get(orderId) ?? [];
          const totalTon = slices.reduce((s, x) => s + x.tonnage, 0);
          const totalM2 = slices.reduce((s, x) => s + x.m2, 0);
          const totalPanels = slices.reduce((s, x) => s + x.panelCount, 0);
          const perSurfaceTon = totalTon / 2;
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
                    Toplam: <strong>{fmt(totalTon)}</strong> ton
                  </span>
                  <span>
                    m² (plan): <strong>{fmt(totalM2)}</strong>
                  </span>
                  <span>
                    <strong>{slices.length}</strong> rulo
                  </span>
                </div>
              </div>

              <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-28 shrink-0 text-sm font-medium text-gray-700">
                  Sipariş {orderId}
                  <div className="text-[11px] font-normal text-gray-400 mt-0.5">{formatTon(totalTon)} t</div>
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
                    <div className="h-10 rounded-lg overflow-hidden flex bg-gray-100" style={{ minHeight: 40 }}>
                      {slices.map((s) => {
                        const w = totalTon > 0 ? (s.tonnage / totalTon) * 100 : 0;
                        return (
                          <div
                            key={`${orderId}-${s.rollId}`}
                            className="relative h-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold border-r border-white/30 px-0.5"
                            style={{
                              width: `${w}%`,
                              backgroundColor: rollColor(s.rollId),
                              minWidth: s.tonnage > 0.4 ? undefined : 48,
                            }}
                            title={`Rulo ${s.rollId} · Sipariş ${orderId}: ${formatTon(s.tonnage)} ton · ${fmt(s.m2)} m²`}
                          >
                            <span className="text-center leading-tight z-[1] px-0.5">
                              R{s.rollId}
                              <br />
                              <span className="opacity-90">{formatTon(s.tonnage)}t</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {emphasizeCoatingLanes && (
                <div className="px-4 pb-3 pt-1">
                  <div className="flex flex-wrap items-center gap-4 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 text-[18px]">layers</span>
                      <span className="text-[11px] font-semibold text-indigo-800">Çift yüzey</span>
                    </div>
                    <span className="text-[11px] text-indigo-700">
                      Üst yüzey: <strong>{formatTon(perSurfaceTon)}</strong> t
                    </span>
                    <span className="text-[11px] text-indigo-700">
                      Alt yüzey: <strong>{formatTon(perSurfaceTon)}</strong> t
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
                        <strong>Model:</strong> Üst yüzey toplamı <strong>{formatTon(upperAgg.ton)}</strong> t · alt
                        yüzey toplamı <strong>{formatTon(lowerAgg.ton)}</strong> t (her biri talebin yarısı{' '}
                        <strong>{formatTon(perSurfaceTon)}</strong> t; yuvarlama ile küçük fark görünebilir).
                      </p>
                      <p className="text-[10px] text-slate-600 leading-snug">
                        Çözüm, her sipariş için üst ve alt yüzeyde ayrı ayrı tam D/2 tonaj kısıtı ile üretilir; yüzeyler
                        kapalıdır.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-gray-700 leading-relaxed">
                        Üst satır toplamı <strong>{formatTon(upperAgg.ton)}</strong> t · alt satır{' '}
                        <strong>{formatTon(lowerAgg.ton)}</strong> t · yüzey başı hedef{' '}
                        <strong>{formatTon(perSurfaceTon)}</strong> t · satır farkı{' '}
                        <strong>{formatTon(tonBalanceDiff)}</strong> t
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
                            {modelSplit ? 'Sıra (model)' : 'Görsel bant'}
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
                      {slices.map((s) => {
                        const slot =
                          emphasizeCoatingLanes && partition && !modelSplit
                            ? laneSlotForSlice(s, slices, partition)
                            : null;
                        const bandLabel = modelSplit
                          ? bandLabelForModelSlice(s)
                          : slot
                            ? bandShortLabelFromSlot(slot)
                            : null;
                        return (
                          <tr key={`${orderId}-${s.rollId}-tbl`} className="hover:bg-gray-50/80">
                            {emphasizeCoatingLanes && partition ? (
                              <td className="px-3 py-2.5 text-gray-600">{bandLabel ?? '—'}</td>
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
                                  {fmt(s.upperTonnage ?? 0)}
                                </td>
                                <td className="px-3 py-2.5 text-right text-gray-800">
                                  {fmt(s.lowerTonnage ?? 0)}
                                </td>
                              </>
                            ) : null}
                            <td className="px-3 py-2.5 text-right text-gray-800">{fmt(s.tonnage)} ton</td>
                            <td className="px-3 py-2.5 text-right text-gray-700">{fmt(s.m2)}</td>
                            <td className="px-3 py-2.5 text-right text-gray-600">{s.panelCount}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-50 font-semibold text-xs">
                        <td
                          className="px-3 py-2"
                          colSpan={emphasizeCoatingLanes && partition ? 2 : 1}
                        >
                          Toplam
                        </td>
                        {modelSplit ? (
                          <>
                            <td className="px-3 py-2 text-right">{formatTon(perSurfaceTon)}</td>
                            <td className="px-3 py-2 text-right">{formatTon(perSurfaceTon)}</td>
                          </>
                        ) : null}
                        <td className="px-3 py-2 text-right">{fmt(totalTon)} ton</td>
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

      <div className="border-t border-gray-200">
        <div className="px-5 py-4 bg-navy-custom/5 border-b border-gray-100">
          <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-primary text-[20px]">format_list_numbered</span>
            İş akışı ve geçiş noktaları
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Önce her sıra adımında tüm aktif ruloların hangi siparişte olduğu listelenir; ardından bir sonraki adıma
            geçerken hangi görsel yüzey bandında (ton dengelemeli üst/alt) sipariş değiştiği veya rulo boşa çıktığı
            yazılır. Kayıtlı
            koşularda API sırası yoksa sıra kesim planı satır sırasından türetilir — gerçek üretim zamanlamasıyla
            birebir örtüşmeyebilir.
          </p>
        </div>
        <ol className="list-decimal list-inside space-y-3 p-5 md:p-6 text-sm text-gray-800">
          {workflowSteps.map((step) => (
            <li key={step.id} className="pl-1">
              <span className="font-semibold text-navy-custom">{step.title}</span>
              {step.detail && (
                <p className="text-xs text-gray-600 mt-1 ml-5 leading-relaxed whitespace-pre-line">{step.detail}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
