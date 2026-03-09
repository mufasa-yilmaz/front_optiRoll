'use client';

import type { Order } from '@/lib/api';

export interface OrdersSelectCardProps {
  /** Orders tablosundan gelen Pending siparişler */
  orders: Order[];
  /** Seçili sipariş ID'leri */
  selectedIds: Set<string>;
  /** Seçim değiştiğinde çağrılır */
  onSelectionChange: (selectedIds: Set<string>) => void;
  /** Hata durumu */
  hasError?: boolean;
  /** Doğrulama blink key */
  blinkValidationKey?: number;
}

/**
 * Sipariş çoklu seçim kartı. Checkbox'larla orders tablosundan sipariş seçimi.
 */
export function OrdersSelectCard({
  orders,
  selectedIds,
  onSelectionChange,
  hasError,
  blinkValidationKey,
}: OrdersSelectCardProps) {
  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  function toggleAll() {
    if (selectedIds.size === orders.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(orders.map((o) => o.id)));
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-primary mb-2">Siparişler</h2>
        <p className="text-sm text-slate-500">
          Bekleyen sipariş yok. Önce sipariş sayfasından sipariş ekleyin.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden ${
        hasError ? 'border-red-300 animate-pulse' : 'border-slate-200 bg-white'
      }`}
      key={hasError ? `orders-select-${blinkValidationKey}` : 'orders-select'}
    >
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary">Siparişlerden Seçin</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{selectedIds.size} / {orders.length} seçili</span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            {selectedIds.size === orders.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
          </button>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="w-12 px-4 py-2" />
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Sipariş No</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">m²</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">Genişlik</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">Kesim Uz.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr
                key={order.id}
                className={`hover:bg-slate-50 cursor-pointer ${selectedIds.has(order.id) ? 'bg-primary/5' : ''}`}
                onClick={() => toggle(order.id)}
              >
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(order.id)}
                    onChange={() => toggle(order.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-4 py-2 font-medium">{order.order_id || order.id.slice(0, 8)}</td>
                <td className="px-4 py-2 text-right">{Number(order.m2).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{Number(order.panel_width).toFixed(2)} m</td>
                <td className="px-4 py-2 text-right">{Number(order.panel_length ?? 1).toFixed(2)} m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
