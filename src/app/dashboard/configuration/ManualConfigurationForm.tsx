'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  MaterialPropertiesCard,
  ScenarioSelectionCard,
  RollSettingsCard,
  CostParametersCard,
  OrdersSummaryCard,
  OrdersSelectDropdown,
  DashboardFooterCta,
  ConfigurationSummaryCard,
} from '@/components';
import { StickySummaryAside } from './StickySummaryAside';
import {
  optimize,
  getConfigurationById,
  getRun,
  getOrders,
  ROLL_ORDER_UNLIMITED,
  type SyncLevel,
  type OptimizeRequest,
  type Order,
} from '@/lib/api';
import { useOptimization } from '@/contexts/OptimizationContext';

/** Başlangıçta boş veya tek örnek sipariş - kullanıcı ekleyecek (manuel test modu). */
const INITIAL_ORDERS = [
  { id: 'S1', m2: 1000, panelWidth: 1.0, panelLength: 1 },
];

/** Tahmini ihtiyaç ve backend ile aynı: talep çarpanı 2 (çift yüzey). */
const OPTIMIZATION_SURFACE_FACTOR = 2;

/** Verilen süre kadar (ms) bekleme yapan yardımcı fonksiyon (manuel sayfa için). */
function waitMs(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

/**
 * Tahmini tonaj ihtiyacini panel adet yuvarlamasi ve yuzey carpaniyla hesaplar.
 */
function estimateNeedTon(
  orders: { m2: number; panelWidth: number; panelLength?: number }[],
  thicknessMm: number,
  densityKgM3: number,
  safetyStockPercent: number,
  surfaceFactor: number,
): number {
  const densityGcm3 = densityKgM3 / 1000;
  const baseTon = orders.reduce((sum, order) => {
    const pw = order.panelWidth;
    const pl = order.panelLength ?? 1;
    if (pw <= 0 || pl <= 0 || order.m2 <= 0) return sum;
    const panelCount = Math.max(1, Math.round(order.m2 / (pw * pl)));
    const effectiveM2 = panelCount * pw * pl * Math.max(1, surfaceFactor);
    return sum + effectiveM2 * (thicknessMm / 1000) * densityGcm3;
  }, 0);
  return baseTon * (1 + safetyStockPercent / 100);
}

/**
 * Manuel analiz/test konfigürasyon formu:
 * Hazır stok/sipariş setleri olmadan, tamamen manuel girişle optimizasyon çalıştırır.
 */
export function ManualConfigurationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLastResult, setLoading, setError, isLoading } = useOptimization();

  const [thickness, setThickness] = useState(0.75);
  const [density, setDensity] = useState(7850);
  /** Güvenlik stoğu % — varsayılan 0. */
  const [safetyStock, setSafetyStock] = useState(0);
  /** Varsayılan yok — kullanıcı sayı girmeli veya "Sonsuz" seçmeli. */
  const [maxOrdersPerRoll, setMaxOrdersPerRoll] = useState<number | undefined>(undefined);
  const [maxRollsPerOrder, setMaxRollsPerOrder] = useState<number | undefined>(undefined);
  const [rolls, setRolls] = useState<number[]>([10, 10, 10]);
  const [fireCost, setFireCost] = useState(450);
  const [setupCost, setSetupCost] = useState(120);
  const [stockCost, setStockCost] = useState(2.5);
  const [orders, setOrders] = useState<{ id: string; m2: number; panelWidth: number; panelLength?: number }[]>(INITIAL_ORDERS);
  const [maxInterleavingOrders, setMaxInterleavingOrders] = useState<number>(2);
  const [interleavingPenaltyCost, setInterleavingPenaltyCost] = useState<number>(60);

  const densityGcm3 = density / 1000;
  const estimatedNeedTon = estimateNeedTon(orders, thickness, density, safetyStock, OPTIMIZATION_SURFACE_FACTOR);
  const [configurationId, setConfigurationId] = useState<string | null>(null);
  const [runDescription, setRunDescription] = useState('');
  const [selectedSyncLevels, setSelectedSyncLevels] = useState<SyncLevel[]>([]);
  const [isLoadingConfiguration, setIsLoadingConfiguration] = useState(false);
  /** Bekleyen siparişler — modalda seçilip tabloya eklenebilir */
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);

  /**
   * Dashboard sipariş listesindeki Pending kayıtları yükler (veritabanından ekle modalı için).
   */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getOrders('Pending');
        if (!cancelled) setAvailableOrders(res.orders || []);
      } catch {
        if (!cancelled) setAvailableOrders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Formdan geçerli sipariş satırlarını üretir (manuel sayfa).
   */
  const getValidOrders = useCallback(() => {
    return orders.filter((o) => o.m2 > 0 && o.panelWidth > 0 && (o.panelLength ?? 1) > 0);
  }, [orders]);

  /**
   * Form alanlarından optimize isteği payload'ını oluşturur (manuel sayfa).
   */
  const buildOptimizeRequest = useCallback(
    (validOrders: { id: string; m2: number; panelWidth: number; panelLength?: number }[]): OptimizeRequest => {
      return {
        material: { thickness, density: densityGcm3 },
        safetyStock,
        maxInterleavingOrders: Math.max(0, maxInterleavingOrders),
        interleavingPenaltyCost: Math.max(0, interleavingPenaltyCost),
        configurationId: configurationId ?? undefined,
        orders: validOrders.map((o) => ({ m2: o.m2, panelWidth: o.panelWidth, panelLength: o.panelLength ?? 1 })),
        rollSettings: {
          rolls: rolls.filter((r) => r > 0),
          maxOrdersPerRoll: maxOrdersPerRoll as number,
          maxRollsPerOrder: maxRollsPerOrder as number,
        },
        costs: {
          fireCost,
          setupCost,
          stockCost,
        },
        description: runDescription?.trim() || undefined,
        syncLevels: selectedSyncLevels,
      };
    },
    [
      thickness,
      densityGcm3,
      safetyStock,
      maxInterleavingOrders,
      interleavingPenaltyCost,
      configurationId,
      rolls,
      maxOrdersPerRoll,
      maxRollsPerOrder,
      fireCost,
      setupCost,
      stockCost,
      runDescription,
      selectedSyncLevels,
    ],
  );

  /**
   * Query param runId ile sonuç sayfasından gelindiyse, o çalıştırmanın inputData'sı ile formu doldurur (manuel analiz).
   * Veriler mevcut sipariş/stokla uyumlu olmayabilir; kullanıcı manuel sayfada düzenleyip çalıştırır.
   */
  useEffect(() => {
    const runId = searchParams.get('runId');
    if (!runId) return;

    const loadFromRun = async () => {
      try {
        setIsLoadingConfiguration(true);
        const run = await getRun(runId);
        const input = run.inputData;
        if (!input) {
          toast.error('Bu çalıştırmanın giriş verisi bulunamadı.');
          return;
        }
        const mat = input.material || {};
        setThickness(Number(mat.thickness) || 0.75);
        const d = Number(mat.density);
        setDensity(d > 100 ? d : (d || 7.85) * 1000);
        setSafetyStock(Number(input.safetyStock) || 0);
        setMaxInterleavingOrders(Math.max(0, Number(input.maxInterleavingOrders ?? 2)));
        setInterleavingPenaltyCost(Math.max(0, Number(input.interleavingPenaltyCost ?? 60)));
        const rs = input.rollSettings || {};
        setMaxOrdersPerRoll(Number(rs.maxOrdersPerRoll) ?? undefined);
        setMaxRollsPerOrder(Number(rs.maxRollsPerOrder) ?? undefined);
        setRolls(
          Array.isArray(rs.rolls) && rs.rolls.length > 0
            ? rs.rolls.map((r) => Number(r)).filter((r) => r > 0)
            : [10, 10, 10],
        );
        const c = input.costs || {};
        setFireCost(Number(c.fireCost) || 450);
        setSetupCost(Number(c.setupCost) || 120);
        setStockCost(Number(c.stockCost) ?? 2.5);
        const orderList = input.orders || [];
        const restoredOrders = orderList.map((o, idx) => ({
          id: `S${idx + 1}`,
          m2: Number(o.m2),
          panelWidth: Number(o.panelWidth),
          panelLength: Number((o as { panelLength?: number }).panelLength ?? 1),
        }));
        setOrders(restoredOrders.length > 0 ? restoredOrders : INITIAL_ORDERS);
        if (run.configurationId) setConfigurationId(run.configurationId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Çalıştırma verisi yüklenemedi';
        toast.error(msg);
      } finally {
        setIsLoadingConfiguration(false);
      }
    };

    loadFromRun();
  }, [searchParams]);

  /**
   * Query param'dan gelen configurationId ile kayıtlı konfigürasyonu forma yükler (runId yoksa).
   */
  useEffect(() => {
    const runId = searchParams.get('runId');
    const qConfigurationId = searchParams.get('configurationId');
    if (runId || !qConfigurationId) return;

    const loadConfiguration = async () => {
      try {
        setIsLoadingConfiguration(true);
        const cfg = await getConfigurationById(qConfigurationId);
        setConfigurationId(cfg.id);
        setThickness(Number(cfg.material_thickness) || 0.75);
        const densityValue = Number(cfg.material_density) || 7.85;
        setDensity(densityValue > 100 ? densityValue : densityValue * 1000);
        setSafetyStock(Number(cfg.safety_stock) || 0);
        setMaxInterleavingOrders(
          Math.max(0, Number((cfg as { max_interleaving_orders?: number }).max_interleaving_orders ?? 2)),
        );
        setInterleavingPenaltyCost(
          Math.max(0, Number((cfg as { interleaving_penalty_cost?: number }).interleaving_penalty_cost ?? 60)),
        );
        setMaxOrdersPerRoll(Number(cfg.max_orders_per_roll) || 1);
        setMaxRollsPerOrder(Number(cfg.max_rolls_per_order) || 1);
        setFireCost(Number(cfg.fire_cost) || 0);
        setSetupCost(Number(cfg.setup_cost) || 0);
        setStockCost(Number(cfg.stock_cost) || 0);
        setRolls(
          Array.isArray(cfg.rolls)
            ? cfg.rolls.map((r) => Number(r)).filter((r) => r > 0)
            : [10, 10, 10],
        );
        const restoredOrders = Array.isArray(cfg.orders)
          ? cfg.orders
              .map((o, idx) => ({
                id: `S${idx + 1}`,
                m2: Number(o.m2),
                panelWidth: Number(o.panelWidth),
                panelLength: Number((o as { panelLength?: number }).panelLength ?? 1),
              }))
              .filter((o) => o.m2 > 0 && o.panelWidth > 0 && (o.panelLength ?? 1) > 0)
          : [];
        setOrders(restoredOrders.length > 0 ? restoredOrders : INITIAL_ORDERS);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Konfigürasyon yüklenemedi';
        toast.error(msg);
      } finally {
        setIsLoadingConfiguration(false);
      }
    };

    loadConfiguration();
  }, [searchParams]);

  /** İlgili bölümü görünür yapmak için yumuşak kaydırma yapar. */
  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /**
   * Manuel analiz/test modunda optimizasyonu tetikler.
   */
  const handleSubmit = useCallback(async () => {
    if (!runDescription?.trim()) {
      toast.error('Açıklama alanı zorunludur. Sonuçlar tablosunda görünecek kısa bir açıklama yazın.');
      scrollToSection('description');
      return;
    }
    if (orders.length === 0) {
      toast.error('En az bir sipariş ekleyin.');
      scrollToSection('orders');
      return;
    }
    const validOrders = getValidOrders();
    if (validOrders.length === 0) {
      toast.error('Geçerli sipariş bulunamadı. m², panel genişliği ve kesim uzunluğu 0\'dan büyük olmalıdır.');
      scrollToSection('orders');
      return;
    }
    const maxOrdersValid = maxOrdersPerRoll != null && (maxOrdersPerRoll === ROLL_ORDER_UNLIMITED || maxOrdersPerRoll > 0);
    if (!maxOrdersValid) {
      toast.error('"1 ruloda maksimum kaç farklı sipariş?" alanı zorunludur. Bir sayı girin veya Sonsuz seçin.');
      scrollToSection('scenario');
      return;
    }
    const maxRollsValid = maxRollsPerOrder != null && (maxRollsPerOrder === ROLL_ORDER_UNLIMITED || maxRollsPerOrder > 0);
    if (!maxRollsValid) {
      toast.error('"1 sipariş için maksimum kaç rulo?" alanı zorunludur. Bir sayı girin veya Sonsuz seçin.');
      scrollToSection('scenario');
      return;
    }
    if (maxRollsPerOrder !== ROLL_ORDER_UNLIMITED && (maxRollsPerOrder ?? 0) < 2) {
      toast.error('Çift yüzey senaryosunda "1 sipariş için maksimum kaç rulo?" en az 2 olmalıdır (veya Sonsuz).');
      scrollToSection('scenario');
      return;
    }
    if (selectedSyncLevels.length === 0) {
      toast.error('En az bir senkron seviyesi seçmelisiniz.');
      scrollToSection('scenario');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const request = buildOptimizeRequest(validOrders);
      const minDelayMs = 3000;
      const maxDelayMs = 5000;
      const startTime = performance.now();
      const result = await optimize(request);
      const targetTotal =
        minDelayMs + Math.random() * (Math.max(maxDelayMs, minDelayMs) - minDelayMs);
      const elapsed = performance.now() - startTime;
      const remaining = targetTotal - elapsed;
      if (remaining > 0) {
        await waitMs(remaining);
      }
      setLastResult({ ...result, inputData: request });
      router.push(`/dashboard/sonuc/${result.fileId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Optimizasyon hatası';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    orders,
    getValidOrders,
    buildOptimizeRequest,
    setLastResult,
    setLoading,
    setError,
    router,
    maxOrdersPerRoll,
    maxRollsPerOrder,
    selectedSyncLevels,
    scrollToSection,
    runDescription,
  ]);

  const totalDemandM2 = orders.reduce((sum, o) => sum + (o.m2 || 0), 0);

  /** Üst adım çubuğu: Açıklama → Siparişler → Senaryo → Maliyet → Rulo. Tıklanınca ilgili bölüme kayar. */
  const CONFIG_STEPS = [
    { id: 'description', label: 'Açıklama', icon: 'notes' as const },
    { id: 'orders', label: 'Siparişler', icon: 'list_alt' as const },
    { id: 'scenario', label: 'Senaryo Seçimi', icon: 'tune' as const },
    { id: 'cost', label: 'Maliyet Parametreleri', icon: 'payments' as const },
    { id: 'rolls', label: 'Rulo Stoğu', icon: 'inventory_2' as const },
  ] as const;

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xl px-10 py-8 flex flex-col items-center gap-4 ring-1 ring-slate-200 dark:ring-slate-800">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 animate-pulse">
              Manuel analiz çalıştırılıyor...
            </p>
            <p className="text-sm text-slate-500">Bu işlem zaman alabilir, lütfen bekleyiniz.</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Manuel Analiz &amp; Test
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Önce rapor adı ve siparişleri, ardından senaryo, maliyet ve rulo stoğunu yapılandırın.
        </p>
      </div>

      {/* Sticky adım çubuğu: aşağı kaydırınca üstte sabit kalır, bölümler arası geçiş her zaman erişilebilir. */}
      <div className="sticky top-0 z-20 min-h-[5rem] -mx-4 px-4 lg:-mx-8 lg:px-8 py-2 mb-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max">
            {CONFIG_STEPS.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => scrollToSection(step.id)}
                className={`flex flex-col items-center gap-2 border-b-2 px-4 sm:px-6 pb-3 pt-2 transition-colors shrink-0 ${
                  idx === 0
                    ? 'border-primary text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{step.icon}</span>
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap">{step.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex-1 flex flex-col gap-6">
          {/* <section
            id="section-material"
            className="scroll-mt-[5.5rem]"
            aria-labelledby="heading-material"
          >
            <h2 id="heading-material" className="sr-only">Malzeme Özellikleri</h2>
            <MaterialPropertiesCard
              thickness={thickness}
              onThicknessChange={setThickness}
              density={density}
              onDensityChange={setDensity}
            />
          </section> */}

          <section
            id="section-description"
            className="scroll-mt-[5.5rem]"
            aria-labelledby="heading-description"
          >
            <h2 id="heading-description" className="sr-only">Rapor Adı</h2>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-primary">Rapor Adı</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bu çalıştırma sonuçlar tablosunda bu açıklama ile listelenecektir. (Zorunlu)
                </p>
              </div>
              <div className="p-6">
                <input
                  id="manual-run-description"
                  type="text"
                  value={runDescription}
                  onChange={(e) => setRunDescription(e.target.value)}
                  placeholder="Örn: Mart ayı ana senaryo, 3 rulo test"
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  aria-required="true"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  {runDescription.length}/500 karakter
                </p>
              </div>
            </div>
          </section>

          <section
            id="section-orders"
            className="scroll-mt-[5.5rem]"
            aria-labelledby="heading-orders"
          >
            <h2 id="heading-orders" className="sr-only">Siparişler</h2>
            <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/5 bg-slate-50/70 px-6 py-4 dark:bg-slate-800/50">
                <div>
                  <h2 className="text-lg font-bold text-primary">Siparişler</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Satırları düzenleyin veya bekleyen siparişleri detaylı listeden seçip tabloya ekleyin.
                  </p>
                </div>
                <OrdersSelectDropdown
                  orders={availableOrders}
                  selectedIds={new Set()}
                  onSelectionChange={() => {}}
                  appendMode
                  existingOrderIds={new Set(orders.map((o) => o.id))}
                  onAppendOrders={(rows) => {
                    setOrders((prev) => [...prev, ...rows]);
                  }}
                  label="Veritabanından ekle"
                />
              </div>
              <OrdersSummaryCard
                orders={orders}
                onOrdersChange={setOrders}
                thickness={thickness}
                density={density}
                hideHeader
              />
            </div>
          </section>

          <section
            id="section-scenario"
            className="scroll-mt-[5.5rem]"
            aria-labelledby="heading-scenario"
          >
            <h2 id="heading-scenario" className="sr-only">Senaryo Seçimi</h2>
            <div className="mb-3 rounded-lg border border-indigo-100 bg-indigo-50/80 px-3 py-2">
              <p className="text-xs text-indigo-800 leading-relaxed">
                Buradan seçtiğiniz modlar çalıştırılır. Tek modda tek sonuç, çoklu modda kısa karşılaştırma ve CSV özet
                sunulur. Eşzamanlı modda üst/alt rulo değişimi sert kuraldır.
              </p>
            </div>
            <ScenarioSelectionCard
              maxOrdersPerRoll={maxOrdersPerRoll}
              onMaxOrdersPerRollChange={setMaxOrdersPerRoll}
              maxRollsPerOrder={maxRollsPerOrder}
              onMaxRollsPerOrderChange={setMaxRollsPerOrder}
              selectedSyncLevels={selectedSyncLevels}
              onSelectedSyncLevelsChange={setSelectedSyncLevels}
              hasSyncSelectionError={selectedSyncLevels.length === 0}
            />
          </section>

          <section
            id="section-cost"
            className="scroll-mt-[5.5rem]"
            aria-labelledby="heading-cost"
          >
            <h2 id="heading-cost" className="sr-only">Maliyet Parametreleri</h2>
            <CostParametersCard
              fireCost={fireCost}
              onFireCostChange={setFireCost}
              setupCost={setupCost}
              onSetupCostChange={setSetupCost}
              stockCost={stockCost}
              onStockCostChange={setStockCost}
            />
          </section>

          <section
            id="section-rolls"
            className="scroll-mt-[5.5rem]"
            aria-labelledby="heading-rolls"
          >
            <h2 id="heading-rolls" className="sr-only">Rulo Stoğu</h2>
            <RollSettingsCard
              rolls={rolls}
              onRollsChange={setRolls}
              maxInterleavingOrders={maxInterleavingOrders}
              onMaxInterleavingOrdersChange={setMaxInterleavingOrders}
              interleavingPenaltyCost={interleavingPenaltyCost}
              onInterleavingPenaltyCostChange={setInterleavingPenaltyCost}
              estimatedNeedTon={estimatedNeedTon}
            />
          </section>
        </div>

        <StickySummaryAside>
          <ConfigurationSummaryCard
            thickness={thickness}
            density={density}
            rollsCount={rolls.length}
            totalDemandM2={totalDemandM2}
            safetyStock={safetyStock}
            maxOrdersPerRoll={maxOrdersPerRoll}
            maxRollsPerOrder={maxRollsPerOrder}
          >
            <DashboardFooterCta onSubmit={handleSubmit} isLoading={isLoading} />
          </ConfigurationSummaryCard>
          <div className="rounded-xl bg-primary/5 dark:bg-primary/10 p-4 ring-1 ring-primary/10 dark:ring-primary/20">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0">info</span>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Yüksek güvenlik stoğu malzeme kullanımını artırır ancak riski azaltır. Rulo ve sipariş limitlerini &quot;Sonsuz&quot; yaparak sınır koymadan analiz edebilirsiniz.
              </p>
            </div>
          </div>
        </StickySummaryAside>
      </div>

      {isLoadingConfiguration && (
        <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          Kayıtlı konfigürasyon yükleniyor...
        </div>
      )}
    </>
  );
}

