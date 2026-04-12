import { DEFAULT_ORDER_TABLE_MATERIAL, formatTonDisplayTr } from './helpers';

interface OrdersStatsCardsProps {
  /** Beklemede veya üretimdeki sipariş sayısı (istatistik kartı). */
  activeOrderCount: number;
  /** Tablodaki siparişlerin talep m² toplamı (satır m² alanlarının toplamı). */
  totalM2: number;
  /** Çift yüzey ve panel yuvarlaması dahil tahmini ton toplamı. */
  totalEstimatedTon: number;
  /** Ton toplamı hesabında kullanılan malzeme; verilmezse tablo varsayılanı. */
  tonMaterial?: { thicknessMm: number; densityKgM3: number };
}

/**
 * Alt bölümdeki özet bilgi kartlarını render eder: aktif sipariş, toplam m², toplam tahmini tonaj.
 */
export function OrdersStatsCards({
  activeOrderCount,
  totalM2,
  totalEstimatedTon,
  tonMaterial = DEFAULT_ORDER_TABLE_MATERIAL,
}: OrdersStatsCardsProps) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Aktif siparişler</p>
            <p className="text-2xl font-black text-slate-900">{activeOrderCount.toLocaleString('tr-TR')}</p>
            <p className="mt-1 text-[10px] text-slate-400">Beklemede veya üretimde</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">square_foot</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Toplam m²</p>
            <p className="text-2xl font-black text-slate-900">
              {totalM2.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">Listelenen tüm siparişlerin talep m² toplamı</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <span className="material-symbols-outlined">scale</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Toplam tahmini tonaj</p>
            <p className="text-2xl font-black text-slate-900">
              {formatTonDisplayTr(totalEstimatedTon)} t
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Tüm siparişler; çift yüzey (×2), panel yuvarlaması; {tonMaterial.thicknessMm} mm / {tonMaterial.densityKgM3}{' '}
              kg/m³
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
