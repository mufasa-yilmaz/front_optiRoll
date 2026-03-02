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

/** Başlangıçta boş veya tek örnek sipariş - kullanıcı ekleyecek */
const INITIAL_ORDERS = [
  { id: 'S1', m2: 1000, panelWidth: 1.0, panelLength: 1 },
];

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

  const [thickness, setThickness] = useState(0.75);
  const [density, setDensity] = useState(7850);
  const [safetyStock, setSafetyStock] = useState(12);
  const [maxOrdersPerRoll, setMaxOrdersPerRoll] = useState(2);
  const [maxRollsPerOrder, setMaxRollsPerOrder] = useState(2);
  const [rolls, setRolls] = useState<number[]>([10, 10, 10]);
  const [fireCost, setFireCost] = useState(450);
  const [setupCost, setSetupCost] = useState(120);
  const [stockCost, setStockCost] = useState(2.5);
  const [orders, setOrders] = useState<{ id: string; m2: number; panelWidth: number; panelLength?: number }[]>(INITIAL_ORDERS);

  const densityGcm3 = density / 1000;
  const estimatedNeedTon =
    orders.reduce((sum, o) => sum + o.m2 * (thickness / 1000) * densityGcm3, 0) *
    (1 + safetyStock / 100);
  const [configurationId, setConfigurationId] = useState<string | null>(null);
  const [isLoadingConfiguration, setIsLoadingConfiguration] = useState(false);
  const [orderSets, setOrderSets] = useState<SavedOrderSet[]>([]);
  const [stockSets, setStockSets] = useState<SavedStockSet[]>([]);
  const [selectedOrderSetId, setSelectedOrderSetId] = useState('');
  const [selectedStockSetId, setSelectedStockSetId] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

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
   * Form alanlarından optimize isteği payload'ını oluşturur.
   */
  const buildOptimizeRequest = useCallback(
    (validOrders: { id: string; m2: number; panelWidth: number; panelLength?: number }[]): OptimizeRequest => {
      return {
        material: { thickness, density: densityGcm3 },
        safetyStock,
        configurationId: configurationId ?? undefined,
        orders: validOrders.map((o) => ({ m2: o.m2, panelWidth: o.panelWidth, panelLength: o.panelLength ?? 1 })),
        rollSettings: {
          rolls: rolls.filter((r) => r > 0),
          maxOrdersPerRoll,
          maxRollsPerOrder,
        },
        costs: {
          fireCost,
          setupCost,
          stockCost,
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
        setThickness(Number(cfg.material_thickness) || 0.75);
        const densityValue = Number(cfg.material_density) || 7.85;
        // Geriye dönük uyumluluk: DB'deki değer 7.85 (g/cm3) veya 7850 (kg/m3) olabilir.
        setDensity(densityValue > 100 ? densityValue : densityValue * 1000);
        setSafetyStock(Number(cfg.safety_stock) || 0);
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
      timeoutId = setTimeout(() => {
        currentIndex = (currentIndex + 1) % LOADING_STEPS.length;
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
    if (orders.length === 0) {
      toast.error('En az bir sipariş ekleyin.');
      return;
    }
    const validOrders = getValidOrders();
    if (validOrders.length === 0) {
      toast.error('Geçerli sipariş bulunamadı. m², panel genişliği ve kesim uzunluğu 0\'dan büyük olmalıdır.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const request = buildOptimizeRequest(validOrders);
      const minDelayMs = 10000;
      const maxDelayMs = 20000;
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
            <p className="text-sm text-slate-500">Bu işlem 10–20 saniye sürebilir</p>
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
          />
          <ScenarioSelectionCard
            safetyStock={safetyStock}
            onSafetyStockChange={setSafetyStock}
            maxOrdersPerRoll={maxOrdersPerRoll}
            onMaxOrdersPerRollChange={setMaxOrdersPerRoll}
            maxRollsPerOrder={maxRollsPerOrder}
            onMaxRollsPerOrderChange={setMaxRollsPerOrder}
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
          />
          <RollSettingsCard
            rolls={rolls}
            onRollsChange={setRolls}
            estimatedNeedTon={estimatedNeedTon}
            stockSets={stockSets}
            selectedStockSetId={selectedStockSetId}
            onStockSetSelect={applyStockSet}
          />
          <OrdersSummaryCard
            orders={orders}
            onOrdersChange={setOrders}
            thickness={thickness}
            density={density}
            orderSets={orderSets}
            selectedOrderSetId={selectedOrderSetId}
            onOrderSetSelect={applyOrderSet}
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
