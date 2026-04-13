'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Order } from '@/lib/api';

/** Modal alt kısmı: sadece kapat veya taslak seçimi onayla / iptal. */
export type OrdersSelectModalFooterMode = 'closeOnly' | 'append';

export interface OrdersSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  /** append: "Seçilenleri tabloya ekle" + İptal; closeOnly: sadece Kapat */
  footerMode?: OrdersSelectModalFooterMode;
  /** footerMode append iken çağrılır; çağıran siparişleri birleştirip modalı kapatmalı */
  onAppendConfirm?: () => void;
}

/** UUID veya sipariş adını tabloda kısaltır. */
function shortId(id: string, orderId?: string | null): string {
  if (orderId && orderId.trim()) return orderId.length > 24 ? `${orderId.slice(0, 22)}…` : orderId;
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

/** ISO veya tarih stringini sıralama için zaman damgasına çevirir; yoksa 0. */
function parseSortTime(value: string | null | undefined): number {
  if (value == null || String(value).trim() === '') return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

/** Tarihi kısa Türkçe metin olarak gösterir. */
function formatDateDisplay(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '—';
  const t = Date.parse(value);
  if (Number.isNaN(t)) return String(value).slice(0, 10);
  return new Date(t).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Arama metni sipariş kaydında geçiyor mu kontrol eder (büyük/küçük harf yok sayar). */
function orderMatchesQuery(order: Order, q: string): boolean {
  if (!q.trim()) return true;
  const n = q.trim().toLowerCase();
  const parts = [
    order.id,
    order.order_id ?? '',
    order.il ?? '',
    order.aciklama ?? '',
    order.status ?? '',
    String(order.m2 ?? ''),
    String(order.panel_width ?? ''),
    String(order.panel_length ?? ''),
  ];
  return parts.some((p) => p.toLowerCase().includes(n));
}

export type OrdersSortKey = 'created_at' | 'bitis_tarihi' | 'm2';

/**
 * Bekleyen siparişleri detaylı tablo, metin araması ve sıralama ile gösteren modal.
 * Seçim üst bileşen tarafından kontrol edilir.
 */
export function OrdersSelectModal({
  isOpen,
  onClose,
  orders,
  selectedIds,
  onSelectionChange,
  footerMode = 'closeOnly',
  onAppendConfirm,
}: OrdersSelectModalProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<OrdersSortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  /** Modal her açıldığında filtre/sıra alanlarını sıfırlar (append taslakları üst bileşende). */
  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setSortKey('created_at');
    setSortDir('desc');
  }, [isOpen]);

  const filteredSorted = useMemo(() => {
    const list = orders.filter((o) => orderMatchesQuery(o, search));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortKey === 'm2') {
        return (Number(a.m2) - Number(b.m2)) * dir;
      }
      const ta = sortKey === 'bitis_tarihi' ? parseSortTime(a.bitis_tarihi) : parseSortTime(a.created_at);
      const tb = sortKey === 'bitis_tarihi' ? parseSortTime(b.bitis_tarihi) : parseSortTime(b.created_at);
      return (ta - tb) * dir;
    });
  }, [orders, search, sortKey, sortDir]);

  /** Tek sipariş satırının seçimini aç/kapa yapar. */
  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  /** Görünen (filtrelenmiş) listedeki tüm siparişleri seçer veya kaldırır. */
  function toggleAllVisible() {
    const visibleIds = filteredSorted.map((o) => o.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      visibleIds.forEach((id) => next.delete(id));
    } else {
      visibleIds.forEach((id) => next.add(id));
    }
    onSelectionChange(next);
  }

  /** ESC ile kapatma */
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const visibleAllSelected =
    filteredSorted.length > 0 && filteredSorted.every((o) => selectedIds.has(o.id));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-select-modal-title"
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#1a2233] px-4 py-3 sm:px-6 sm:py-4">
          <h3 id="orders-select-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-white">
            Sipariş seçimi
          </h3>
          <button type="button" onClick={onClose} className="text-slate-300 hover:text-white" aria-label="Kapat">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80 sm:px-6">
          <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
            Tarih ve m²&apos;ye göre sıralayın; metin ile arayın. Tablodan işaretleyerek seçin.
          </p>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Ara (ad, il, açıklama, id…)
              </label>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Metin ara…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Sırala
                </label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as OrdersSortKey)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="created_at">Kayıt tarihi</option>
                  <option value="bitis_tarihi">Bitiş / teslim tarihi</option>
                  <option value="m2">Talep (m²)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Yön
                </label>
                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="desc">Azalan</option>
                  <option value="asc">Artan</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {filteredSorted.length} / {orders.length} kayıt gösteriliyor · {selectedIds.size} seçili
            </span>
            <button
              type="button"
              onClick={toggleAllVisible}
              className="font-medium text-primary hover:underline dark:text-primary/90"
            >
              {visibleAllSelected ? 'Görünenlerin seçimini kaldır' : 'Görünenlerin tümünü seç'}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
              <tr>
                <th scope="col" className="w-10 px-2 py-2 text-left">
                  <span className="sr-only">Seç</span>
                </th>
                <th scope="col" className="px-2 py-2 text-left text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Sipariş
                </th>
                <th scope="col" className="px-2 py-2 text-right text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  m²
                </th>
                <th scope="col" className="hidden sm:table-cell px-2 py-2 text-right text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Panel (m)
                </th>
                <th scope="col" className="hidden md:table-cell px-2 py-2 text-left text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  İl
                </th>
                <th scope="col" className="hidden lg:table-cell px-2 py-2 text-left text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Bitiş
                </th>
                <th scope="col" className="hidden lg:table-cell px-2 py-2 text-left text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Kayıt
                </th>
                <th scope="col" className="hidden xl:table-cell max-w-[140px] px-2 py-2 text-left text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Açıklama
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                    Filtrelere uyan sipariş yok.
                  </td>
                </tr>
              ) : (
                filteredSorted.map((order) => (
                  <tr
                    key={order.id}
                    className={selectedIds.has(order.id) ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                  >
                    <td className="px-2 py-2 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggle(order.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary/20"
                        aria-label={`Seç: ${shortId(order.id, order.order_id)}`}
                      />
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <div className="font-medium text-slate-900 dark:text-slate-100" title={order.order_id || order.id}>
                        {shortId(order.id, order.order_id)}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500" title={order.id}>
                        {order.id.length > 14 ? `${order.id.slice(0, 12)}…` : order.id}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200">
                      {Number(order.m2).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="hidden sm:table-cell px-2 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {Number(order.panel_width).toFixed(2)} × {Number(order.panel_length ?? 0).toFixed(2)}
                    </td>
                    <td className="hidden md:table-cell px-2 py-2 text-slate-600 dark:text-slate-300">{order.il?.trim() || '—'}</td>
                    <td className="hidden lg:table-cell px-2 py-2 text-slate-600 dark:text-slate-300">
                      {formatDateDisplay(order.bitis_tarihi)}
                    </td>
                    <td className="hidden lg:table-cell px-2 py-2 text-slate-600 dark:text-slate-300">
                      {formatDateDisplay(order.created_at)}
                    </td>
                    <td className="hidden xl:table-cell max-w-[140px] truncate px-2 py-2 text-slate-500 dark:text-slate-400" title={order.aciklama ?? ''}>
                      {order.aciklama?.trim() ? order.aciklama : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80 sm:px-6">
          {footerMode === 'append' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => onAppendConfirm?.()}
                disabled={selectedIds.size === 0}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Seçilenleri tabloya ekle ({selectedIds.size})
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
