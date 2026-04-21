import type { RunSummary } from '@/lib/api';

/**
 * `RunSummary.summary` nesnesinden camelCase veya snake_case anahtarla sayı okur.
 * Supabase JSON bazen sayıları string döndürebilir; bu durumda Number ile çözülür.
 */
function readSummaryNumber(
  run: RunSummary,
  camelKey: string,
  snakeKey: string,
): number {
  const s = run.summary as unknown as Record<string, unknown> | undefined;
  if (!s) return 0;
  const v = s[camelKey] ?? s[snakeKey];
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return !Number.isNaN(n) ? n : 0;
  }
  return 0;
}

/**
 * Çalıştırma özetinden toplam maliyeti (TL) döndürür.
 */
export function getRunSummaryTotalCost(run: RunSummary): number {
  return readSummaryNumber(run, 'totalCost', 'total_cost');
}

/**
 * Çalıştırma özetinden toplam fire tonajını döndürür.
 */
export function getRunSummaryTotalFire(run: RunSummary): number {
  return readSummaryNumber(run, 'totalFire', 'total_fire');
}

/**
 * Çalıştırma özetinden optimizasyon sonrası stok tonajını döndürür.
 */
export function getRunSummaryTotalStock(run: RunSummary): number {
  return readSummaryNumber(run, 'totalStock', 'total_stock');
}

/**
 * Çalıştırma özetinden açılan rulo sayısını döndürür (yoksa 0).
 */
export function getRunSummaryOpenedRolls(run: RunSummary): number {
  return readSummaryNumber(run, 'openedRolls', 'opened_rolls');
}

/**
 * Özetten fire maliyeti (cf × fire ton) TL cinsinden.
 */
export function getRunSummaryCostFireLira(run: RunSummary): number {
  return readSummaryNumber(run, 'costFireLira', 'cost_fire_lira');
}

/**
 * Özetten üretim stoku maliyeti (h × stok ton) TL cinsinden.
 */
export function getRunSummaryCostStockLira(run: RunSummary): number {
  return readSummaryNumber(run, 'costStockLira', 'cost_stock_lira');
}

/**
 * Özetten stok tutmaya tabi toplam ton (üretim stoku + elde bobin).
 */
export function getRunSummaryTotalStockHoldingTon(run: RunSummary): number {
  return readSummaryNumber(run, 'totalStockHoldingTon', 'total_stock_holding_ton');
}

/**
 * Stok maliyetinin üretim stoğu kısmı (TL).
 */
export function getRunSummaryCostStockProductionLira(run: RunSummary): number {
  return readSummaryNumber(run, 'costStockProductionLira', 'cost_stock_production_lira');
}

/**
 * Stok maliyetinin rafta elde bobin kısmı (TL).
 */
export function getRunSummaryCostStockShelfLira(run: RunSummary): number {
  return readSummaryNumber(run, 'costStockShelfLira', 'cost_stock_shelf_lira');
}

/**
 * Özetten kurulum (rulo açma) maliyeti TL cinsinden.
 */
export function getRunSummaryCostSetupLira(run: RunSummary): number {
  return readSummaryNumber(run, 'costSetupLira', 'cost_setup_lira');
}

/**
 * Özetten sıra cezası TL cinsinden (yoksa 0).
 */
export function getRunSummaryCostSequencePenaltyLira(run: RunSummary): number {
  return readSummaryNumber(run, 'costSequencePenaltyLira', 'cost_sequence_penalty_lira');
}

/**
 * `run_status` alanına göre kullanıcıya gösterilecek kısa Türkçe etiket.
 */
export function getRunStatusLabelTr(run: RunSummary): string {
  const status = run.run_status ?? 'saved';
  if (status === 'processed') return 'İşlendi';
  if (status === 'cancelled') return 'İptal';
  return 'Beklemede / test';
}
