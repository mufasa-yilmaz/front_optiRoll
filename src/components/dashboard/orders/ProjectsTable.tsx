import type { SavedOrderSet } from '@/lib/api';
import { formatOrderSetDate, fromApiOrderRow, getProjectProgress } from './helpers';
import { getPriorityBadge, getPriorityLabel, getStatusIcon, getStatusLabel, getStatusTextClass } from './helpers';
import type { OrderPipelineRow } from './types';

interface ProjectsTableProps {
  loading: boolean;
  sets: SavedOrderSet[];
  expandedSetId: string | null;
  onToggleExpanded: (setId: string) => void;
  onApplySet: (setItem: SavedOrderSet) => void;
  onDeleteSet: (setItem: SavedOrderSet) => void;
  onAddOrderToProject: (setItem: SavedOrderSet) => void;
  onEditProjectOrder: (setItem: SavedOrderSet, orderIndex: number) => void;
  onDeleteProjectOrder: (setItem: SavedOrderSet, orderIndex: number) => void;
}

/** Kayıtlı sipariş setlerini proje görünümünde tablo halinde listeler. */
export function ProjectsTable({
  loading,
  sets,
  expandedSetId,
  onToggleExpanded,
  onApplySet,
  onDeleteSet,
  onAddOrderToProject,
  onEditProjectOrder,
  onDeleteProjectOrder,
}: ProjectsTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="w-12 px-4 py-4" />
            <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Proje No</th>
            <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Proje Adı</th>
            <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Oluşturulma Tarihi</th>
            <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">İlerleme</th>
            <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>
                Yükleniyor...
              </td>
            </tr>
          ) : sets.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>
                Henüz kayıtlı sipariş seti yok.
              </td>
            </tr>
          ) : (
            sets.map((setItem, index) => {
              const isExpanded = expandedSetId === setItem.id;
              const progress = getProjectProgress(setItem, index);
              return (
                <FragmentRow
                  key={setItem.id}
                  setItem={setItem}
                  progress={progress}
                  isExpanded={isExpanded}
                  onToggleExpanded={onToggleExpanded}
                  onApplySet={onApplySet}
                  onDeleteSet={onDeleteSet}
                  onAddOrderToProject={onAddOrderToProject}
                  onEditProjectOrder={onEditProjectOrder}
                  onDeleteProjectOrder={onDeleteProjectOrder}
                />
              );
            })
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
        <span className="text-sm text-slate-500">Toplam {sets.length} proje listeleniyor</span>
        <div className="flex gap-2">
          <button type="button" className="rounded border border-slate-200 bg-white px-3 py-1 text-sm font-semibold">Önceki</button>
          <button type="button" className="rounded border border-primary bg-primary px-3 py-1 text-sm font-semibold text-white">1</button>
          <button type="button" className="rounded border border-slate-200 bg-white px-3 py-1 text-sm font-semibold">Sonraki</button>
        </div>
      </div>
    </section>
  );
}

interface FragmentRowProps {
  setItem: SavedOrderSet;
  progress: number;
  isExpanded: boolean;
  onToggleExpanded: (setId: string) => void;
  onApplySet: (setItem: SavedOrderSet) => void;
  onDeleteSet: (setItem: SavedOrderSet) => void;
  onAddOrderToProject: (setItem: SavedOrderSet) => void;
  onEditProjectOrder: (setItem: SavedOrderSet, orderIndex: number) => void;
  onDeleteProjectOrder: (setItem: SavedOrderSet, orderIndex: number) => void;
}

/** Tek proje satırı ve açılır sipariş detay bölümünü render eder. */
function FragmentRow({
  setItem,
  progress,
  isExpanded,
  onToggleExpanded,
  onApplySet,
  onDeleteSet,
  onAddOrderToProject,
  onEditProjectOrder,
  onDeleteProjectOrder,
}: FragmentRowProps) {
  /** Proje silme: onay sonrası onDeleteSet çağrılır. */
  function handleDeleteProject() {
    if (!window.confirm(`"${setItem.name}" projesini silmek istediğinize emin misiniz?`)) return;
    onDeleteSet(setItem);
  }

  /** API sipariş satırını pipeline satır modeline dönüştürür. */
  function toPipelineRow(
    order: { orderId?: string; m2: number; panelWidth: number; panelLength?: number },
    index: number,
  ): OrderPipelineRow {
    return fromApiOrderRow(order, index);
  }

  return (
    <>
      <tr className="group cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50">
        <td className="px-4 py-5 text-center">
          <button type="button" onClick={() => onToggleExpanded(setItem.id)} className="inline-flex">
            <span className="material-symbols-outlined text-slate-400 transition-colors group-hover:text-primary">
              {isExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
            </span>
          </button>
        </td>
        <td className="px-4 py-5 font-mono text-sm font-semibold text-slate-900">{setItem.id.slice(0, 10)}</td>
        <td className="px-4 py-5 font-medium">{setItem.name}</td>
        <td className="px-4 py-5 text-sm text-slate-500">{formatOrderSetDate(setItem.created_at)}</td>
        <td className="px-4 py-5">
          <div className="flex items-center justify-end gap-3">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-600">{progress}%</span>
          </div>
        </td>
        <td className="px-4 py-5 text-right">
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddOrderToProject(setItem);
              }}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
              aria-label="Projeyi düzenle"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteProject();
              }}
              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Projeyi sil"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50">
          <td className="p-0" colSpan={6}>
            <div className="border-b border-slate-100 px-12 py-6">
              <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-primary">İlişkili Siparişler</h4>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <th className="border-b border-slate-100 px-6 py-4">Sipariş ID</th>
                      <th className="border-b border-slate-100 px-6 py-4">Talep (m²)</th>
                      <th className="border-b border-slate-100 px-6 py-4 text-center">Ağırlık</th>
                      <th className="border-b border-slate-100 px-6 py-4 text-center">Öncelik</th>
                      <th className="border-b border-slate-100 px-6 py-4">Sipariş Durumu</th>
                      <th className="border-b border-slate-100 px-6 py-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(setItem.orders || []).map((order, orderIdx) => {
                      const row = toPipelineRow(order, orderIdx);
                      return (
                        <tr key={`${setItem.id}-${orderIdx}`} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{row.id}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                            {((row.widthMm / 1000) * row.lengthM).toFixed(2)} m²
                          </td>
                          <td className="px-6 py-4 text-sm text-center">{row.weightTon.toFixed(2)} t</td>
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
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => onEditProjectOrder(setItem, orderIdx)}
                                className="p-1 text-slate-400 hover:text-primary"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteProjectOrder(setItem, orderIdx)}
                                className="p-1 text-slate-400 hover:text-red-600"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(setItem.orders || []).length === 0 && (
                      <tr>
                        <td className="px-6 py-4 text-sm text-slate-500" colSpan={6}>
                          Bu projeye bağlı sipariş yok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onAddOrderToProject(setItem)}
                  className="rounded border border-primary/30 px-3 py-1.5 text-xs text-primary hover:bg-primary/5"
                >
                  Projeye Yeni Sipariş Ekle
                </button>
                {/* <button
                  type="button"
                  onClick={() => onApplySet(setItem)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100"
                >
                  Seti Yükle
                </button> */}
                <button
                  type="button"
                  onClick={() => onDeleteSet(setItem)}
                  className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  Projeyi Sil
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
