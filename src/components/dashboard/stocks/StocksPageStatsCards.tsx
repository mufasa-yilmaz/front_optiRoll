import type { Order, StockRoll } from '@/lib/api';
import {
  DEFAULT_ORDER_TABLE_MATERIAL,
  formatTonDisplayTr,
  sumOrdersEstimatedDemandTon,
} from '@/components/dashboard/orders/helpers';

interface StocksPageStatsCardsProps {
  /** Envanterdeki rulo kayıtları. */
  rolls: StockRoll[];
  /** Sipariş listesi; sadece `Pending` olanlar ihtiyaç tonunda kullanılır. */
  orders: Order[];
}

/**
 * Bekleyen sipariş ton ihtiyacı ile mevcut stok arasındaki pozitif farkı (ton açığı) döndürür.
 */
function computePendingStockShortageTon(pendingDemandTon: number, stockTotalTon: number): number {
  return Math.max(0, pendingDemandTon - stockTotalTon);
}

/**
 * Stok, bekleme tahmini ihtiyaçtan fazlaysa fazlalık tonunu döndürür (denk veya eksikte 0).
 */
function computePendingStockSurplusTon(pendingDemandTon: number, stockTotalTon: number): number {
  return Math.max(0, stockTotalTon - pendingDemandTon);
}

/**
 * Stok sayfası üst istatistik kartları: rulo sayısı, stok tonu, beklemedeki tahmini ihtiyaç tonu, stok açığı.
 */
export function StocksPageStatsCards({ rolls, orders }: StocksPageStatsCardsProps) {
  const stockTotalTon = rolls.reduce((sum, r) => sum + Number(r.tonnage), 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const pendingDemandTon = sumOrdersEstimatedDemandTon(
    pendingOrders,
    DEFAULT_ORDER_TABLE_MATERIAL.thicknessMm,
    DEFAULT_ORDER_TABLE_MATERIAL.densityKgM3,
  );
  const shortageTon = computePendingStockShortageTon(pendingDemandTon, stockTotalTon);
  const surplusTon = computePendingStockSurplusTon(pendingDemandTon, stockTotalTon);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase text-slate-400">Toplam rulo</p>
        <p className="text-2xl font-black text-slate-900">{rolls.length}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase text-slate-400">Mevcut stok tonu</p>
        <p className="text-2xl font-black text-primary">{stockTotalTon.toFixed(1)} ton</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase text-slate-400">Bekleyen sipariş ton ihtiyacı</p>
        <p className="text-2xl font-black text-slate-900">{formatTonDisplayTr(pendingDemandTon)} t</p>
        <p className="mt-1 text-[10px] text-slate-400">
          {pendingOrders.length} sipariş beklemede; optimizasyon öncesi tahmin (
          {DEFAULT_ORDER_TABLE_MATERIAL.thicknessMm} mm)
        </p>
      </div>
      <div
        className={`rounded-xl border bg-white p-4 shadow-sm ${
          shortageTon > 0 ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'
        }`}
      >
        <p className="text-xs font-bold uppercase text-slate-400">Stok / ihtiyaç farkı</p>
        {shortageTon > 0 ? (
          <>
            <p className="text-2xl font-black text-amber-700">{formatTonDisplayTr(shortageTon)} t eksik</p>
            <p className="mt-1 text-[10px] text-slate-500">
              Bekleyen tahmini ihtiyaç, mevcut stoktan fazla; yaklaşık bu kadar ton eksik görünüyor.
            </p>
          </>
        ) : surplusTon > 0 ? (
          <>
            <p className="text-2xl font-black text-emerald-700">{formatTonDisplayTr(surplusTon)} t artan stok</p>
            <p className="mt-1 text-[10px] text-slate-500">
              {pendingDemandTon > 0
                ? 'Mevcut stok, beklemedeki tahmini ihtiyaçtan bu kadar ton fazla.'
                : 'Beklemede sipariş olmadığı için tüm stok, talep üzerinde sayılır; artan miktar mevcut stok tonudur.'}
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-black text-emerald-700">Açık yok</p>
            <p className="mt-1 text-[10px] text-slate-500">
              Stok ile beklemedeki siparişlerin tahmini ihtiyacı denk; ne eksik ne fazla görünüyor.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
