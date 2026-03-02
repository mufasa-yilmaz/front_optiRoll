import { useMemo, useState } from 'react';
import type { StockLedgerRow } from './types';

interface StockLedgerTableProps {
  rows: StockLedgerRow[];
  loading: boolean;
  onApplySet: (setId: string) => void;
  onUpdateSet: (setId: string) => void;
  onDeleteSet: (setId: string) => void;
}

const PAGE_SIZE = 5;

/**
 * Durum etiketine gore rozet stili dondurur.
 */
function getStatusBadgeClass(status: StockLedgerRow['status']): string {
  if (status === 'Tukendi') return 'bg-rose-100 text-rose-700';
  if (status === 'Kritik') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

/**
 * Kullanima gore kapasite cubugu rengi dondurur.
 */
function getProgressBarClass(usageRate: number): string {
  if (usageRate >= 0.9) return 'bg-rose-500';
  if (usageRate >= 0.55) return 'bg-amber-500';
  return 'bg-primary';
}

/**
 * Canli stok ledger tablosu ve sayfalama alani.
 */
export function StockLedgerTable({
  rows,
  loading,
  onApplySet,
  onUpdateSet,
  onDeleteSet,
}: StockLedgerTableProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, safePage]);

  const rangeStart = rows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(rows.length, safePage * PAGE_SIZE);

  return (
    <section className="overflow-hidden rounded-xl border border-primary/5 bg-white shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/5 bg-slate-50/70 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Canlı Stok Defteri</h2>
          <p className="text-xs text-slate-500">Stok setleri tek ekranda izlenir ve yönetilir.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
            Filtre
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Dışa Aktar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="border-b border-primary/5 px-6 py-4">Set No</th>
              <th className="border-b border-primary/5 px-6 py-4">Set Adı</th>
              <th className="border-b border-primary/5 px-6 py-4">Rulo Sayısı</th>
              <th className="border-b border-primary/5 px-6 py-4">Kapasite Detayi (ton)</th>
              <th className="border-b border-primary/5 px-6 py-4">Kayıt Tarihi</th>
              <th className="border-b border-primary/5 px-6 py-4">Kullanım</th>
              <th className="border-b border-primary/5 px-6 py-4">Durum</th>
              <th className="border-b border-primary/5 px-6 py-4 text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5 text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-sm text-slate-500">
                  Yükleniyor...
                </td>
              </tr>
            ) : pagedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-sm text-slate-500">
                  Görüntülenecek stok seti bulunamadı.
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-6 py-4 font-mono font-medium text-primary">{row.setId.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">
                      {row.setName}
                    </span>
                  </td>
                  <td className="px-6 py-4">{row.rollCount}</td>
                  <td className="w-72 px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>Kullanılan: {row.usedTon}</span>
                        <span>Kalan: {row.remainingTon}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full ${getProgressBarClass(row.usageRate)}`}
                          style={{ width: `${Math.round(row.usageRate * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] italic text-slate-400">Başlangıç: {row.totalTon.toFixed(2)} ton</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{row.createdAtText}</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => onApplySet(row.setId)}
                      className="font-bold text-primary hover:underline"
                    >
                      {row.usageLabel}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadgeClass(row.status)}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateSet(row.setId)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Güncelle
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSet(row.setId)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-primary/5 bg-slate-50/70 px-6 py-4">
        <p className="text-xs font-medium text-slate-500">
          Gösterilen <span className="text-primary">{rangeStart} - {rangeEnd}</span> / {rows.length} set
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage <= 1}
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <span className="flex h-8 min-w-8 items-center justify-center rounded border border-primary bg-primary px-2 text-xs font-bold text-white">
            {safePage}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
}
