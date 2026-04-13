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
  getOrders,
  getStockRolls,
  getConfigurationById,
  ROLL_ORDER_UNLIMITED,
  type Order,
  type OptimizeRequest,
} from '@/lib/api';
import { useOptimization } from '@/contexts/OptimizationContext';

/** Başlangıçta sipariş listesi boş - kullanıcı ekleyecek */
const INITIAL_ORDERS: { id: string; m2: number; panelWidth: number; panelLength?: number }[] = [];

/** Tahmini ihtiyaç ve backend ile aynı: sipariş m² tek yüzey, talep çarpanı 2. */
const OPTIMIZATION_SURFACE_FACTOR = 2;

/** Malzeme alanı kapalıyken tahmini ton ve API `material` ile aynı varsayılanlar. */
const DEFAULT_MATERIAL_THICKNESS_MM = 0.75;
const DEFAULT_MATERIAL_DENSITY_KG_M3 = 7850;

/** Yükleme sırasında gösterilen aşamalı durum mesajları. */
const LOADING_STEPS = ['Analiz ediliyor...', 'Hesaplanıyor...', 'Sonuçlar getiriliyor...'] as const;

/** Verilen süre kadar (ms) bekleme yapan yardımcı fonksiyon. */
function waitMs(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

/**
 * Tahmini ihtiyacı backend'e yakın mantıkla hesaplar: panel adet yuvarlaması + yuzey carpani + guvenlik stogu.
 */
function estimateNeedTon(
  orders: { m2: number; panelWidth: number; panelLength?: number }[],
  thicknessMm: number | undefined,
  densityKgM3: number | undefined,
  safetyStockPercent: number,
  surfaceFactor: number,
): number {
  if (!thicknessMm || !densityKgM3) return 0;
  const densityGcm3 = densityKgM3 / 1000;
  const baseTon = orders.reduce((sum, order) => {
    const pw = order.panelWidth;
    const pl = order.panelLength ?? 1;
    if (pw <= 0 || pl <= 0 || order.m2 <= 0) return sum;
    const panelCount = Math.max(1, Math.round(order.m2 / (pw * pl)));
    const effectiveM2 = panelCount * pw * pl * Math.max(1, surfaceFactor);
    return sum + effectiveM2 * (thicknessMm / 1000) * densityGcm3;
  }, 0);
  return baseTon * (1 + (safetyStockPercent ?? 0) / 100);
}

/**
 * Konfigürasyon formu: tüm inputları toplar, API çağrısı yapar, sonucu context'e yazar.
 */
export function ConfigurationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLastResult, setLoading, setError, isLoading } = useOptimization();

  const [thickness, setThickness] = useState<number | undefined>(undefined);
  const [density, setDensity] = useState<number | undefined>(undefined);
  /** Güvenlik stoğu % — varsayılan 0; kullanıcı 0 bırakabilir veya artırabilir. */
  const [safetyStock, setSafetyStock] = useState<number>(0);
  const [maxOrdersPerRoll, setMaxOrdersPerRoll] = useState<number | undefined>(undefined);
  const [maxRollsPerOrder, setMaxRollsPerOrder] = useState<number | undefined>(undefined);
  const [rolls, setRolls] = useState<number[]>([]);
  /** Stok rulo ID'leri (rolls ile aynı sırada; manuel eklenen satırlar ''). İşleme alında stoktan düşülür. */
  const [stockRollIds, setStockRollIds] = useState<string[]>([]);
  const [fireCost, setFireCost] = useState<number | undefined>(undefined);
  const [setupCost, setSetupCost] = useState<number | undefined>(undefined);
  const [stockCost, setStockCost] = useState<number | undefined>(undefined);
  const [orders, setOrders] = useState<{ id: string; m2: number; panelWidth: number; panelLength?: number }[]>(INITIAL_ORDERS);
  const [maxInterleavingOrders, setMaxInterleavingOrders] = useState<number>(2);
  const [interleavingPenaltyCost, setInterleavingPenaltyCost] = useState<number>(60);

  const densityGcm3 = density ? density / 1000 : 0;
  const thicknessForEstimateMm =
    thickness != null && thickness > 0 ? thickness : DEFAULT_MATERIAL_THICKNESS_MM;
  const densityKgM3ForEstimate =
    density != null && density > 0 ? density : DEFAULT_MATERIAL_DENSITY_KG_M3;
  const estimatedNeedTon = estimateNeedTon(
    orders,
    thicknessForEstimateMm,
    densityKgM3ForEstimate,
    safetyStock,
    OPTIMIZATION_SURFACE_FACTOR,
  );
  const [configurationId, setConfigurationId] = useState<string | null>(null);
  const [isLoadingConfiguration, setIsLoadingConfiguration] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [availableRolls, setAvailableRolls] = useState<number[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [runDescription, setRunDescription] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  /** Seçili siparişler değiştiğinde orders state'ini günceller */
  useEffect(() => {
    const selected = availableOrders.filter((o) => selectedOrderIds.has(o.id));
    const mapped = selected.map((o) => ({
      id: o.id,
      m2: Number(o.m2),
      panelWidth: Number(o.panel_width),
      panelLength: Number(o.panel_length ?? 1),
    }));
    setOrders(mapped);
  }, [selectedOrderIds, availableOrders]);

  /** Stok ruloları yüklendiğinde rolls ve stockRollIds doldurulur (loadPresetSets içinde). availableRolls artık sadece boş başlangıç için kullanılmıyor. */

  type MissingFieldKey =
    | 'description'
    | 'thickness'
    | 'density'
    | 'maxOrdersPerRoll'
    | 'maxRollsPerOrder'
    | 'fireCost'
    | 'setupCost'
    | 'stockCost'
    | 'orders'
    | 'rolls';

  const [missingFields, setMissingFields] = useState<MissingFieldKey[]>([]);
  const [validationBlinkKey, setValidationBlinkKey] = useState(0);

  /**
   * Orders tablosundan Pending siparişleri ve stock_rolls'tan ruloları yükler.
   */
  const loadPresetSets = useCallback(async () => {
    try {
      const [ordersRes, rollsRes] = await Promise.all([getOrders('Pending'), getStockRolls()]);
      setAvailableOrders(ordersRes.orders || []);
      const stockRolls = rollsRes.stockRolls || [];
      setAvailableRolls(stockRolls.map((r) => Number(r.tonnage)));
      setRolls(stockRolls.map((r) => Number(r.tonnage)));
      setStockRollIds(stockRolls.map((r) => r.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Veriler yüklenemedi';
      toast.error(msg);
    }
  }, []);

  /**
   * Formdan geçerli sipariş satırlarını üretir. Seçili orders tablosu siparişleri + manuel eklenenler.
   */
  const getValidOrders = useCallback(() => {
    return orders.filter((o) => o.m2 > 0 && o.panelWidth > 0 && (o.panelLength ?? 1) > 0);
  }, [orders]);

  /**
   * Konfigürasyon formu için zorunlu alanları kontrol eder, eksik/uygunsuz olanları döner.
   */
  const validateRequiredFields = useCallback((): MissingFieldKey[] => {
    const missing: MissingFieldKey[] = [];

    if (!runDescription?.trim()) missing.push('description');
    // Malzeme kalınlığı ve yoğunluk opsiyonel (varsayılanlar API'de kullanılır).
    const maxOrdersValid = maxOrdersPerRoll != null && (maxOrdersPerRoll === ROLL_ORDER_UNLIMITED || maxOrdersPerRoll > 0);
    if (!maxOrdersValid) missing.push('maxOrdersPerRoll');
    const maxRollsValid = maxRollsPerOrder != null && (maxRollsPerOrder === ROLL_ORDER_UNLIMITED || maxRollsPerOrder > 0);
    if (!maxRollsValid) missing.push('maxRollsPerOrder');
    if (maxRollsPerOrder !== ROLL_ORDER_UNLIMITED && (maxRollsPerOrder ?? 0) < 2) {
      missing.push('maxRollsPerOrder');
    }
    if (!fireCost || fireCost <= 0) missing.push('fireCost');
    if (!setupCost || setupCost <= 0) missing.push('setupCost');
    if (stockCost == null) missing.push('stockCost');
    const validOrders = getValidOrders();
    if (validOrders.length === 0) missing.push('orders');
    if (rolls.length === 0 || rolls.some((r) => r <= 0)) missing.push('rolls');
    return missing;
  }, [
    maxOrdersPerRoll,
    maxRollsPerOrder,
    fireCost,
    setupCost,
    stockCost,
    orders,
    rolls,
    getValidOrders,
    runDescription,
  ]);

  /**
   * Form alanlarından optimize isteği payload'ını oluşturur.
   * orderId (UUID) işleme alındığında sipariş eşleştirmesi için gerekli.
   */
  const buildOptimizeRequest = useCallback(
    (validOrders: { id: string; m2: number; panelWidth: number; panelLength?: number }[]): OptimizeRequest => {
      return {
        material: {
          thickness: (thickness != null && thickness > 0) ? thickness : DEFAULT_MATERIAL_THICKNESS_MM,
          density:
            densityGcm3 && densityGcm3 > 0 ? densityGcm3 : DEFAULT_MATERIAL_DENSITY_KG_M3 / 1000,
        },
        safetyStock: safetyStock ?? 0,
        maxInterleavingOrders: Math.max(0, maxInterleavingOrders),
        interleavingPenaltyCost: Math.max(0, interleavingPenaltyCost),
        configurationId: configurationId ?? undefined,
        orders: validOrders.map((o) => ({
          orderId: o.id,
          m2: o.m2,
          panelWidth: o.panelWidth,
          panelLength: o.panelLength ?? 1,
        })),
        rollSettings: {
          rolls: rolls.filter((r) => r > 0),
          maxOrdersPerRoll: maxOrdersPerRoll === ROLL_ORDER_UNLIMITED ? ROLL_ORDER_UNLIMITED : (maxOrdersPerRoll ?? 0),
          maxRollsPerOrder: maxRollsPerOrder === ROLL_ORDER_UNLIMITED ? ROLL_ORDER_UNLIMITED : (maxRollsPerOrder ?? 0),
        },
        costs: {
          fireCost: fireCost ?? 0,
          setupCost: setupCost ?? 0,
          stockCost: stockCost ?? 0,
        },
        description: runDescription?.trim() || undefined,
        stockRollIds: (() => {
          const ids = rolls
            .map((tonnage, i) => (tonnage > 0 && stockRollIds[i] ? stockRollIds[i] : null))
            .filter((id): id is string => Boolean(id));
          return ids.length > 0 ? ids : undefined;
        })(),
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
      stockRollIds,
      maxOrdersPerRoll,
      maxRollsPerOrder,
      fireCost,
      setupCost,
      stockCost,
      runDescription,
    ],
  );

  /**
   * Query param'dan gelen configurationId ile kayıtlı konfigürasyonu forma yükler.
   */
  useEffect(() => {
    const qConfigurationId = searchParams.get('configurationId');
    if (!qConfigurationId) return;

    const loadConfiguration = async () => {
      try {
        setIsLoadingConfiguration(true);
        const cfg = await getConfigurationById(qConfigurationId);
        setConfigurationId(cfg.id);
        setThickness(Number(cfg.material_thickness) || undefined);
        const densityValue = Number(cfg.material_density) || 7.85;
        // Geriye dönük uyumluluk: DB'deki değer 7.85 (g/cm3) veya 7850 (kg/m3) olabilir.
        setDensity(densityValue > 100 ? densityValue : densityValue * 1000);
        setSafetyStock(Number.isNaN(Number(cfg.safety_stock)) ? 0 : Number(cfg.safety_stock));
        setMaxInterleavingOrders(
          Math.max(0, Number((cfg as { max_interleaving_orders?: number }).max_interleaving_orders ?? 2)),
        );
        setInterleavingPenaltyCost(
          Math.max(0, Number((cfg as { interleaving_penalty_cost?: number }).interleaving_penalty_cost ?? 60)),
        );
        setMaxOrdersPerRoll(Number(cfg.max_orders_per_roll) || undefined);
        setMaxRollsPerOrder(Number(cfg.max_rolls_per_order) || undefined);
        setFireCost(Number(cfg.fire_cost) || undefined);
        setSetupCost(Number(cfg.setup_cost) || undefined);
        setStockCost(Number(cfg.stock_cost));
        const cfgRolls = Array.isArray(cfg.rolls)
          ? cfg.rolls.map((r) => Number(r)).filter((r) => r > 0)
          : [];
        setRolls(cfgRolls);
        setStockRollIds(cfgRolls.map(() => ''));
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

  useEffect(() => {
    loadPresetSets();
  }, [loadPresetSets]);

  /**
   * Optimizasyon devam ederken kullanıcıya aşamalı durum mesajları gösterir.
   */
  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }

    const durations = [3000, 4000, 3000];
    let currentIndex = 0;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      setLoadingStep(currentIndex);
      const isLastStep = currentIndex >= LOADING_STEPS.length - 1;
      if (isLastStep) {
        return;
      }
      timeoutId = setTimeout(() => {
        currentIndex += 1;
        tick();
      }, durations[currentIndex % durations.length]);
    };

    tick();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  /** Eksik alan anahtarından ilgili bölüm id'sine eşleme (kaydırma için). */
  const missingFieldToSectionId: Record<MissingFieldKey, string> = {
    description: 'description',
    thickness: 'material',
    density: 'material',
    maxOrdersPerRoll: 'scenario',
    maxRollsPerOrder: 'scenario',
    fireCost: 'cost',
    setupCost: 'cost',
    stockCost: 'cost',
    rolls: 'rolls',
    orders: 'orders',
  };

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleSubmit = useCallback(async () => {
    const missing = validateRequiredFields();
    if (missing.length > 0) {
      setMissingFields(missing);
      setValidationBlinkKey((prev) => prev + 1);

      const first = missing[0];
      const messageMap: Partial<Record<MissingFieldKey, string>> = {
        description: 'Açıklama alanı zorunludur. Sonuçlar tablosunda görünecek kısa bir açıklama yazın.',
        thickness: 'Malzeme kalınlığını girmeyi unuttunuz.',
        density: 'Malzeme yoğunluğunu girmeyi unuttunuz.',
        maxOrdersPerRoll: 'Bir rulodaki maksimum sipariş sayısını girmelisiniz.',
        maxRollsPerOrder: 'Bir sipariş için maksimum rulo sayısını girmelisiniz.',
        fireCost: 'Fire maliyeti (cf) alanını doldurun.',
        setupCost: 'Rulo açılış maliyeti (A) alanını doldurun.',
        stockCost: 'Elde tutma maliyeti (h) alanını doldurun.',
        orders: 'En az bir geçerli sipariş girmelisiniz.',
        rolls: 'En az bir rulo tanımlamalısınız.',
      };

      toast.error(messageMap[first ?? 'orders'] ?? 'Şu noktaları doldurmayı unuttunuz.');
      const sectionId = first ? missingFieldToSectionId[first] : 'material';
      scrollToSection(sectionId);
      return;
    }

    const validOrders = getValidOrders();

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
    validateRequiredFields,
    scrollToSection,
  ]);

  const totalDemandM2 = orders.reduce((sum, o) => sum + (o.m2 || 0), 0);

  /** Üst adım çubuğu: Rapor adı → Siparişler → Senaryo → Maliyet → Rulo. Tıklanınca ilgili bölüme kayar. */
  const CONFIG_STEPS = [
    { id: 'description', label: 'Rapor Adı', icon: 'notes' as const },
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
              {LOADING_STEPS[loadingStep]}
            </p>
            <p className="text-sm text-slate-500">Bu işlem zaman alabilir, lütfen bekleyiniz.</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Yeni Optimizasyon Senaryosu
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
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
              hasThicknessError={missingFields.includes('thickness')}
              hasDensityError={missingFields.includes('density')}
              blinkValidationKey={validationBlinkKey}
            />
          </section> */}

          <section
            id="section-description"
            className="scroll-mt-[5.5rem]"
            aria-labelledby="heading-description"
          >
            <h2 id="heading-description" className="sr-only">Rapor Adı</h2>
            <div
              className={`rounded-xl border shadow-sm overflow-hidden ${
                missingFields.includes('description') ? 'border-red-300' : 'border-slate-200 bg-white dark:bg-slate-900'
              }`}
              key={missingFields.includes('description') ? `description-${validationBlinkKey}` : 'description'}
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-primary">Rapor Adı</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bu çalıştırma sonuçlar tablosunda bu açıklama ile listelenecektir. (Zorunlu)
                </p>
              </div>
              <div className="p-6">
                <input
                  id="run-description"
                  type="text"
                  value={runDescription}
                  onChange={(e) => setRunDescription(e.target.value)}
                  placeholder="Örn: Mart ayı ana senaryo, 3 rulo test"
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  aria-required="true"
                  aria-invalid={missingFields.includes('description')}
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
            <div
              className={`rounded-xl border shadow-sm overflow-hidden ${
                missingFields.includes('orders') ? 'border-red-300' : 'border-slate-200 bg-white'
              }`}
              key={missingFields.includes('orders') ? `orders-section-${validationBlinkKey}` : 'orders-section'}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/5 bg-slate-50/70 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-primary">Siparişler</h2>
                  <p className="text-xs text-slate-500">
                    {orders.length > 0
                      ? `${orders.length} sipariş seçili`
                      : 'Optimizasyona dahil edilecek siparişleri sağdaki menüden seçin.'}
                  </p>
                </div>
                <OrdersSelectDropdown
                  orders={availableOrders}
                  selectedIds={selectedOrderIds}
                  onSelectionChange={setSelectedOrderIds}
                  hasError={missingFields.includes('orders')}
                  label="Siparişlerden seç"
                />
              </div>
              <OrdersSummaryCard
                orders={orders}
                thickness={thickness}
                density={density}
                hasOrdersError={missingFields.includes('orders')}
                blinkValidationKey={validationBlinkKey}
                showManualAdd={false}
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
            <ScenarioSelectionCard
              maxOrdersPerRoll={maxOrdersPerRoll}
              onMaxOrdersPerRollChange={setMaxOrdersPerRoll}
              maxRollsPerOrder={maxRollsPerOrder}
              onMaxRollsPerOrderChange={setMaxRollsPerOrder}
              hasMaxOrdersPerRollError={missingFields.includes('maxOrdersPerRoll')}
              hasMaxRollsPerOrderError={missingFields.includes('maxRollsPerOrder')}
              blinkValidationKey={validationBlinkKey}
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
              hasFireCostError={missingFields.includes('fireCost')}
              hasSetupCostError={missingFields.includes('setupCost')}
              hasStockCostError={missingFields.includes('stockCost')}
              blinkValidationKey={validationBlinkKey}
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
              onRollsChange={(newRolls) => {
                setRolls(newRolls);
                setStockRollIds((prev) => {
                  const next = [...prev];
                  while (next.length < newRolls.length) next.push('');
                  return next.slice(0, newRolls.length);
                });
              }}
              maxInterleavingOrders={maxInterleavingOrders}
              onMaxInterleavingOrdersChange={setMaxInterleavingOrders}
              interleavingPenaltyCost={interleavingPenaltyCost}
              onInterleavingPenaltyCostChange={setInterleavingPenaltyCost}
              estimatedNeedTon={estimatedNeedTon}
              hasRollsError={missingFields.includes('rolls')}
              blinkValidationKey={validationBlinkKey}
              showManualAdd={false}
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
            maxOrdersPerRoll={maxOrdersPerRoll ?? undefined}
            maxRollsPerOrder={maxRollsPerOrder ?? undefined}
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
