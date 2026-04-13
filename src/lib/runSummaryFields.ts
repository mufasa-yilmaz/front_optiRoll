import type { RunSummary } from '@/lib/api';

/**
 * `RunSummary.summary` nesnesinden camelCase veya snake_case anahtarla sayı okur.
 */
function readSummaryNumber(
  run: RunSummary,
  camelKey: string,
  snakeKey: string,
): number {
  const s = run.summary as unknown as Record<string, unknown> | undefined;
  if (!s) return 0;
  const v = s[camelKey] ?? s[snakeKey];
  return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
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
 * `run_status` alanına göre kullanıcıya gösterilecek kısa Türkçe etiket.
 */
export function getRunStatusLabelTr(run: RunSummary): string {
  const status = run.run_status ?? 'saved';
  if (status === 'processed') return 'İşlendi';
  if (status === 'cancelled') return 'İptal';
  return 'Beklemede / test';
}
