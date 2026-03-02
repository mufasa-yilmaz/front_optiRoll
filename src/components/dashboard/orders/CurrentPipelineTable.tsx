import { getPriorityBadge, getPriorityLabel, getStatusIcon, getStatusLabel, getStatusTextClass } from './helpers';
import type { OrderPipelineRow } from './types';

interface CurrentPipelineTableProps {
  rows: OrderPipelineRow[];
  search: string;
  selectedSetName?: string | null;
  onSearchChange: (value: string) => void;
  onDeleteRow: (orderId: string) => void;
  onAddOrderClick: () => void;
}

/** Mevcut sipariş pipeline tablosunu render eder. */
export function CurrentPipelineTable({
  rows,
  search,
  selectedSetName,
  onSearchChange,
  onDeleteRow,
  onAddOrderClick,
}: CurrentPipelineTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 p-6">
        <div className="flex w-full flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-bold">
              Mevcut Pipeline
              <span className="ml-2 text-sm font-normal text-slate-400">
                (Seçili Set: {selectedSetName || '-'})
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onAddOrderClick}
              className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/5"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Yeni Sipariş Ekle
            </button>
            <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
              <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <span className="material-symbols-outlined text-xl">filter_list</span>
              </button>
              <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <span className="material-symbols-outlined text-xl">download</span>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-3 relative w-full max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">search</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Sipariş ara..."
            className="w-full rounded-lg border-none bg-slate-100 py-2 pl-9 pr-4 text-sm"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <th className="border-b border-slate-100 px-6 py-4">Sipariş No</th>
              <th className="border-b border-slate-100 px-6 py-4">Boyutlar</th>
              <th className="border-b border-slate-100 px-6 py-4 text-center">Ağırlık</th>
              <th className="border-b border-slate-100 px-6 py-4 text-center">Öncelik</th>
              <th className="border-b border-slate-100 px-6 py-4">Durum</th>
              <th className="border-b border-slate-100 px-6 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-sm text-slate-500" colSpan={6}>
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900">{row.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.widthMm} x {row.lengthM} m</td>
                  <td className="px-6 py-4 text-center text-sm">{row.weightTon.toFixed(2)} t</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${getPriorityBadge(row.priority)}`}>
                      {getPriorityLabel(row.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 ${getStatusTextClass(row.status)}`}>
                      <span className="material-symbols-outlined text-sm">{getStatusIcon(row.status)}</span>
                      <span className="text-xs font-semibold">{getStatusLabel(row.status)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteRow(row.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                      title="Sil"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
