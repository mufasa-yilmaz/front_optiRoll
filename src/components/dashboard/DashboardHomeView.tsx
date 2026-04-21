'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  getOrders,
  getReportDownloadUrl,
  getRuns,
  getStockRolls,
  type Order,
  type RunSummary,
  type StockRoll,
} from '@/lib/api';
import {
  getRunStatusLabelTr,
  getRunSummaryCostFireLira,
  getRunSummaryCostSequencePenaltyLira,
  getRunSummaryCostSetupLira,
  getRunSummaryCostStockLira,
  getRunSummaryCostStockProductionLira,
  getRunSummaryCostStockShelfLira,
  getRunSummaryOpenedRolls,
  getRunSummaryTotalCost,
  getRunSummaryTotalFire,
  getRunSummaryTotalStock,
} from '@/lib/runSummaryFields';
import { DashboardOverviewHeader } from '@/components/dashboard/DashboardOverviewHeader';
import {
  DEFAULT_ORDER_TABLE_MATERIAL,
  formatTonDisplayTr,
  sumOrdersEstimatedDemandTon,
} from '@/components/dashboard/orders/helpers';

const formatTL = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/**
 * Tarih ISO string'ini kısa Türkçe metne çevirir.
 */
function formatRunDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Çalıştırmaları oluşturulma zamanına göre yeniden eskiye sıralar.
 */
function sortRunsByDateDesc(runs: RunSummary[]): RunSummary[] {
  return [...runs].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

/** Canlı operasyon: kayıtlı sipariş özeti kartı. */
function LiveOrdersSummaryCard(props: {
  orderCount: number;
  activeCount: number;
  totalM2: number;
  estimatedTon: number;
}) {
  const { orderCount, activeCount, totalM2, estimatedTon } = props;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Siparişler</h3>
          <p className="mt-3 text-3xl font-bold text-[#0f141a]">{orderCount.toLocaleString('tr-TR')}</p>
          <p className="mt-1 text-sm text-gray-500">Aktif (beklemede / üretimde): {activeCount.toLocaleString('tr-TR')}</p>
          <p className="mt-2 text-xs text-gray-400">
            Toplam talep ~{totalM2.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} m² · Tahmini{' '}
            {formatTonDisplayTr(estimatedTon)} t
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-primary shadow-sm">
          <span className="material-symbols-outlined text-[22px]">list_alt</span>
        </div>
      </div>
      <Link
        href="/dashboard/orders"
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        Sipariş yönetimi
        <span className="material-symbols-outlined text-base">chevron_right</span>
      </Link>
    </div>
  );
}

/** Canlı operasyon: stok ruloları özeti kartı. */
function LiveStockSummaryCard(props: { rollCount: number; totalTon: number }) {
  const { rollCount, totalTon } = props;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Stok</h3>
          <p className="mt-3 text-3xl font-bold text-[#0f141a]">{rollCount.toLocaleString('tr-TR')}</p>
          <p className="mt-1 text-sm text-gray-500">Toplam tonaj</p>
          <p className="mt-2 text-2xl font-bold text-primary">{formatTonDisplayTr(totalTon)} t</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-accent-green shadow-sm">
          <span className="material-symbols-outlined text-[22px]">inventory_2</span>
        </div>
      </div>
      <Link
        href="/dashboard/stocks"
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        Stok yönetimi
        <span className="material-symbols-outlined text-base">chevron_right</span>
      </Link>
    </div>
  );
}

