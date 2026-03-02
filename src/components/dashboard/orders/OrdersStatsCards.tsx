interface OrdersStatsCardsProps {
  activeOrders: number;
  efficiencyRate: number;
  remainingStockKg: number;
}

/** Alt bölümdeki özet bilgi kartlarını render eder. */
export function OrdersStatsCards({
  activeOrders,
  efficiencyRate,
  remainingStockKg,
}: OrdersStatsCardsProps) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Aktif Siparişler</p>
            <p className="text-2xl font-black text-slate-900">{activeOrders}</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Verimlilik Oranı</p>
            <p className="text-2xl font-black text-slate-900">%{efficiencyRate.toFixed(1)}</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Kalan Stok</p>
            <p className="text-2xl font-black text-slate-900">{remainingStockKg.toLocaleString('tr-TR')} kg</p>
          </div>
        </div>
      </div>
    </div>
  );
}
