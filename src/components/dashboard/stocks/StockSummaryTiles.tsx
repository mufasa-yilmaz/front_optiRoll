import type { StockSummaryMetrics } from './types';

interface StockSummaryTilesProps {
  metrics: StockSummaryMetrics;
}

/**
 * Stok sayfası üst KPI kartları.
 */
export function StockSummaryTiles({ metrics }: StockSummaryTilesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-primary/5 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">package_2</span>
          <span className="text-xs font-bold text-emerald-600">Canli</span>
        </div>
        <p className="text-sm font-medium text-slate-500">Toplam Set</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{metrics.totalSets}</p>
      </div>
      <div className="rounded-xl border border-primary/5 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">straighten</span>
          <span className="text-xs font-medium italic text-slate-400">Aktif</span>
        </div>
        <p className="text-sm font-medium text-slate-500">Toplam Rulo</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{metrics.totalRolls}</p>
      </div>
      <div className="rounded-xl border border-primary/5 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="material-symbols-outlined rounded-lg bg-amber-500/10 p-2 text-amber-600">warning</span>
          <span className="text-xs font-bold text-amber-600">Aksiyon</span>
        </div>
        <p className="text-sm font-medium text-slate-500">Düşük Stok Uyarısı</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{metrics.lowStockCount}</p>
      </div>
      <div className="rounded-xl border border-primary/5 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">monitoring</span>
          <span className="text-xs font-bold text-emerald-600">+1.2%</span>
        </div>
        <p className="text-sm font-medium text-slate-500">Verimlilik Endeksi</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">%{metrics.efficiencyIndex}</p>
      </div>
    </div>
  );
}
