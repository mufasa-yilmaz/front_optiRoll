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
  DashboardFooterCta,
} from '@/components';
import {
  optimize,
  getOrderSets,
  getStockSets,
  getConfigurationById,
  type SavedOrderSet,
  type SavedStockSet,
  type OptimizeRequest,
} from '@/lib/api';
import { useOptimization } from '@/contexts/OptimizationContext';

/** Başlangıçta sipariş listesi boş - kullanıcı ekleyecek */
const INITIAL_ORDERS: { id: string; m2: number; panelWidth: number; panelLength?: number }[] = [];

/** Yükleme sırasında gösterilen aşamalı durum mesajları. */
const LOADING_STEPS = ['Analiz ediliyor...', 'Hesaplanıyor...', 'Sonuçlar getiriliyor...'] as const;

/** Verilen süre kadar (ms) bekleme yapan yardımcı fonksiyon. */
function waitMs(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
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
  const [safetyStock, setSafetyStock] = useState<number | undefined>(undefined);
  const [maxOrdersPerRoll, setMaxOrdersPerRoll] = useState<number | undefined>(undefined);
  const [maxRollsPerOrder, setMaxRollsPerOrder] = useState<number | undefined>(undefined);
  const [rolls, setRolls] = useState<number[]>([]);
  const [fireCost, setFireCost] = useState<number | undefined>(undefined);
  const [setupCost, setSetupCost] = useState<number | undefined>(undefined);
  const [stockCost, setStockCost] = useState<number | undefined>(undefined);
  const [orders, setOrders] = useState<{ id: string; m2: number; panelWidth: number; panelLength?: number }[]>(INITIAL_ORDERS);

  const densityGcm3 = density ? density / 1000 : 0;
  const estimatedNeedTon =
    thickness && density
      ? orders.reduce((sum, o) => sum + o.m2 * (thickness / 1000) * (density / 1000), 0) *
        (1 + (safetyStock ?? 0) / 100)
      : 0;
  const [configurationId, setConfigurationId] = useState<string | null>(null);
  const [isLoadingConfiguration, setIsLoadingConfiguration] = useState(false);
  const [orderSets, setOrderSets] = useState<SavedOrderSet[]>([]);
  const [stockSets, setStockSets] = useState<SavedStockSet[]>([]);
  const [selectedOrderSetId, setSelectedOrderSetId] = useState('');
  const [selectedStockSetId, setSelectedStockSetId] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  type MissingFieldKey =
    | 'thickness'
    | 'density'
    | 'safetyStock'
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
   * Konfigürasyon ekranında kullanılacak sipariş/stok setlerini yükler.
   */
  const loadPresetSets = useCallback(async () => {
    try {
      const [ordersRes, stocksRes] = await Promise.all([getOrderSets(), getStockSets()]);
      setOrderSets(ordersRes.orderSets || []);
      setStockSets(stocksRes.stockSets || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Hazır setler yüklenemedi';
      toast.error(msg);
    }
  }, []);

  /**
   * Formdan geçerli sipariş satırlarını üretir.
   */
  const getValidOrders = useCallback(() => {
    return orders.filter((o) => o.m2 > 0 && o.panelWidth > 0 && (o.panelLength ?? 1) > 0);
  }, [orders]);

  /**
   * Konfigürasyon formu için zorunlu alanları kontrol eder, eksik/uygunsuz olanları döner.
   */
  const validateRequiredFields = useCallback((): MissingFieldKey[] => {
    const missing: MissingFieldKey[] = [];

    if (!thickness || thickness <= 0) {
      missing.push('thickness');
    }

    if (!density || density <= 0) {
      missing.push('density');
    }

    if (safetyStock == null) {
      missing.push('safetyStock');
    }

    if (!maxOrdersPerRoll || maxOrdersPerRoll <= 0) {
      missing.push('maxOrdersPerRoll');
    }

    if (!maxRollsPerOrder || maxRollsPerOrder <= 0) {
      missing.push('maxRollsPerOrder');
    }

    if (!fireCost || fireCost <= 0) {
      missing.push('fireCost');
    }

    if (!setupCost || setupCost <= 0) {
      missing.push('setupCost');
    }

    if (stockCost == null) {
      missing.push('stockCost');
    }

    const validOrders = getValidOrders();
    if (orders.length === 0 || validOrders.length === 0) {
      missing.push('orders');
    }

    if (rolls.length === 0 || rolls.some((r) => r <= 0)) {
      missing.push('rolls');
    }

    return missing;
  }, [
    thickness,
    density,
    safetyStock,
    maxOrdersPerRoll,
    maxRollsPerOrder,
    fireCost,
    setupCost,
    stockCost,
    orders,
    rolls,
    getValidOrders,
  ]);

  /**
   * Form alanlarından optimize isteği payload'ını oluşturur.
   */
  const buildOptimizeRequest = useCallback(
    (validOrders: { id: string; m2: number; panelWidth: number; panelLength?: number }[]): OptimizeRequest => {
      return {
        material: { thickness: thickness ?? 0, density: densityGcm3 },
        safetyStock: safetyStock ?? 0,
        configurationId: configurationId ?? undefined,
        orders: validOrders.map((o) => ({ m2: o.m2, panelWidth: o.panelWidth, panelLength: o.panelLength ?? 1 })),
        rollSettings: {
          rolls: rolls.filter((r) => r > 0),
          maxOrdersPerRoll: maxOrdersPerRoll ?? 0,
          maxRollsPerOrder: maxRollsPerOrder ?? 0,
        },
        costs: {
          fireCost: fireCost ?? 0,
          setupCost: setupCost ?? 0,
          stockCost: stockCost ?? 0,
        },
      };
    },
    [
      thickness,
      densityGcm3,
      safetyStock,
      configurationId,
      rolls,
      maxOrdersPerRoll,
      maxRollsPerOrder,
      fireCost,
      setupCost,
      stockCost,
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
        setSafetyStock(Number(cfg.safety_stock));
        setMaxOrdersPerRoll(Number(cfg.max_orders_per_roll) || undefined);
        setMaxRollsPerOrder(Number(cfg.max_rolls_per_order) || undefined);
        setFireCost(Number(cfg.fire_cost) || undefined);
        setSetupCost(Number(cfg.setup_cost) || undefined);
        setStockCost(Number(cfg.stock_cost));
        setRolls(
          Array.isArray(cfg.rolls)
            ? cfg.rolls.map((r) => Number(r)).filter((r) => r > 0)
            : [],
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

  /**
   * Seçilen sipariş setini manuel forma uygular.
   */
  const applyOrderSet = useCallback(
    (setId: string) => {
      setSelectedOrderSetId(setId);
      if (!setId) return;
      const found = orderSets.find((s) => s.id === setId);
      if (!found) return;
      const mapped = (found.orders || [])
        .map((o, idx) => ({
          id: `S${idx + 1}`,
          m2: Number(o.m2),
          panelWidth: Number(o.panelWidth),
          panelLength: Number((o as { panelLength?: number }).panelLength ?? 1),
        }))
        .filter((o) => o.m2 > 0 && o.panelWidth > 0 && (o.panelLength ?? 1) > 0);
      if (mapped.length > 0) setOrders(mapped);
    },
    [orderSets],
  );

  /**
   * Seçilen stok setini manuel forma uygular.
   */
  const applyStockSet = useCallback(
    (setId: string) => {
      setSelectedStockSetId(setId);
      if (!setId) return;
      const found = stockSets.find((s) => s.id === setId);
      if (!found) return;
      const mapped = (found.rolls || []).map((r) => Number(r)).filter((r) => r > 0);
      if (mapped.length > 0) setRolls(mapped);
    },
    [stockSets],
  );

  const handleSubmit = useCallback(async () => {
    const missing = validateRequiredFields();
    if (missing.length > 0) {
      setMissingFields(missing);
      setValidationBlinkKey((prev) => prev + 1);

      const first = missing[0];
      const messageMap: Partial<Record<MissingFieldKey, string>> = {
        thickness: 'Malzeme kalınlığını girmeyi unuttunuz.',
        density: 'Malzeme yoğunluğunu girmeyi unuttunuz.',
        safetyStock: 'Güvenlik stoğu yüzdesini kontrol edin.',
        maxOrdersPerRoll: 'Bir rulodaki maksimum sipariş sayısını girmelisiniz.',
        maxRollsPerOrder: 'Bir sipariş için maksimum rulo sayısını girmelisiniz.',
        fireCost: 'Fire maliyeti (cf) alanını doldurun.',
        setupCost: 'Rulo açılış maliyeti (A) alanını doldurun.',
        stockCost: 'Elde tutma maliyeti (h) alanını doldurun.',
        orders: 'En az bir geçerli sipariş girmelisiniz.',
        rolls: 'En az bir rulo tanımlamalısınız.',
      };

      toast.error(messageMap[first ?? 'orders'] ?? 'Şu noktaları doldurmayı unuttunuz.');
      return;
    }

    const validOrders = getValidOrders();

    setLoading(true);
    setError(null);

    try {
      const request = buildOptimizeRequest(validOrders);
      const minDelayMs = 10000;
      const maxDelayMs = 14000;
      const startTime = performance.now();
      const result = await optimize(request);
      const targetTotal =
        minDelayMs + Math.random() * (Math.max(maxDelayMs, minDelayMs) - minDelayMs);
      const elapsed = performance.now() - startTime;
      const remaining = targetTotal - elapsed;
      if (remaining > 0) {
        await waitMs(remaining);
      }
      setLastResult(result);
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
  ]);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-10 py-8 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-lg font-semibold text-slate-700 animate-pulse">
              {LOADING_STEPS[loadingStep]}
            </p>
            <p className="text-sm text-slate-500">Bu işlem 10–14 saniye sürebilir</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-4 space-y-6">
          <MaterialPropertiesCard
            thickness={thickness}
            onThicknessChange={setThickness}
            density={density}
            onDensityChange={setDensity}
            hasThicknessError={missingFields.includes('thickness')}
            hasDensityError={missingFields.includes('density')}
            blinkValidationKey={validationBlinkKey}
          />
          <ScenarioSelectionCard
            safetyStock={safetyStock}
            onSafetyStockChange={setSafetyStock}
            maxOrdersPerRoll={maxOrdersPerRoll}
            onMaxOrdersPerRollChange={setMaxOrdersPerRoll}
            maxRollsPerOrder={maxRollsPerOrder}
            onMaxRollsPerOrderChange={setMaxRollsPerOrder}
            hasMaxOrdersPerRollError={missingFields.includes('maxOrdersPerRoll')}
            hasMaxRollsPerOrderError={missingFields.includes('maxRollsPerOrder')}
            blinkValidationKey={validationBlinkKey}
          />
        </aside>
        <div className="lg:col-span-8 flex flex-col gap-6">
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
          <RollSettingsCard
            rolls={rolls}
            onRollsChange={setRolls}
            estimatedNeedTon={estimatedNeedTon}
            stockSets={stockSets}
            selectedStockSetId={selectedStockSetId}
            onStockSetSelect={applyStockSet}
            hasRollsError={missingFields.includes('rolls')}
            blinkValidationKey={validationBlinkKey}
          />
          <OrdersSummaryCard
            orders={orders}
            onOrdersChange={setOrders}
            thickness={thickness}
            density={density}
            orderSets={orderSets}
            selectedOrderSetId={selectedOrderSetId}
            onOrderSetSelect={applyOrderSet}
            hasOrdersError={missingFields.includes('orders')}
            blinkValidationKey={validationBlinkKey}
          />
        </div>
      </div>
      {isLoadingConfiguration && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          Kayıtlı konfigürasyon yükleniyor...
        </div>
      )}
      <DashboardFooterCta onSubmit={handleSubmit} isLoading={isLoading} />
    </>
  );
}
