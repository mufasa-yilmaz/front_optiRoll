'use client';

/** Sipariş satırı veri tipi */
export type OrderRow = {
  id: string;
  demandSqm?: number;
  demandTon?: number;
  m2: number;
  panelWidth: number;
  /** Panel kesim uzunluğu (m); bu uzunluk ve katları kesilir (örn. 3m → 3*33+1 fire) */
  panelLength?: number;
};

/** Hazır sipariş seti (liste seçimi için) */
export type OrderSetOption = {
  id: string;
  name: string;
  orders?: { m2: number; panelWidth: number; panelLength?: number }[];
};

export interface OrdersSummaryCardProps {
  /** Sipariş listesi */
  orders: OrderRow[];
  /** Sipariş değişikliği callback'i - verildiğinde kart düzenlenebilir olur */
  onOrdersChange?: (orders: OrderRow[]) => void;
  /** Talep (ton) hesaplaması için kalınlık (mm) - opsiyonel */
  thickness?: number;
  /** Talep (ton) hesaplaması için yoğunluk (kg/m³) - opsiyonel */
  density?: number;
  /** Hazır sipariş setleri - verilirse Siparişler bölümünde dropdown gösterilir */
  orderSets?: OrderSetOption[];
  /** Seçili hazır sipariş seti id */
  selectedOrderSetId?: string;
  /** Hazır sipariş seti seçildiğinde çağrılır */
  onOrderSetSelect?: (setId: string) => void;
}

/** Benzersiz sipariş ID üretir */
function nextOrderId(orders: OrderRow[]): string {
  const nums = orders
    .map((o) => parseInt(o.id.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `S${max + 1}`;
}

/**
 * Sipariş giriş kartı: siparişleri ekle, düzenle veya sil.
 * onOrdersChange verilirse düzenlenebilir, aksi halde salt okunur görüntü.
 */
export function OrdersSummaryCard({
  orders,
  onOrdersChange,
  thickness = 0.75,
  density = 7850,
  orderSets = [],
  selectedOrderSetId = '',
  onOrderSetSelect,
}: OrdersSummaryCardProps) {
  const formatNumber = (n: number, decimals = 2) =>
    n.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const densityGcm3 = density / 1000;
  const showOrderSetSelect = orderSets.length > 0 && onOrderSetSelect;

  const addOrder = () => {
    if (!onOrdersChange) return;
    const newId = nextOrderId(orders);
    onOrdersChange([...orders, { id: newId, m2: 100, panelWidth: 1, panelLength: 1 }]);
  };

  const removeOrder = (index: number) => {
    if (!onOrdersChange) return;
    onOrdersChange(orders.filter((_, i) => i !== index));
  };

  const updateOrder = (index: number, field: 'm2' | 'panelWidth' | 'panelLength', value: number) => {
    if (!onOrdersChange) return;
    const next = [...orders];
    next[index] = { ...next[index], [field]: Math.max(0.01, value) };
    onOrdersChange(next);
  };

  const editable = !!onOrdersChange;

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-grow flex flex-col min-h-[300px] transition-shadow hover:shadow-md duration-300 animate-fade-in-up [animation-fill-mode:both]"
      style={{ animationDelay: '200ms' }}
    >
      <div className="px-6 py-4 border-b border-slate-100 bg-third/50">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-bold text-primary font-display">Siparişler</h2>
          <div className="flex gap-3 items-center flex-wrap">
            <span className="text-xs font-medium text-slate-400">
              {orders.length} sipariş
            </span>
            {showOrderSetSelect && (
              <select
                value={selectedOrderSetId}
                onChange={(e) => onOrderSetSelect(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:border-secondary focus:ring-1 focus:ring-secondary/30"
                title="Hazır sipariş seti seç"
              >
                <option value="">Hazır Sipariş Seti Seç</option>
                {orderSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({(s.orders || []).length} sipariş)
                  </option>
                ))}
              </select>
            )}
            {editable && (
              <button
                type="button"
                onClick={addOrder}
                className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Sipariş Ekle
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 max-h-[min(60vh,480px)]">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                scope="col"
              >
                Sipariş
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                scope="col"
              >
                Talep (m²)
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                scope="col"
              >
                Panel Genişliği (m)
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                scope="col"
              >
                Kesim Uzunluğu (m)
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                scope="col"
              >
                Talep (ton)
              </th>
              {editable && (
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-12" scope="col" />
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={editable ? 6 : 5} className="px-6 py-8 text-center">
                  <p className="text-sm text-slate-500">
                    {editable
                      ? 'Sipariş eklemek için "Sipariş Ekle" butonuna tıklayın'
                      : 'Henüz sipariş yok'}
                  </p>
                </td>
              </tr>
            ) : (
              orders.map((order, i) => {
                const pw = order.panelWidth || 1;
                const pl = order.panelLength ?? 1;
                const panelCount = Math.max(1, Math.round(order.m2 / (pw * pl)));
                const effectiveM2 = panelCount * pw * pl;
                const demandTon = effectiveM2 * (thickness / 1000) * densityGcm3;
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-third/50 transition-colors duration-200 group"
                  >
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-primary font-mono">
                      #{order.id}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 text-right">
                      {editable ? (
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={order.m2}
                          onChange={(e) =>
                            updateOrder(i, 'm2', parseFloat(e.target.value) || 1)
                          }
                          className="w-24 text-right rounded border border-slate-300 py-1.5 px-2 text-sm font-mono"
                        />
                      ) : (
                        <span className="font-mono">{formatNumber(order.m2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 text-right">
                      {editable ? (
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={order.panelWidth}
                          onChange={(e) =>
                            updateOrder(i, 'panelWidth', parseFloat(e.target.value) || 0.01)
                          }
                          className="w-20 text-right rounded border border-slate-300 py-1.5 px-2 text-sm font-mono"
                        />
                      ) : (
                        <span className="font-mono">{formatNumber(order.panelWidth)}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 text-right">
                      {editable ? (
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={order.panelLength ?? 1}
                          onChange={(e) =>
                            updateOrder(i, 'panelLength', parseFloat(e.target.value) || 0.01)
                          }
                          className="w-20 text-right rounded border border-slate-300 py-1.5 px-2 text-sm font-mono"
                          title="Kesim uzunluğu (m); bu uzunluk ve katları kesilir"
                        />
                      ) : (
                        <span className="font-mono">{formatNumber(order.panelLength ?? 1)}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 text-right font-mono">
                      {formatNumber(demandTon)}
                    </td>
                    {editable && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeOrder(i)}
                          className="p-1 text-slate-400 hover:text-accent-red rounded"
                          title="Siparişi kaldır"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
