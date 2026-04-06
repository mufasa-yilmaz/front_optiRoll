import type { OptimizeRequest, OrderInput } from '@/lib/api';

/** Demo siparişleri: sabit örnek seti (çözümler sayfası). */
export const DEMO_ORDERS: OrderInput[] = [
  { m2: 100, panelWidth: 1, panelLength: 1 },
  { m2: 80, panelWidth: 1, panelLength: 1 },
  { m2: 60, panelWidth: 1, panelLength: 1 },
];

/** Demo rulo tonajları. */
export const DEMO_ROLL_TONS = [15, 12, 11, 10];

/**
 * Çözümler demosu için OptimizeRequest üretir (DB kaydı yok).
 * Talep çarpanı backend’de sabit çift yüzey (2×); sipariş başına en az 2 rulo için maxRolls en az 2 olmalı.
 *
 * @param thicknessMm - Malzeme kalınlığı (mm)
 * @param maxInterleavingOrders - Araya max farklı sipariş
 * @param interleavingPenaltyCost - Fazla araya sipariş başına ceza
 * @param maxOrdersPerRoll - Rulo başına en fazla farklı sipariş
 * @param maxRollsPerOrder - Sipariş başına en fazla rulo
 */
export function buildDemoOptimizeRequest(
  thicknessMm: number,
  maxInterleavingOrders: number,
  interleavingPenaltyCost: number,
  maxOrdersPerRoll: number,
  maxRollsPerOrder: number,
): OptimizeRequest {
  return {
    material: { thickness: thicknessMm, density: 7.85 },
    orders: DEMO_ORDERS,
    rollSettings: {
      rolls: [...DEMO_ROLL_TONS],
      maxOrdersPerRoll,
      maxRollsPerOrder: Math.max(2, maxRollsPerOrder),
    },
    costs: { fireCost: 450, setupCost: 120, stockCost: 2.5 },
    safetyStock: 0,
    maxInterleavingOrders: Math.max(0, maxInterleavingOrders),
    interleavingPenaltyCost: Math.max(0, interleavingPenaltyCost),
    saveToDb: false,
  };
}
