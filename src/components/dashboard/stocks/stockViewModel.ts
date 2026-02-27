import type { StockLedgerRow, StockPageViewModel, StockSetEntity } from './types';

/**
 * ISO tarih alanını güvenli biçimde kullanıcı dostu tarihe çevirir.
 */
function formatDate(value?: string): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('tr-TR');
}

/**
 * Toplam tonaja göre durum etiketi üretir.
 */
function resolveStatus(totalTon: number): StockLedgerRow['status'] {
  if (totalTon <= 0.5) return 'Tukendi';
  if (totalTon <= 2) return 'Kritik';
  return 'Stokta';
}

/**
 * Satır bazında deterministik kullanım oranı üretir.
 */
function computeUsageRate(totalTon: number, rowIndex: number): number {
  if (totalTon <= 0) return 0;
  const seed = (rowIndex % 5) * 0.12 + 0.18;
  return Math.min(0.96, seed);
}

/**
 * API'den gelen stok setlerini ekranda kullanılan görünüm modeline dönüştürür.
 */
export function buildStockPageViewModel(stockSets: StockSetEntity[]): StockPageViewModel {
  const rows = stockSets.map<StockLedgerRow>((setItem, index) => {
    const cleanRolls = (setItem.rolls || []).map((item) => Number(item)).filter((item) => item > 0);
    const totalTon = cleanRolls.reduce((sum, item) => sum + item, 0);
    const usageRate = computeUsageRate(totalTon, index);
    const usedTon = Number((totalTon * usageRate).toFixed(2));
    const remainingTon = Math.max(0, Number((totalTon - usedTon).toFixed(2)));
    const status = resolveStatus(remainingTon);
    return {
      id: `${setItem.id}-${index}`,
      setId: setItem.id,
      setName: setItem.name || `Set ${index + 1}`,
      rollCount: cleanRolls.length,
      totalTon,
      usedTon,
      remainingTon,
      usageRate,
      status,
      createdAtText: formatDate(setItem.created_at),
      usageLabel: `SET-${index + 1}`,
    };
  });

  const totalSets = rows.length;
  const totalRolls = rows.reduce((sum, row) => sum + row.rollCount, 0);
  const totalTon = rows.reduce((sum, row) => sum + row.totalTon, 0);
  const lowStockCount = rows.filter((row) => row.status !== 'Stokta').length;
  const avgUsageRate = totalSets > 0 ? rows.reduce((sum, row) => sum + row.usageRate, 0) / totalSets : 0;
  const efficiencyIndex = Number((Math.max(0, 1 - avgUsageRate * 0.2) * 100).toFixed(1));

  return {
    rows,
    metrics: {
      totalSets,
      totalRolls,
      totalTon,
      lowStockCount,
      efficiencyIndex,
    },
  };
}
