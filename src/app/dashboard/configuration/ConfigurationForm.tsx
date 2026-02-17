'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MaterialPropertiesCard,
  ScenarioSelectionCard,
  RollSettingsCard,
  CostParametersCard,
  OrdersSummaryCard,
  DashboardFooterCta,
} from '@/components';
import { optimize, type OptimizeRequest } from '@/lib/api';
import { useOptimization } from '@/contexts/OptimizationContext';

/** Başlangıçta boş veya tek örnek sipariş - kullanıcı ekleyecek */
const INITIAL_ORDERS = [
  { id: 'S1', m2: 100, panelWidth: 1.0 },
];

/**
 * Konfigürasyon formu: tüm inputları toplar, API çağrısı yapar, sonucu context'e yazar.
 */
export function ConfigurationForm() {
  const router = useRouter();
  const { setLastResult, setLoading, setError, isLoading } = useOptimization();

  const [thickness, setThickness] = useState(0.75);
  const [density, setDensity] = useState(7850);
  const [safetyStock, setSafetyStock] = useState(12);
  const [maxOrdersPerRoll, setMaxOrdersPerRoll] = useState(8);
  const [maxRollsPerOrder, setMaxRollsPerOrder] = useState(5);
  const [rolls, setRolls] = useState<number[]>([10, 10, 10]);
  const [fireCost, setFireCost] = useState(450);
  const [setupCost, setSetupCost] = useState(120);
  const [stockCost, setStockCost] = useState(2.5);
  const [orders, setOrders] = useState<{ id: string; m2: number; panelWidth: number }[]>(INITIAL_ORDERS);

  const densityGcm3 = density / 1000;
  const estimatedNeedTon =
    orders.reduce((sum, o) => sum + o.m2 * (thickness / 1000) * densityGcm3, 0) *
    (1 + safetyStock / 100);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    if (orders.length === 0) {
      setSubmitError('En az bir sipariş ekleyin.');
      return;
    }
    const validOrders = orders.filter((o) => o.m2 > 0 && o.panelWidth > 0);
    if (validOrders.length === 0) {
      setSubmitError('Geçerli sipariş bulunamadı. m² ve panel genişliği 0\'dan büyük olmalıdır.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const rollSettings = {
        rolls: rolls.filter((r) => r > 0),
        maxOrdersPerRoll,
        maxRollsPerOrder,
      };

      const request: OptimizeRequest = {
        material: { thickness, density: densityGcm3 },
        orders: validOrders.map((o) => ({ m2: o.m2, panelWidth: o.panelWidth })),
        rollSettings,
        costs: {
          fireCost,
          setupCost,
          stockCost,
        },
      };

      const result = await optimize(request);
      setLastResult(result);
      router.push(`/dashboard/sonuc/${result.fileId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Optimizasyon hatası';
      setSubmitError(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [
    thickness,
    densityGcm3,
    rolls,
    maxOrdersPerRoll,
    maxRollsPerOrder,
    fireCost,
    setupCost,
    stockCost,
    orders,
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
            <p className="text-lg font-semibold text-slate-700">Hesaplanıyor...</p>
            <p className="text-sm text-slate-500">En fazla 2 dakika sürebilir</p>
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
          <RollSettingsCard
            rolls={rolls}
            onRollsChange={setRolls}
            estimatedNeedTon={estimatedNeedTon}
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
          <OrdersSummaryCard
            orders={orders}
            onOrdersChange={setOrders}
            thickness={thickness}
            density={density}
          />
        </div>
      </div>
      {submitError && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}
      <DashboardFooterCta onSubmit={handleSubmit} isLoading={isLoading} />
    </>
  );
}
