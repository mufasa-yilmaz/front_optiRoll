import { getPriorityBadge, getStatusIcon, getStatusTextClass } from './helpers';
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
              {isEditMode ? 'Update Project' : 'Create New Project'}
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
                Project Name <span className="text-primary">*</span>
              </label>
              <input
                value={setName}
                onChange={(event) => onSetNameChange(event.target.value)}
                className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., Q3 Infrastructure Upgrade"
                type="text"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Project Code</label>
              <input
                value={projectCode}
                onChange={(event) => onProjectCodeChange(event.target.value)}
                className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., PRJ-2024-001"
                type="text"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Department</label>
              <select
                value={department}
                onChange={(event) => onDepartmentChange(event.target.value)}
                className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option>Engineering</option>
                <option>Logistics</option>
                <option>Quality Assurance</option>
                <option>Safety</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                className="w-full resize-none rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Provide a high-level summary of project goals and scope..."
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
                <input
                  value={newOrder.id}
                  onChange={(event) => onNewOrderChange((prev) => ({ ...prev, id: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="Örn: ORD-2024-X42"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
                <input
                  type="number"
                  value={newOrder.widthMm}
                  onChange={(event) => onNewOrderChange((prev) => ({ ...prev, widthMm: Number(event.target.value) }))}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="Genişlik (mm)"
                />
                <input
                  type="number"
                  value={newOrder.lengthM}
                  onChange={(event) => onNewOrderChange((prev) => ({ ...prev, lengthM: Number(event.target.value) }))}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="Uzunluk (m)"
                />
                <input
                  type="number"
                  min={0.01}
                  step={0.1}
                  value={newOrder.panelLengthM ?? 1}
                  onChange={(event) => onNewOrderChange((prev) => ({ ...prev, panelLengthM: Number(event.target.value) || 1 }))}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="Panel uzunluğu (m)"
                  title="Kesim uzunluğu"
                />
                <input
                  type="number"
                  step={0.01}
                  value={newOrder.weightTon}
                  onChange={(event) => onNewOrderChange((prev) => ({ ...prev, weightTon: Number(event.target.value) }))}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="Ağırlık (ton)"
                />
                <select
                  value={newOrder.priority}
                  onChange={(event) => onNewOrderChange((prev) => ({ ...prev, priority: event.target.value as NewOrderForm['priority'] }))}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
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
                    <td className="px-6 py-4 text-sm text-slate-500" colSpan={6}>
                      Proje için henüz sipariş eklenmedi.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={`${row.id}-${index}`}>
                      <td className="px-6 py-4 font-bold text-slate-900">{row.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {row.widthMm} × {row.lengthM} m
                        {(row.panelLengthM ?? 1) !== 1 && (
                          <span className="ml-1 text-slate-500">(kesim: {row.panelLengthM} m)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm">{row.weightTon.toFixed(2)} t</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${getPriorityBadge(row.priority)}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 ${getStatusTextClass(row.status)}`}>
                          <span className="material-symbols-outlined text-sm">{getStatusIcon(row.status)}</span>
                          <span className="text-xs font-semibold">{row.status}</span>
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
            Cancel
          </button>
          <button
            type="button"
            onClick={onSaveProject}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {isEditMode ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
