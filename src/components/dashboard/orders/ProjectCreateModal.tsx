import {
  formatTonDisplayTr,
  getPriorityBadge,
  getPriorityLabel,
  getStatusIcon,
  getStatusLabel,
  getStatusTextClass,
} from './helpers';
import type { NewOrderForm, OrderPipelineRow } from './types';

interface ProjectCreateModalProps {
  isOpen: boolean;
  isEditMode: boolean;
  setName: string;
  projectCode: string;
  department: string;
  description: string;
  newOrder: NewOrderForm;
  rows: OrderPipelineRow[];
  editingOrderIndex: number | null;
  onSetNameChange: (value: string) => void;
  onProjectCodeChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onNewOrderChange: (updater: (prev: NewOrderForm) => NewOrderForm) => void;
  onAddOrder: () => void;
  onStartEditOrder: (orderIndex: number) => void;
  onDeleteRow: (orderId: string) => void;
  onClose: () => void;
  onSaveProject: () => void;
}

/** Proje oluşturma ve sipariş ekleme işlemlerini tek modalda sunar. */
export function ProjectCreateModal({
  isOpen,
  isEditMode,
  setName,
  projectCode,
  department,
  description,
  newOrder,
  rows,
  editingOrderIndex,
  onSetNameChange,
  onProjectCodeChange,
  onDepartmentChange,
  onDescriptionChange,
  onNewOrderChange,
  onAddOrder,
  onStartEditOrder,
  onDeleteRow,
  onClose,
  onSaveProject,
}: ProjectCreateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#1a2233] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">engineering</span>
            <h3 className="text-lg font-bold tracking-tight text-white">
              {isEditMode ? 'Projeyi Güncelle' : 'Yeni Proje Oluştur'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-300 transition-colors hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Proje Adı <span className="text-primary">*</span>
              </label>
              <input
                value={setName}
                onChange={(event) => onSetNameChange(event.target.value)}
                className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Örn: Q3 Altyapı Yenileme"
                type="text"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Açıklama</label>
              <textarea
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                className="w-full resize-none rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Proje hedefleri ve kapsamı hakkında kısa özet..."
                rows={3}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h4 className="text-sm font-bold text-primary">Yeni Sipariş Ekle</h4>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Sipariş ID</label>
                <p className="mb-1.5 text-xs text-slate-500">Siparişi tanımlayan benzersiz kod (örn. proje kodu veya müşteri referansı)</p>
                <input
                  value={newOrder.id}
                  onChange={(event) => onNewOrderChange((prev) => ({ ...prev, id: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="Örn: ORD-2024-X42"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 items-stretch">
                <div className="flex h-full flex-col">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Talep (m²) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={newOrder.m2 === 0 ? '' : newOrder.m2}
                    onChange={(event) => onNewOrderChange((prev) => ({ ...prev, m2: Number(event.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                    placeholder="Örn. 100"
                  />
                  <p className="mt-1 text-xs text-slate-500">Sipariş toplam alanı, m² (zorunlu)</p>
                </div>
                <div className="flex h-full flex-col">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Genişlik (m) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={newOrder.widthM === 0 ? '' : newOrder.widthM}
                    onChange={(event) => onNewOrderChange((prev) => ({ ...prev, widthM: Number(event.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                    placeholder="Örn. 1"
                  />
                  <p className="mt-1 text-xs text-slate-500">Panel genişliği, metre (zorunlu)</p>
                </div>
                <div className="flex h-full flex-col">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Kesim uzunluğu (m) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={(newOrder.panelLengthM ?? 0) === 0 ? '' : (newOrder.panelLengthM ?? '')}
                    onChange={(event) => onNewOrderChange((prev) => ({ ...prev, panelLengthM: Number(event.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                    placeholder="Örn. 1"
                  />
                  <p className="mt-1 text-xs text-slate-500">Parça başına kesim uzunluğu (zorunlu)</p>
                </div>
                <div className="flex h-full flex-col">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Malzeme <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newOrder.material ?? ''}
                    onChange={(event) => onNewOrderChange((prev) => ({ ...prev, material: event.target.value as NewOrderForm['material'] }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    <option value="">Seçim yapınız</option>
                    <option value="galvaniz">Galvaniz</option>
                    <option value="aluminyum">Alüminyum</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Yoğunluğa göre ağırlık hesaplanır (zorunlu)</p>
                </div>
                <div className="flex h-full flex-col">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Kalınlık (mm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={newOrder.thicknessMm === 0 ? '' : newOrder.thicknessMm}
                    onChange={(event) => onNewOrderChange((prev) => ({ ...prev, thicknessMm: Number(event.target.value) || 0 }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                    placeholder="Örn. 0.75"
                  />
                  <p className="mt-1 text-xs text-slate-500">Malzeme kalınlığı, mm (zorunlu)</p>
                </div>
                <div className="flex h-full flex-col">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Öncelik <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newOrder.priority ?? ''}
                    onChange={(event) => onNewOrderChange((prev) => ({ ...prev, priority: event.target.value as NewOrderForm['priority'] }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    <option value="">Seçim yapınız</option>
                    <option value="Low">Düşük</option>
                    <option value="Medium">Orta</option>
                    <option value="High">Yüksek</option>
                    <option value="Urgent">Acil</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Üretim sıralaması: Düşük → Acil (zorunlu)</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onAddOrder}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
                >
                  {editingOrderIndex != null ? 'Siparişi Güncelle' : 'Siparişi Listeye Ekle'}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="border-b border-slate-100 px-6 py-4">Sipariş ID</th>
                  <th className="border-b border-slate-100 px-6 py-4">Talep (m²)</th>
                  <th className="border-b border-slate-100 px-6 py-4 text-center">Ağırlık</th>
                  <th className="border-b border-slate-100 px-6 py-4 text-center">Öncelik</th>
                  <th className="border-b border-slate-100 px-6 py-4">Durum</th>
                  <th className="border-b border-slate-100 px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-4 text-sm text-slate-500" colSpan={6}>
                      Proje için henüz sipariş eklenmedi.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={`${row.id}-${index}`}>
                      <td className="px-6 py-4 font-bold text-slate-900">{row.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                        {((row.widthMm / 1000) * row.lengthM).toFixed(2)} m²
                      </td>
                      <td className="px-6 py-4 text-center text-sm">{formatTonDisplayTr(row.weightTon)} t</td>
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
                            onClick={() => onStartEditOrder(index)}
                            className="p-1 text-slate-400 hover:text-primary"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRow(row.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={onSaveProject}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {isEditMode ? 'Projeyi Güncelle' : 'Proje Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}
