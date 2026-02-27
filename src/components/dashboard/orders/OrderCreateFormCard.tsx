import type { NewOrderForm } from './types';

interface OrderCreateFormCardProps {
  newOrder: NewOrderForm;
  onNewOrderChange: (updater: (prev: NewOrderForm) => NewOrderForm) => void;
  onAddOrder: () => void;
  onClearForm: () => void;
}

/** Yeni sipariş ekleme form kartını render eder. */
export function OrderCreateFormCard({
  newOrder,
  onNewOrderChange,
  onAddOrder,
  onClearForm,
}: OrderCreateFormCardProps) {
  return (
    <div className="sticky top-24 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <span className="material-symbols-outlined text-primary">edit_note</span>
          Create New Order
        </h3>
      </div>
      <div className="space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Order ID</label>
          <input
            value={newOrder.id}
            onChange={(event) => onNewOrderChange((prev) => ({ ...prev, id: event.target.value }))}
            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
            placeholder="e.g. ORD-2024-001"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Width (mm)</label>
            <input
              type="number"
              value={newOrder.widthMm}
              onChange={(event) => onNewOrderChange((prev) => ({ ...prev, widthMm: Number(event.target.value) }))}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Length (m)</label>
            <input
              type="number"
              value={newOrder.lengthM}
              onChange={(event) => onNewOrderChange((prev) => ({ ...prev, lengthM: Number(event.target.value) }))}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
              title="Toplam şerit uzunluğu (m)"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Panel uzunluğu (m)</label>
            <input
              type="number"
              min={0.01}
              step={0.1}
              value={newOrder.panelLengthM ?? 1}
              onChange={(event) => onNewOrderChange((prev) => ({ ...prev, panelLengthM: Number(event.target.value) || 1 }))}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
              placeholder="1"
              title="Kesim uzunluğu; bu uzunluk ve katları kesilir (örn. 3m → 3*33+1 fire)"
            />
            <p className="mt-1 text-xs text-slate-500">
              Bu uzunluk ve katları şeklinde kesilir (örn. 100 m² rulo 3 m ile → 33 adet 3 m + 1 m fire).
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Weight (ton)</label>
            <input
              type="number"
              step={0.01}
              value={newOrder.weightTon}
              onChange={(event) => onNewOrderChange((prev) => ({ ...prev, weightTon: Number(event.target.value) }))}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Priority</label>
            <select
              value={newOrder.priority}
              onChange={(event) => onNewOrderChange((prev) => ({ ...prev, priority: event.target.value as NewOrderForm['priority'] }))}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onAddOrder}
            className="w-full rounded-lg bg-primary py-3 font-bold text-white shadow-md transition-colors hover:bg-primary/90"
          >
            Save Order
          </button>
          <button
            type="button"
            onClick={onClearForm}
            className="mt-2 w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Clear Form
          </button>
        </div>
      </div>
    </div>
  );
}
