'use client';

/**
 * İki geçmiş optimizasyon çalıştırmasını (fileId) KPI, operasyonel metrikler,
 * girdi maliyetleri ve rulo kesim tablolarıyla karşılaştırır.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  getReportDownloadUrl,
  getModeComparisonCsvUrl,
  getSyncComparisonCsvUrl,
  getRun,
  getRuns,
  type RunDetail,
  type RollStatusItem,
  type RunSummary,
} from '@/lib/api';
import {
  CostBreakdownCompareSvg,
  TonFireStockCompareSvg,
  TotalCostCompareSvg,
} from '@/components/dashboard/KesimKarsilastirmaCharts';

const formatTL = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatNum = (n: number, decimals = 4) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * Sayı veya tanımsız değeri güvenle metne çevirir.
 */
function displayNum(n: number | undefined | null, decimals = 4): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  return formatNum(n, decimals);
}

/**
 * inputData üst seviye JSON anahtarını kullanıcı arayüzünde gösterilecek Türkçe etikete çevirir.
 */
function girdiUstSeviyeAlanEtiketi(alan: string): string {
  const etiketler: Record<string, string> = {
    material: 'Malzeme',
    costs: 'Maliyet katsayıları',
    rollSettings: 'Rulo ve kesim ayarları',
    orders: 'Sipariş listesi',
    strategyModes: 'Strateji modları',
    syncLevels: 'Senkron seviyeleri',
  };
  return etiketler[alan] ?? alan;
}

/**
 * İki çalıştırmanın inputData alanlarında üst düzey farkları listeler (etiketler Türkçe).
 */
function diffInputDataLabels(a: Record<string, unknown> | null, b: Record<string, unknown> | null): string[] {
  if (!a || !b) {
    return ['Bir veya iki çalıştırmada inputData eksik; kıyas sınırlı.'];
  }
  const keys = ['material', 'costs', 'rollSettings', 'orders', 'strategyModes', 'syncLevels'] as const;
  const out: string[] = [];
  for (const k of keys) {
    const va = JSON.stringify(a[k] ?? null);
    const vb = JSON.stringify(b[k] ?? null);
    if (va !== vb) {
      out.push(girdiUstSeviyeAlanEtiketi(k));
    }
  }
  return out.length ? out : ['Üst düzey girdi alanları aynı (JSON).'];
}

/**
 * Tek çalıştırma için sonuç sayfasıyla uyumlu özet metrikleri üretir.
 */
function buildOperationalMetrics(d: RunDetail) {
  const s = d.summary;
  const lt = d.lineTransitionsSummary;
  const cp = d.cuttingPlan ?? [];
  const rs = d.rollStatus ?? [];
  const ls = d.lineSchedule ?? [];
  const lineStepCount = lt?.stepCount ?? ls.length ?? 0;
  return {
    totalCost: s?.totalCost,
    totalFire: s?.totalFire,
    totalStock: s?.totalStock,
    openedRolls: s?.openedRolls,
    cuttingPlanRows: cp.length,
    rollStatusRows: rs.length,
    lineStepCount,
    lineTotalChanges: lt?.totalChanges,
    lineSyncChanges: lt?.synchronousChanges,
    lineIndepChanges: lt?.independentChanges,
    rollChangeCount: s?.rollChangeCount,
    surfaceSyncViolations: s?.surfaceSyncViolations,
    sequencePenalty: s?.sequencePenalty,
    interleavingViolationCount: s?.interleavingViolationCount,
    objective: d.objective,
  };
}

/**
 * inputData içinden maliyet katsayılarını okur.
 */
function readInputCosts(input: Record<string, unknown> | null | undefined) {
  const c = input?.costs as Record<string, unknown> | undefined;
  if (!c) return { fire: undefined as number | undefined, setup: undefined, stock: undefined };
  return {
    fire: typeof c.fireCost === 'number' ? c.fireCost : undefined,
    setup: typeof c.setupCost === 'number' ? c.setupCost : undefined,
    stock: typeof c.stockCost === 'number' ? c.stockCost : undefined,
  };
}

