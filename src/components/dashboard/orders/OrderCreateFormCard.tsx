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
          Yeni Sipariş Oluştur
        </h3>
      </div>
      <div className="space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Sipariş No</label>
          <input
            value={newOrder.id}
            onChange={(event) => onNewOrderChange((prev) => ({ ...prev, id: event.target.value }))}
            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
            placeholder="Örn: ORD-2024-001"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Talep (m²)</label>
            <input
              type="number"
              min={1}
              step={1}
              value={newOrder.m2}
              onChange={(event) => onNewOrderChange((prev) => ({ ...prev, m2: Number(event.target.value) || 0 }))}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
              placeholder="100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Genişlik (m)</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={newOrder.widthM}
              onChange={(event) => onNewOrderChange((prev) => ({ ...prev, widthM: Number(event.target.value) || 1 }))}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
              placeholder="1"
              title="Panel genişliği, metre"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Kesim uzunluğu (m)</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={newOrder.panelLengthM ?? 1}
              onChange={(event) => onNewOrderChange((prev) => ({ ...prev, panelLengthM: Number(event.target.value) || 1 }))}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
              placeholder="1"
              title="Kesim uzunluğu; bu uzunluk ve katları kesilir"
            />
            <p className="mt-1 text-xs text-slate-500">
              Bu uzunluk ve katları şeklinde kesilir. Ağırlık malzeme ve kalınlığa göre hesaplanır.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Malzeme</label>
            <select
              value={newOrder.material}
              onChange={(event) => onNewOrderChange((prev) => ({ ...prev, material: event.target.value as NewOrderForm['material'] }))}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
            >
              <option value="galvaniz">Galvaniz</option>
              <option value="aluminyum">Alüminyum</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Kalınlık (mm)</label>
            <input
              type="number"
              min={0.1}
              step={0.01}
              value={newOrder.thicknessMm}
              onChange={(event) => onNewOrderChange((prev) => ({ ...prev, thicknessMm: Number(event.target.value) || 0.75 }))}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
              placeholder="0.75"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Öncelik</label>
            <select
              value={newOrder.priority}
              onChange={(event) => onNewOrderChange((prev) => ({ ...prev, priority: event.target.value as NewOrderForm['priority'] }))}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm"
            >
              <option value="Low">Düşük</option>
              <option value="Medium">Orta</option>
              <option value="High">Yüksek</option>
              <option value="Urgent">Acil</option>
            </select>
          </div>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onAddOrder}
            className="w-full rounded-lg bg-primary py-3 font-bold text-white shadow-md transition-colors hover:bg-primary/90"
          >
            Siparişi Kaydet
          </button>
          <button
            type="button"
            onClick={onClearForm}
            className="mt-2 w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Formu Temizle
          </button>
        </div>
      </div>
    </div>
  );
}