/** Son çalıştırmada toplam maliyet kartı; fire / stok / kurulum TL kırılımını gösterir. */
function LatestRunCostCard(props: {
  totalCost: number;
  hasRun: boolean;
  costFire: number;
  costStock: number;
  costStockProduction: number;
  costStockShelf: number;
  costSetup: number;
  costSequence: number;
}) {
  const {
    totalCost,
    hasRun,
    costFire,
    costStock,
    costStockProduction,
    costStockShelf,
    costSetup,
    costSequence,
  } = props;
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md lg:col-span-1">
      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-primary">
            <span className="material-symbols-outlined text-[18px]">attach_money</span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Son çalıştırma · toplam maliyet</h3>
        </div>
        <div className="mt-4">
          <span className="block text-4xl font-bold tracking-tight text-primary lg:text-5xl">
            {hasRun ? `₺${formatTL(totalCost)}` : '—'}
          </span>
          <p className="mt-1 text-sm font-medium text-gray-400">
            cf × fire + h × (üretim stoku + elde) + kurulum (+ sıra cezası)
          </p>
          {hasRun ? (
            <ul className="mt-3 space-y-1 text-xs text-gray-600">
              <li className="flex justify-between gap-2">
                <span>Fire maliyeti</span>
                <span className="font-semibold tabular-nums">₺{formatTL(costFire)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Stok tutma — üretim stoku</span>
                <span className="font-semibold tabular-nums">₺{formatTL(costStockProduction)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Stok tutma — rafta elde</span>
                <span className="font-semibold tabular-nums">₺{formatTL(costStockShelf)}</span>
              </li>
              <li className="flex justify-between gap-2 text-gray-500">
                <span>Stok tutma toplamı</span>
                <span className="font-semibold tabular-nums">₺{formatTL(costStock)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Rulo açılış (kurulum)</span>
                <span className="font-semibold tabular-nums">₺{formatTL(costSetup)}</span>
              </li>
              {costSequence > 0 ? (
                <li className="flex justify-between gap-2">
                  <span>Sıra cezası</span>
                  <span className="font-semibold tabular-nums">₺{formatTL(costSequence)}</span>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-none absolute -right-4 -top-4 text-primary opacity-[0.03]">
        <span className="material-symbols-outlined text-[180px]">paid</span>
      </div>
    </div>
  );
}

/** Son çalıştırmadaki toplam fire tonajı kartı. */
function LatestRunFireCard(props: { tons: number; hasRun: boolean }) {
  const { tons, hasRun } = props;
  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-6 flex items-start justify-between">
        <h3 className="text-lg font-bold text-primary">Toplam fire</h3>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-accent-orange shadow-sm">
          <span className="material-symbols-outlined text-[22px]">delete_outline</span>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            {hasRun ? formatTonDisplayTr(tons) : '—'}
          </span>
          {hasRun ? <span className="text-sm font-medium text-gray-500">t</span> : null}
        </div>
        <p className="mt-2 text-xs text-gray-400">Son kayıtlı optimizasyon çıktısı</p>
      </div>
    </div>
  );
}

/** Son çalıştırmadaki stok tonajı kartı (çözüm özeti). */
function LatestRunStockCard(props: { tons: number; hasRun: boolean }) {
  const { tons, hasRun } = props;
  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-6 flex items-start justify-between">
        <h3 className="text-lg font-bold text-primary">Çözüm stoğu</h3>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-accent-green shadow-sm">
          <span className="material-symbols-outlined text-[22px]">inventory_2</span>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            {hasRun ? formatTonDisplayTr(tons) : '—'}
          </span>
          {hasRun ? <span className="text-sm font-medium text-gray-500">t</span> : null}
        </div>
        <p className="mt-2 text-xs text-gray-400">Optimizasyon sonrası özet stok</p>
      </div>
    </div>
  );
}

/** Son çalıştırmada açılan rulo sayısı kartı. */
function LatestRunRollsCard(props: { opened: number; hasRun: boolean }) {
  const { opened, hasRun } = props;
  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-lg font-bold text-primary">Açılan rulolar</h3>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-primary shadow-sm">
          <span className="material-symbols-outlined text-[22px]">album</span>
        </div>
      </div>
      <div className="mt-auto">
        <span className="mb-1 block text-4xl font-bold text-primary">{hasRun ? opened.toLocaleString('tr-TR') : '—'}</span>
        <p className="text-sm text-gray-400">Son çalıştırma</p>
      </div>
    </div>
  );
}

/** Son çalıştırmanın durumunu ve detay bağlantısını gösteren geniş kart. */
function LatestRunMetaCard(props: { run: RunSummary | null; fileId: string | null }) {
  const { run, fileId } = props;
  if (!run || !fileId) {
    return (
      <div className="flex flex-col justify-between rounded-xl border border-dashed border-gray-200 bg-slate-50/80 p-6 shadow-sm md:col-span-2 lg:col-span-2">
        <h3 className="text-lg font-bold text-primary">Henüz kayıtlı optimizasyon yok</h3>
        <p className="mt-2 max-w-xl text-sm text-gray-600">
          Sipariş ve stok verilerinizi girdikten sonra optimizasyon çalıştırdığınızda özet metrikler burada görünür.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/configuration"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-dark"
          >
            Optimizasyona git
          </Link>
          <Link
            href="/dashboard/sonuc"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Geçmiş sonuçlar
          </Link>
        </div>
      </div>
    );
  }
  const label = getRunStatusLabelTr(run);
  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md md:col-span-2 lg:col-span-2">
      <div>
        <h3 className="text-lg font-bold text-primary">Son çalıştırma durumu</h3>
        <p className="mt-1 text-sm text-gray-500">{formatRunDate(run.created_at)}</p>
        {run.description ? <p className="mt-2 text-sm text-gray-700">{run.description}</p> : null}
        <p className="mt-4">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{label}</span>
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/sonuc/${fileId}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-dark"
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          Detayı aç
        </Link>
        <Link
          href="/dashboard/sonuc"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Tüm sonuçlar
        </Link>
      </div>
    </div>
  );
}

/** Hızlı erişim: analiz ve sabit işlem linkleri. */
function QuickNavGrid() {
  const items = [
    {
      href: '/dashboard/configuration',
      title: 'Yeni optimizasyon',
      desc: 'Maliyet, sipariş ve rulo ayarlarıyla çalıştır.',
      icon: 'tune' as const,
    },
    {
      href: '/dashboard/configuration/manual',
      title: 'Analiz ve test',
      desc: 'Manuel senaryolar ve doğrulama.',
      icon: 'science' as const,
    },
    {
      href: '/dashboard/kesim-karsilastirma',
      title: 'Kesim karşılaştırması',
      desc: 'Senaryoları yan yana inceleyin.',
      icon: 'compare' as const,
    },
  ];
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-primary transition-colors group-hover:bg-primary/10">
              <span className="material-symbols-outlined">{item.icon}</span>
            </span>
            <span className="font-bold text-[#0f141a]">{item.title}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Git
            <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">
              arrow_forward
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/**
 * Ana dashboard: sipariş, stok ve son optimizasyon verilerini API'den yükler; özet KPI ve yönlendirmeleri gösterir.
 */
export function DashboardHomeView() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rolls, setRolls] = useState<StockRoll[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [ordRes, stockRes, runRes] = await Promise.all([
        getOrders(),
        getStockRolls(),
        getRuns(40, 0),
      ]);
      setOrders(ordRes.orders || []);
      setRolls(stockRes.stockRolls || []);
      setRuns(sortRunsByDateDesc(runRes.runs || []));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Veriler yüklenemedi';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const latestRun = runs[0] ?? null;
  const latestFileId = latestRun?.file_id ?? null;

  const activeOrderCount = useMemo(
    () => orders.filter((o) => o.status === 'Pending' || o.status === 'In Production').length,
    [orders],
  );
  const totalM2 = useMemo(() => orders.reduce((s, o) => s + Number(o.m2 || 0), 0), [orders]);
  const estimatedTon = useMemo(
    () =>
      sumOrdersEstimatedDemandTon(
        orders,
        DEFAULT_ORDER_TABLE_MATERIAL.thicknessMm,
        DEFAULT_ORDER_TABLE_MATERIAL.densityKgM3,
      ),
    [orders],
  );
  const stockTotalTon = useMemo(() => rolls.reduce((s, r) => s + Number(r.tonnage), 0), [rolls]);

  const headerDescription = useMemo(() => {
    if (latestRun) {
      const when = formatRunDate(latestRun.created_at);
      const name = latestRun.description?.trim() || latestRun.file_id;
      return `Son optimizasyon: ${name} (${when}). Aşağıda canlı sipariş/stok ile bu çalıştırmanın özet metrikleri yer alıyor.`;
    }
    return 'Kayıtlı optimizasyon çalıştırması yok; sipariş ve stok özetleri canlı veritabanından geliyor. Başlamak için optimizasyon sayfasına gidebilirsiniz.';
  }, [latestRun]);

  const cost = latestRun ? getRunSummaryTotalCost(latestRun) : 0;
  const fire = latestRun ? getRunSummaryTotalFire(latestRun) : 0;
  const stockSummary = latestRun ? getRunSummaryTotalStock(latestRun) : 0;
  const opened = latestRun ? getRunSummaryOpenedRolls(latestRun) : 0;
  const costFire = latestRun ? getRunSummaryCostFireLira(latestRun) : 0;
  const costStock = latestRun ? getRunSummaryCostStockLira(latestRun) : 0;
  const costStockProduction = latestRun ? getRunSummaryCostStockProductionLira(latestRun) : 0;
  const costStockShelf = latestRun ? getRunSummaryCostStockShelfLira(latestRun) : 0;
  const costSetup = latestRun ? getRunSummaryCostSetupLira(latestRun) : 0;
  const costSequence = latestRun ? getRunSummaryCostSequencePenaltyLira(latestRun) : 0;
  const hasRun = latestRun != null;

  const exportHref = latestFileId ? getReportDownloadUrl(latestFileId) : null;

  return (
    <div className="flex-1 bg-background-light px-4 py-8 md:py-12">
      <DashboardOverviewHeader
        description={headerDescription}
        exportHref={exportHref}
        loading={loading}
      />

      {loadError ? (
        <div className="container mx-auto mb-8 max-w-[1100px] rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {loadError}
          <button
            type="button"
            onClick={() => loadAll()}
            className="ml-3 font-semibold underline"
          >
            Tekrar dene
          </button>
        </div>
      ) : null}

      <div className="container mx-auto max-w-[1100px] space-y-10">
        <section aria-label="Canlı sipariş ve stok özeti">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Canlı veriler</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <LiveOrdersSummaryCard
              orderCount={orders.length}
              activeCount={activeOrderCount}
              totalM2={totalM2}
              estimatedTon={estimatedTon}
            />
            <LiveStockSummaryCard rollCount={rolls.length} totalTon={stockTotalTon} />
          </div>
        </section>

        <section aria-label="Son optimizasyon özeti">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Son optimizasyon özeti</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <LatestRunCostCard
              totalCost={cost}
              hasRun={hasRun}
              costFire={costFire}
              costStock={costStock}
              costStockProduction={costStockProduction}
              costStockShelf={costStockShelf}
              costSetup={costSetup}
              costSequence={costSequence}
            />
            <LatestRunFireCard tons={fire} hasRun={hasRun} />
            <LatestRunStockCard tons={stockSummary} hasRun={hasRun} />
            <LatestRunRollsCard opened={opened} hasRun={hasRun} />
            <LatestRunMetaCard run={latestRun} fileId={latestFileId} />
          </div>
        </section>

        <section aria-label="Hızlı yönlendirme">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Hızlı yönlendirme</h2>
          <QuickNavGrid />
        </section>
      </div>
    </div>
  );
}