type MetricRow = { label: string; a: string; b: string; emphasize?: boolean };

/**
 * İki çalıştırmanın operasyonel metriklerinden karşılaştırma satırları üretir.
 */
function buildMetricRows(a: RunDetail, b: RunDetail): MetricRow[] {
  const ma = buildOperationalMetrics(a);
  const mb = buildOperationalMetrics(b);
  const rows: { label: string; va: unknown; vb: unknown; money?: boolean; intLike?: boolean }[] = [
    { label: 'Toplam maliyet (₺)', va: ma.totalCost, vb: mb.totalCost, money: true },
    { label: 'Amaç fonksiyonu (objective)', va: ma.objective, vb: mb.objective, money: true },
    { label: 'Toplam fire (ton)', va: ma.totalFire, vb: mb.totalFire },
    { label: 'Toplam stok (ton)', va: ma.totalStock, vb: mb.totalStock },
    { label: 'Açılan rulo sayısı', va: ma.openedRolls, vb: mb.openedRolls, intLike: true },
    { label: 'Kesim planı satır sayısı', va: ma.cuttingPlanRows, vb: mb.cuttingPlanRows, intLike: true },
    { label: 'Rulo durumu satır sayısı (kullanılan rulolar)', va: ma.rollStatusRows, vb: mb.rollStatusRows, intLike: true },
    { label: 'Üretim adım sayısı (hat çizelgesi)', va: ma.lineStepCount, vb: mb.lineStepCount, intLike: true },
    { label: 'Hat üzeri rulo geçişi (tak/çıkar toplam)', va: ma.lineTotalChanges, vb: mb.lineTotalChanges, intLike: true },
    { label: 'Eşzamanlı hat geçişi', va: ma.lineSyncChanges, vb: mb.lineSyncChanges, intLike: true },
    { label: 'Bağımsız hat geçişi', va: ma.lineIndepChanges, vb: mb.lineIndepChanges, intLike: true },
    { label: 'Kesim dilimi rulo değişimi (rollChangeCount)', va: ma.rollChangeCount, vb: mb.rollChangeCount, intLike: true },
    { label: 'Yüzey eşzamanlılık ihlali', va: ma.surfaceSyncViolations, vb: mb.surfaceSyncViolations, intLike: true },
    { label: 'Sıra cezası (sequencePenalty)', va: ma.sequencePenalty, vb: mb.sequencePenalty },
    { label: 'Araya sipariş ihlal sayısı', va: ma.interleavingViolationCount, vb: mb.interleavingViolationCount, intLike: true },
  ];

  const fmt = (v: unknown, money?: boolean, intLike?: boolean) => {
    if (v === undefined || v === null || Number.isNaN(v as number)) return '—';
    const n = Number(v);
    if (money) return `₺${formatTL(n)}`;
    if (intLike) return String(Math.round(n));
    return displayNum(n);
  };

  return rows.map((r) => ({
    label: r.label,
    a: fmt(r.va, r.money, r.intLike),
    b: fmt(r.vb, r.money, r.intLike),
    emphasize: r.label.includes('maliyet') || r.label.includes('fire'),
  }));
}

/**
 * Girdi maliyet satırları (A/B yan yana).
 */
/**
 * Görünür etiket: açıklama kısası veya fileId öneki.
 */
function runShortLabel(fileId: string, description?: string | null): string {
  const d = description?.trim();
  if (d) return d.length > 22 ? `${d.slice(0, 20)}…` : d;
  return fileId.length > 12 ? `${fileId.slice(0, 10)}…` : fileId;
}

/**
 * URL’nin görüntü olarak gömülebilecek bir görsel uzantısına sahip olup olmadığını döndürür.
 */
function isLikelyRasterImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(url.trim());
}

