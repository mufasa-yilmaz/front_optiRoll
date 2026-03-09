'use client';

import { useRef, useEffect, useState } from 'react';
import type { Order } from '@/lib/api';

export interface OrdersSelectDropdownProps {
  /** Orders tablosundan gelen Pending siparişler */
  orders: Order[];
  /** Seçili sipariş ID'leri */
  selectedIds: Set<string>;
  /** Seçim değiştiğinde çağrılır */
  onSelectionChange: (selectedIds: Set<string>) => void;
  /** Hata durumu (buton etrafında vurgu) */
  hasError?: boolean;
  /** Dropdown buton metni */
  label?: string;
}

/** UUID veya uzun id'yi tabloda kısa göstermek için kısaltır; sayfa genişlemesin diye. */
function shortId(id: string, orderId?: string | null): string {
  if (orderId && orderId.trim()) return orderId;
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

/**
 * Sipariş seçim dropdown'ı. Sağ üstte buton; tıklanınca açılan panelde checkbox listesi.
 * Tabloda tam ID göstermez, kısa etiket kullanır.
 */
export function OrdersSelectDropdown({
  orders,
  selectedIds,
  onSelectionChange,
  hasError,
  label = 'Siparişlerden seç',
}: OrdersSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /** Dışarı tıklanınca dropdown'ı kapatır. */
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const el = e.target as Node;
      if (panelRef.current?.contains(el) || buttonRef.current?.contains(el)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

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
      <span className="text-xs text-slate-500">
        Bekleyen sipariş yok. Önce sipariş sayfasından sipariş ekleyin.
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
          hasError ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="material-symbols-outlined text-lg">list</span>
        {label}
        <span className="text-slate-500">({selectedIds.size}/{orders.length})</span>
        <span className={`material-symbols-outlined text-lg transition ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 min-w-[280px] max-h-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3 py-2">
            <span className="text-xs font-medium text-slate-600">Sipariş seçin</span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              {selectedIds.size === orders.length ? 'Tümünü kaldır' : 'Tümünü seç'}
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {orders.map((order) => (
              <label
                key={order.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50 ${
                  selectedIds.has(order.id) ? 'bg-primary/5' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(order.id)}
                  onChange={() => toggle(order.id)}
                  className="rounded border-slate-300 text-primary focus:ring-primary/20"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800" title={order.id}>
                  {shortId(order.id, order.order_id)}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {Number(order.m2).toFixed(0)} m² · {Number(order.panel_width).toFixed(2)} m
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
