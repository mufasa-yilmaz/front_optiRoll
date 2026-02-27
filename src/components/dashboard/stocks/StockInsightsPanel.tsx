import Link from 'next/link';
import type { StockLedgerRow } from './types';

interface StockInsightsPanelProps {
  rows: StockLedgerRow[];
}

/**
 * Satir listesinden malzeme dagilimi yuzdelerini hesaplar.
 */
function computeDistribution(rows: StockLedgerRow[]) {
  const totals = rows.reduce(
    (acc, row) => {
      if (row.totalTon >= 8) acc.heavy += row.totalTon;
      else if (row.totalTon >= 4) acc.medium += row.totalTon;
      else if (row.totalTon >= 2) acc.light += row.totalTon;
      else acc.micro += row.totalTon;
      return acc;
    },
    { heavy: 0, medium: 0, light: 0, micro: 0 },
  );

  const grandTotal = totals.heavy + totals.medium + totals.light + totals.micro;
  if (grandTotal <= 0) return { heavy: 0, medium: 0, light: 0, micro: 0 };

  return {
    heavy: Math.round((totals.heavy / grandTotal) * 100),
    medium: Math.round((totals.medium / grandTotal) * 100),
    light: Math.round((totals.light / grandTotal) * 100),
    micro: Math.max(
      0,
      100 -
        Math.round((totals.heavy / grandTotal) * 100) -
        Math.round((totals.medium / grandTotal) * 100) -
        Math.round((totals.light / grandTotal) * 100),
    ),
  };
}

/**
 * Alt bolumde dagilim karti ve optimizasyon onerisi paneli.
 */
export function StockInsightsPanel({ rows }: StockInsightsPanelProps) {
  const distribution = computeDistribution(rows);
  const topSuggestion = rows[0];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2 rounded-xl border border-primary/5 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-bold text-primary">
            <span className="material-symbols-outlined text-primary">pie_chart</span>
            Stok Dagilimi
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Canli istatistik</span>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span>Yuksek Tonajli Setler (8+ ton)</span>
              <span>%{distribution.heavy}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-primary" style={{ width: `${distribution.heavy}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span>Orta Tonajli Setler (4-8 ton)</span>
              <span>%{distribution.medium}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-blue-400" style={{ width: `${distribution.medium}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span>Dusuk Tonajli Setler (2-4 ton)</span>
              <span>%{distribution.light}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-slate-400" style={{ width: `${distribution.light}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span>Mikro Setler (&lt;2 ton)</span>
              <span>%{distribution.micro}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-slate-300" style={{ width: `${distribution.micro}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-primary p-6 text-white shadow-lg">
        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <span className="material-symbols-outlined rounded-lg bg-white/20 p-2">insights</span>
            <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
              Optimal Path
            </span>
          </div>
          <h4 className="mb-2 text-xl font-bold leading-tight">Optimizasyon Onerisi</h4>
          <p className="text-sm leading-relaxed text-white/85">
            {topSuggestion
              ? `"${topSuggestion.setName}" seti ile sonraki kesim dongusunda fireyi azaltma firsati var.`
              : 'Kayitli set olusturarak optimizasyon onerisi almak icin veriyi hazirlayin.'}
          </p>
        </div>
        <Link
          href="/dashboard/configuration"
          className="relative z-10 mt-6 rounded-lg bg-white px-4 py-2 text-center text-sm font-bold text-primary transition hover:bg-white/90"
        >
          Run Optimizer
        </Link>
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      </div>
    </div>
  );
}