function buildCostInputRows(a: RunDetail, b: RunDetail): MetricRow[] {
  const ca = readInputCosts((a.inputData ?? null) as Record<string, unknown> | null);
  const cb = readInputCosts((b.inputData ?? null) as Record<string, unknown> | null);
  const fmt = (n: number | undefined) => (n === undefined ? '—' : displayNum(n, 2));
  return [
    { label: 'Fire birim maliyeti (girdi)', a: fmt(ca.fire), b: fmt(cb.fire) },
    { label: 'Kurulum birim maliyeti (girdi)', a: fmt(ca.setup), b: fmt(cb.setup) },
    { label: 'Stok birim maliyeti (girdi)', a: fmt(ca.stock), b: fmt(cb.stock) },
  ];
}

/**
 * Özet içindeki TL maliyet kırılımı satırlarını üretir (sonuç tablosu ile uyumlu alanlar).
 */
function buildCostBreakdownRows(a: RunDetail, b: RunDetail): MetricRow[] {
  const sa = a.summary;
  const sb = b.summary;
  const rows: { label: string; va: unknown; vb: unknown }[] = [
    { label: 'Fire maliyeti (₺)', va: sa.costFireLira, vb: sb.costFireLira },
    { label: 'Stok maliyeti toplam (₺)', va: sa.costStockLira, vb: sb.costStockLira },
    { label: 'Stok — üretim (₺)', va: sa.costStockProductionLira, vb: sb.costStockProductionLira },
    { label: 'Stok — raf / elde (₺)', va: sa.costStockShelfLira, vb: sb.costStockShelfLira },
    { label: 'Kurulum (₺)', va: sa.costSetupLira, vb: sb.costSetupLira },
    { label: 'Sıra cezası (₺)', va: sa.costSequencePenaltyLira, vb: sb.costSequencePenaltyLira },
    { label: 'Stok tutma tonu (üretim+raf)', va: sa.totalStockHoldingTon, vb: sb.totalStockHoldingTon },
    { label: 'Rafta kullanılmayan rulo (ton)', va: sa.totalUnusedInventoryTon, vb: sb.totalUnusedInventoryTon },
  ];
  const fmtMoney = (v: unknown) => {
    if (v === undefined || v === null || Number.isNaN(v as number)) return '—';
    return `₺${formatTL(Number(v))}`;
  };
  const fmtTon = (v: unknown) => {
    if (v === undefined || v === null || Number.isNaN(v as number)) return '—';
    return displayNum(Number(v));
  };
  return rows.map((r) => {
    const money = r.label.includes('₺');
    return {
      label: r.label,
      a: money ? fmtMoney(r.va) : fmtTon(r.va),
      b: money ? fmtMoney(r.vb) : fmtTon(r.vb),
      emphasize: r.label.includes('Fire maliyeti') || r.label.includes('Stok maliyeti toplam'),
    };
  });
}

/**
 * Rulo tablosu: sonuç sayfasındaki rollStatus ile aynı sütunlar.
 */
function RollStatusMiniTable({ rows, title }: { rows: RollStatusItem[]; title: string }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-2 py-2 font-medium">Rulo</th>
              <th className="px-2 py-2 font-medium text-right">Kullanılan</th>
              <th className="px-2 py-2 font-medium text-right">Fire</th>
              <th className="px-2 py-2 font-medium text-right">Stok</th>
              <th className="px-2 py-2 font-medium text-right">Sipariş</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-gray-400">
                  Rulo verisi yok
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.rollId} className="hover:bg-gray-50/80">
                  <td className="px-2 py-1.5 font-medium text-navy-custom">#{r.rollId}</td>
                  <td className="px-2 py-1.5 text-right">{displayNum(r.used)}</td>
                  <td className="px-2 py-1.5 text-right text-orange-600">{displayNum(r.fire)}</td>
                  <td className="px-2 py-1.5 text-right">{displayNum(r.stock)}</td>
                  <td className="px-2 py-1.5 text-right">{r.ordersUsed}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Kesim karşılaştırma paneli: run seçimi, KPI tablosu, girdi maliyetleri, rulo tabloları.
 */
