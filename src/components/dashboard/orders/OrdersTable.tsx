'use client';

import { useState } from 'react';
import type { Order } from '@/lib/api';
import { getStatusLabel, getStatusTextClass } from './helpers';

/** Tabloda seçilebilir sipariş durumları */
const ORDER_STATUSES = ['Pending', 'Optimized', 'In Production'] as const;
type OrderStatusOption = (typeof ORDER_STATUSES)[number];

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  /** Tablodan durum değiştirildiğinde çağrılır (dropdown ile). */
  onStatusChange?: (order: Order, newStatus: string) => void | Promise<void>;
  /** Toolbar’daki "Yeni Sipariş Ekle" butonu tıklandığında çağrılır (StockRollsTable ile aynı tasarım). */
  onAddOrder?: () => void;
  /** Verilirse çoklu seçim ve "Seçilenleri sil" gösterilir. */
  onDeleteOrders?: (orders: Order[]) => void | Promise<void>;
}

/**
 * Sipariş listesi tablosu. Proje kavramı olmadan doğrudan sipariş satırları gösterir.
 * Durum sütununda dropdown ile güncelleme yapılabilir.
 */
export function OrdersTable({ orders, loading, onEdit, onDelete, onStatusChange, onAddOrder, onDeleteOrders }: OrdersTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === orders.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(orders.map((o) => o.id)));
  };

  const selectedOrders = orders.filter((o) => selectedIds.has(o.id));
  const hasSelection = selectedIds.size > 0;

  function formatDate(value?: string | null): string {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('tr-TR');
  }

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const productionCount = orders.filter((o) => o.status === 'In Production').length;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-primary/5 bg-white shadow-md">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-primary/5 bg-slate-50/70 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Siparişler</h2>
          <p className="text-xs text-slate-500">
            Toplam {orders.length} sipariş
            {orders.length > 0 && (
              <> · {pendingCount} beklemede, {productionCount} üretimde</>
            )}
            {hasSelection && ` · ${selectedIds.size} seçili`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onDeleteOrders && hasSelection && (
            <button
              type="button"
              onClick={async () => {
                if (selectedOrders.length === 0) return;
                await onDeleteOrders(selectedOrders);
                setSelectedIds(new Set());
              }}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
              Seçilenleri sil ({selectedIds.size})
            </button>
          )}
          {onAddOrder && (
          <button
            type="button"
            onClick={onAddOrder}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Yeni Sipariş Ekle
          </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-[800px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {onDeleteOrders && (
                <th className="w-12 border-b border-primary/5 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedIds.size === orders.length}
                    onChange={toggleAll}
                    className="rounded border-slate-300"
                    aria-label="Tümünü seç"
                  />
                </th>
              )}
              <th className="border-b border-primary/5 px-6 py-4">Sipariş adı</th>
              <th className="border-b border-primary/5 px-6 py-4">m²</th>
              <th className="border-b border-primary/5 px-6 py-4">Genişlik (m)</th>
              <th className="border-b border-primary/5 px-6 py-4">Kesim Uzunluğu</th>
              <th className="border-b border-primary/5 px-6 py-4">Konum</th>
              <th className="border-b border-primary/5 px-6 py-4">Bitiş Tarihi</th>
              <th className="border-b border-primary/5 px-6 py-4">Durum</th>
              <th className="border-b border-primary/5 px-6 py-4 text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5 text-sm">
            {loading ? (
              <tr>
                <td colSpan={onDeleteOrders ? 9 : 8} className="px-6 py-8 text-sm text-slate-500">
                  Yükleniyor...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={onDeleteOrders ? 9 : 8} className="px-6 py-8 text-center text-slate-500">
                  Henüz sipariş yok. Yeni sipariş ekleyin.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className={`hover:bg-slate-50/50 ${selectedIds.has(order.id) ? 'bg-primary/5' : ''}`}>
                  {onDeleteOrders && (
                    <td className="w-12 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleOne(order.id)}
                        className="rounded border-slate-300"
                        aria-label={`Sipariş ${order.order_id ?? order.id} seç`}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {order.order_id || order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4">{Number(order.m2).toFixed(2)}</td>
                  <td className="px-6 py-4">{Number(order.panel_width).toFixed(2)}</td>
                  <td className="px-6 py-4">{Number(order.panel_length ?? 1).toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-600">{order.il || '-'}</td>
                  <td className="px-6 py-4">{formatDate(order.bitis_tarihi)}</td>
                  <td className="px-6 py-4">
                    {onStatusChange ? (
                      <select
                        value={ORDER_STATUSES.includes(order.status as OrderStatusOption) ? order.status : 'Pending'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          if (newStatus === order.status) return;
                          setUpdatingId(order.id);
                          try {
                            await onStatusChange(order, newStatus);
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                        disabled={updatingId === order.id}
                        className={`min-w-[140px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 ${getStatusTextClass((order.status as OrderStatusOption) || 'Pending')}`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {getStatusLabel(s)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`font-medium ${getStatusTextClass(order.status as 'Pending' | 'Optimized' | 'In Production')}`}>
                        {getStatusLabel(order.status as 'Pending' | 'Optimized' | 'In Production')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(order)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(order)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
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
    </section>
  );
}