export function KesimKarsilastirmaCompare() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [detailA, setDetailA] = useState<RunDetail | null>(null);
  const [detailB, setDetailB] = useState<RunDetail | null>(null);
  const [loadingPair, setLoadingPair] = useState(false);

  useEffect(() => {
    getRuns(80, 0)
      .then((r) => setRuns(r.runs || []))
      .catch(() => toast.error('Geçmiş çalıştırmalar yüklenemedi'))
      .finally(() => setLoadingList(false));
  }, []);

  const loadPair = useCallback(async () => {
    if (!idA || !idB) {
      toast.error('İki çalıştırma seçin');
      return;
    }
    if (idA === idB) {
      toast.error('Farklı iki çalıştırma seçin');
      return;
    }
    setLoadingPair(true);
    setDetailA(null);
    setDetailB(null);
    try {
      const [ra, rb] = await Promise.all([getRun(idA), getRun(idB)]);
      setDetailA(ra);
      setDetailB(rb);
    } catch {
      toast.error('Detaylar yüklenemedi');
    } finally {
      setLoadingPair(false);
    }
  }, [idA, idB]);

  const diffLabels = useMemo(() => {
    const ia = (detailA?.inputData ?? null) as Record<string, unknown> | null;
    const ib = (detailB?.inputData ?? null) as Record<string, unknown> | null;
    return diffInputDataLabels(ia, ib);
  }, [detailA, detailB]);

  const metricRows = useMemo(() => {
    if (!detailA || !detailB) return [];
    return buildMetricRows(detailA, detailB);
  }, [detailA, detailB]);

  const costInputRows = useMemo(() => {
    if (!detailA || !detailB) return [];
    return buildCostInputRows(detailA, detailB);
  }, [detailA, detailB]);

  const costBreakdownRows = useMemo(() => {
    if (!detailA || !detailB) return [];
    return buildCostBreakdownRows(detailA, detailB);
  }, [detailA, detailB]);

  const labelA = detailA ? runShortLabel(idA, detailA.inputData?.description) : 'A';
  const labelB = detailB ? runShortLabel(idB, detailB.inputData?.description) : 'B';

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-w-0">
        <h2 className="text-lg font-bold text-primary mb-4">Çalıştırma seçimi</h2>
        {loadingList ? (
          <p className="text-gray-500 text-sm">Liste yükleniyor…</p>
        ) : (
          <div className="flex flex-col gap-4 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
              <label className="flex min-w-0 flex-col gap-1 text-sm">
                <span className="text-gray-600">Çalıştırma A (fileId)</span>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full min-w-0 max-w-full bg-white"
                  value={idA}
                  onChange={(e) => setIdA(e.target.value)}
                >
                  <option value="">Seçin</option>
                  {runs.map((r) => (
                    <option key={r.file_id} value={r.file_id}>
                      {(r.description || r.file_id).slice(0, 48)} — {r.file_id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-sm">
                <span className="text-gray-600">Çalıştırma B (fileId)</span>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full min-w-0 max-w-full bg-white"
                  value={idB}
                  onChange={(e) => setIdB(e.target.value)}
                >
                  <option value="">Seçin</option>
                  {runs.map((r) => (
                    <option key={`b-${r.file_id}`} value={r.file_id}>
                      {(r.description || r.file_id).slice(0, 48)} — {r.file_id}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 w-full min-w-0 pt-1">
              <button
                type="button"
                onClick={() => void loadPair()}
                disabled={loadingPair}
                className="w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                {loadingPair ? 'Yükleniyor…' : 'Karşılaştır'}
              </button>
            </div>
          </div>
        )}
      </section>

      {detailA && detailB && (
        <>
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-primary mb-2">Girdi farkları (üst düzey)</h2>
            <ul className="list-disc pl-5 text-sm text-gray-700">
              {diffLabels.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-x-auto">
            <h2 className="text-lg font-bold text-primary mb-4">Girdi maliyet katsayıları</h2>
            <p className="text-xs text-gray-500 mb-3">
              Optimizasyona gönderilen fire / kurulum / stok birim fiyatları (inputData.costs).
            </p>
            <table className="min-w-[520px] w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-2 pr-4 font-medium">Metrik</th>
                  <th className="py-2 pr-4 font-semibold text-primary">A</th>
                  <th className="py-2 font-semibold text-secondary">B</th>
                </tr>
              </thead>
              <tbody>
                {costInputRows.map((row) => (
                  <tr key={row.label} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-700">{row.label}</td>
                    <td className="py-2 pr-4 font-mono">{row.a}</td>
                    <td className="py-2 font-mono">{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-w-0">
            <h2 className="text-lg font-bold text-primary mb-2">Grafikler (analiz özeti)</h2>
            <p className="text-xs text-gray-500 mb-4">
              Veriler seçilen çalıştırmaların özetinden üretilir; tez raporundaki bar / kırılım grafiklerine benzer
              görünüm sunar. Arka planda üretilen PNG dosyaları ayrıca aşağıda URL varsa önizlenir.
            </p>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-w-0">
              <TotalCostCompareSvg
                labelA={labelA}
                labelB={labelB}
                totalA={detailA.summary.totalCost}
                totalB={detailB.summary.totalCost}
              />
              <CostBreakdownCompareSvg
                labelA={`A · ${labelA}`}
                labelB={`B · ${labelB}`}
                summaryA={detailA.summary}
                summaryB={detailB.summary}
              />
              <TonFireStockCompareSvg
                labelA={labelA}
                labelB={labelB}
                fireA={detailA.summary.totalFire}
                fireB={detailB.summary.totalFire}
                stockA={detailA.summary.totalStock}
                stockB={detailB.summary.totalStock}
              />
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-x-auto min-w-0">
            <h2 className="text-lg font-bold text-primary mb-2">Detay: maliyet kırılımı ve stok metrikleri</h2>
            <p className="text-xs text-gray-500 mb-4">
              API özetindeki TL kalemleri ve tonajlar; toplam maliyet satırı ile tutarlılık kontrolü için kullanılabilir.
            </p>
            <table className="min-w-[560px] w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-2 pr-4 font-medium w-[44%]">Metrik</th>
                  <th className="py-2 pr-4 font-semibold text-primary w-[28%]">A</th>
                  <th className="py-2 font-semibold text-secondary w-[28%]">B</th>
                </tr>
              </thead>
              <tbody>
                {costBreakdownRows.map((row) => (
                  <tr
                    key={row.label}
                    className={`border-b border-gray-100 ${row.emphasize ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-2 pr-4 text-gray-700">{row.label}</td>
                    <td className="py-2 pr-4 font-mono">{row.a}</td>
                    <td className="py-2 font-mono">{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-x-auto min-w-0">
            <h2 className="text-lg font-bold text-primary mb-2">Sonuç özeti (aynı metrikler — sonuçlar tablosu / detay sayfası)</h2>
            <p className="text-xs text-gray-500 mb-4">
              Maliyet, fire, stok, rulo ve hat üzeri geçişler; kesim planı ve adım sayıları tek tabloda.
            </p>
            <table className="min-w-[640px] w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-2 pr-4 font-medium w-[40%]">Metrik</th>
                  <th className="py-2 pr-4 font-semibold text-primary w-[30%]">
                    A{' '}
                    <Link
                      href={`/dashboard/sonuc/${idA}`}
                      className="ml-1 text-xs font-normal text-primary hover:underline font-mono"
                    >
                      detay
                    </Link>
                  </th>
                  <th className="py-2 font-semibold text-secondary w-[30%]">
                    B{' '}
                    <Link
                      href={`/dashboard/sonuc/${idB}`}
                      className="ml-1 text-xs font-normal text-secondary hover:underline font-mono"
                    >
                      detay
                    </Link>
                  </th>
                </tr>
              </thead>
              <tbody>
                {metricRows.map((row) => (
                  <tr
                    key={row.label}
                    className={`border-b border-gray-100 ${row.emphasize ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-2 pr-4 text-gray-700">{row.label}</td>
                    <td className="py-2 pr-4 font-mono font-medium">{row.a}</td>
                    <td className="py-2 font-mono font-medium">{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-w-0">
            <h2 className="text-lg font-bold text-primary mb-2">Rapor, CSV ve görseller</h2>
            <p className="text-xs text-gray-500 mb-4">
              Excel sonuç dosyası backend üzerinden indirilir. Mod / senkron karşılaştırması CSV olarak mevcutsa
              bağlantılar açılır. Depoda PNG/JPEG rapor URL’i kayıtlıysa aşağıda küçük önizleme gösterilir.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <a
                href={getReportDownloadUrl(idA)}
                download
                className="inline-flex items-center justify-center rounded-lg border border-primary bg-white px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 min-w-0 max-w-full"
              >
                Excel raporu — A
              </a>
              <a
                href={getReportDownloadUrl(idB)}
                download
                className="inline-flex items-center justify-center rounded-lg border border-secondary bg-white px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary/5 min-w-0 max-w-full"
              >
                Excel raporu — B
              </a>
              {(detailA.modeComparisons?.length ?? 0) > 0 ? (
                <a
                  href={getModeComparisonCsvUrl(idA)}
                  download
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Mod CSV — A
                </a>
              ) : null}
              {(detailB.modeComparisons?.length ?? 0) > 0 ? (
                <a
                  href={getModeComparisonCsvUrl(idB)}
                  download
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Mod CSV — B
                </a>
              ) : null}
              {(detailA.syncComparisons?.length ?? 0) > 0 ? (
                <a
                  href={getSyncComparisonCsvUrl(idA)}
                  download
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Senkron CSV — A
                </a>
              ) : null}
              {(detailB.syncComparisons?.length ?? 0) > 0 ? (
                <a
                  href={getSyncComparisonCsvUrl(idB)}
                  download
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Senkron CSV — B
                </a>
              ) : null}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold text-gray-600">Çalıştırma A — depo görseli</p>
                {detailA.reportUrl && isLikelyRasterImageUrl(detailA.reportUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- harici depo URL; boyut sınırlı önizleme
                  <img
                    src={detailA.reportUrl}
                    alt={`Rapor önizleme A ${idA}`}
                    className="max-h-64 w-full rounded-lg border border-gray-200 object-contain bg-white"
                  />
                ) : detailA.reportUrl ? (
                  <a href={detailA.reportUrl} className="text-sm text-primary underline break-all" target="_blank" rel="noreferrer">
                    {detailA.reportUrl}
                  </a>
                ) : (
                  <p className="text-xs text-gray-400">Kayıtlı reportUrl yok (yalnızca Excel indirme kullanılabilir).</p>
                )}
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold text-gray-600">Çalıştırma B — depo görseli</p>
                {detailB.reportUrl && isLikelyRasterImageUrl(detailB.reportUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detailB.reportUrl}
                    alt={`Rapor önizleme B ${idB}`}
                    className="max-h-64 w-full rounded-lg border border-gray-200 object-contain bg-white"
                  />
                ) : detailB.reportUrl ? (
                  <a href={detailB.reportUrl} className="text-sm text-secondary underline break-all" target="_blank" rel="noreferrer">
                    {detailB.reportUrl}
                  </a>
                ) : (
                  <p className="text-xs text-gray-400">Kayıtlı reportUrl yok.</p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-w-0">
            <h2 className="text-lg font-bold text-primary mb-4">Rulo bazlı kullanım (sonuç tablosu ile uyumlu)</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RollStatusMiniTable rows={detailA.rollStatus ?? []} title={`Çalıştırma A — ${idA}`} />
              <RollStatusMiniTable rows={detailB.rollStatus ?? []} title={`Çalıştırma B — ${idB}`} />
            </div>
          </section>

          {(detailA.modeComparisons?.length || detailB.modeComparisons?.length) ? (
            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-x-auto">
              <h2 className="text-lg font-bold text-primary mb-4">Strateji modu karşılaştırması (kayıtlı)</h2>
              <p className="text-xs text-gray-500 mb-2">
                Her çalıştırmanın kaydettiği mod tablosu; satırlar çalıştırmaya göre değişir.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(detailA.modeComparisons, null, 2)}
                </pre>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(detailB.modeComparisons, null, 2)}
                </pre>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
