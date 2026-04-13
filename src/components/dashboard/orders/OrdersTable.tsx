'use client';

import { useState } from 'react';
import type { Order } from '@/lib/api';
import {
  DEFAULT_ORDER_TABLE_MATERIAL,
  estimateOrderDemandTon,
  formatTonDisplayTr,
  getStatusLabel,
  getStatusTextClass,
} from './helpers';
import { OrderImportDropdown } from './OrderImportDropdown';
import type { OrderImportRow } from '@/lib/orderImport';

/** Tabloda seçilebilir sipariş durumları */
const ORDER_STATUSES = ['Pending', 'Optimized', 'In Production'] as const;
type OrderStatusOption = (typeof ORDER_STATUSES)[number];

/**
 * Sipariş tablosu / kartlarında teslim tarihini kısa metin olarak döndürür.
 */
function formatOrderTableDate(value?: string | null): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('tr-TR');
}

interface OrderMobileCardProps {
  order: Order;
  selected: boolean;
  updating: boolean;
  tonMaterial: { thicknessMm: number; densityKgM3: number };
  onDeleteOrders?: boolean;
  onStatusChange?: (order: Order, newStatus: string) => void | Promise<void>;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onToggleSelect: () => void;
  onStatusSelect: (newStatus: string) => void | Promise<void>;
}

/**
 * Dar ekranda tek siparişi kart olarak gösterir; yatay taşma olmaz.
 */
function OrderMobileCard({
  order,
  selected,
  updating,
  tonMaterial,
  onDeleteOrders,
  onStatusChange,
  onEdit,
  onDelete,
  onToggleSelect,
  onStatusSelect,
}: OrderMobileCardProps) {
  const ton = estimateOrderDemandTon(order, tonMaterial.thicknessMm, tonMaterial.densityKgM3);
  return (
    <li className={`border-b border-primary/5 p-4 last:border-b-0 ${selected ? 'bg-primary/5' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{order.order_id || order.id.slice(0, 8)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {Number(order.m2).toFixed(2)} m² · {formatTonDisplayTr(ton)} t · {Number(order.panel_width).toFixed(2)}×
            {Number(order.panel_length ?? 1).toFixed(2)} m
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {order.il || '-'} · {formatOrderTableDate(order.bitis_tarihi)}
          </p>
        </div>
        {onDeleteOrders && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-1 shrink-0 rounded border-slate-300"
            aria-label={`Sipariş ${order.order_id ?? order.id} seç`}
          />
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {onStatusChange ? (
          <select
            value={ORDER_STATUSES.includes(order.status as OrderStatusOption) ? order.status : 'Pending'}
            onChange={(e) => void onStatusSelect(e.target.value)}
            disabled={updating}
            className={`min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 sm:max-w-[12rem] ${getStatusTextClass((order.status as OrderStatusOption) || 'Pending')}`}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {getStatusLabel(s)}
              </option>
            ))}
          </select>
        ) : (
          <span className={`text-xs font-medium ${getStatusTextClass(order.status as 'Pending' | 'Optimized' | 'In Production')}`}>
            {getStatusLabel(order.status as 'Pending' | 'Optimized' | 'In Production')}
          </span>
        )}
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
    </li>
  );
}

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
  /** Excel/CSV/XML’den okunan siparişleri sırayla kaydeder. */
  onImportOrders?: (rows: OrderImportRow[]) => Promise<void>;
  /** Tahmini ton sütunu için malzeme; verilmezse galvaniz 0,75 mm varsayılır. */
  tonMaterial?: { thicknessMm: number; densityKgM3: number };
}

/**
 * Sipariş listesi: mobilde kart (yatay kaydırma yok), md ve üzerinde sabit genişlikli tablo.
 * Dar ekranda kısaltılmış başlıklar; Konum xl+, Teslim lg+ breakpoint’lerinde görünür.
 */
export function OrdersTable({
  orders,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
  onAddOrder,
  onDeleteOrders,
  onImportOrders,
  tonMaterial = DEFAULT_ORDER_TABLE_MATERIAL,
}: OrdersTableProps) {
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

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const productionCount = orders.filter((o) => o.status === 'In Production').length;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-primary/5 bg-white shadow-md">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-primary/5 bg-slate-50/70 px-3 py-3 sm:px-6 sm:py-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Siparişler</h2>
          <p className="text-xs text-slate-500">
            Toplam {orders.length} sipariş
            {orders.length > 0 && (
              <> · {pendingCount} beklemede, {productionCount} üretimde</>
            )}
            {hasSelection && ` · ${selectedIds.size} seçili`}
            <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-slate-400">
              Tahmini ton: tam sayı panel yuvarlaması + çift yüzey (×2); malzeme {tonMaterial.thicknessMm} mm,{' '}
              {tonMaterial.densityKgM3} kg/m³.
            </span>
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
          {onImportOrders && <OrderImportDropdown onImportedOrders={onImportOrders} disabled={loading} />}
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

      {/* Mobil: yatay taşma yok; tüm alanlar kart içinde */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto md:hidden">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Yükleniyor...</p>
        ) : orders.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Henüz sipariş yok. Yeni sipariş ekleyin.</p>
        ) : (
          <ul className="divide-y divide-primary/5">
            {orders.map((order) => (
              <OrderMobileCard
                key={order.id}
                order={order}
                selected={selectedIds.has(order.id)}
                updating={updatingId === order.id}
                tonMaterial={tonMaterial}
                onDeleteOrders={Boolean(onDeleteOrders)}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleSelect={() => toggleOne(order.id)}
                onStatusSelect={async (newStatus) => {
                  if (newStatus === order.status || !onStatusChange) return;
                  setUpdatingId(order.id);
                  try {
                    await onStatusChange(order, newStatus);
                  } finally {
                    setUpdatingId(null);
                  }
                }}
              />
            ))}
          </ul>
        )}
      </div>

      {/* md+: sabit tablo, yatay kaydırma yok; dar sütunlarda kısaltma */}
      <div className="hidden min-h-0 flex-1 overflow-x-hidden overflow-y-auto md:block">
        <table className="w-full max-w-full table-fixed border-collapse text-left text-xs lg:text-sm">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500 lg:text-[11px] lg:tracking-wider">
              {onDeleteOrders && (
                <th className="w-8 border-b border-primary/5 px-1 py-2 lg:w-10 lg:px-2 lg:py-3">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedIds.size === orders.length}
                    onChange={toggleAll}
                    className="rounded border-slate-300"
                    aria-label="Tümünü seç"
                  />
                </th>
              )}
              <th className="border-b border-primary/5 px-1 py-2 lg:px-3">Sipariş</th>
              <th className="border-b border-primary/5 px-1 py-2 text-right lg:px-2">m²</th>
              <th
                className="border-b border-primary/5 px-1 py-2 text-right lg:px-2"
                title="Panel yuvarlaması ve çift yüzey (×2) dahil"
              >
                <span className="lg:hidden">Ton</span>
                <span className="hidden lg:inline">Ton (t)</span>
              </th>
              <th className="border-b border-primary/5 px-1 py-2 text-right lg:px-2">
                <span className="xl:hidden">En</span>
                <span className="hidden xl:inline">Genişlik</span>
              </th>
              <th className="border-b border-primary/5 px-1 py-2 text-right lg:px-2">
                <span className="xl:hidden">Kes.</span>
                <span className="hidden xl:inline">Kesim</span>
              </th>
              <th className="hidden border-b border-primary/5 px-2 py-2 xl:table-cell">Konum</th>
              <th className="hidden border-b border-primary/5 px-2 py-2 lg:table-cell">Teslim Tarihi</th>
              <th className="border-b border-primary/5 px-1 py-2 lg:px-2">Durum</th>
              <th className="border-b border-primary/5 px-1 py-2 text-center lg:px-2">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {loading ? (
              <tr>
                <td colSpan={onDeleteOrders ? 10 : 9} className="px-3 py-8 text-sm text-slate-500">
                  Yükleniyor...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={onDeleteOrders ? 10 : 9} className="px-3 py-8 text-center text-sm text-slate-500">
                  Henüz sipariş yok. Yeni sipariş ekleyin.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className={`hover:bg-slate-50/50 ${selectedIds.has(order.id) ? 'bg-primary/5' : ''}`}>
                  {onDeleteOrders && (
                    <td className="px-1 py-2 align-middle lg:px-2 lg:py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleOne(order.id)}
                        className="rounded border-slate-300"
                        aria-label={`Sipariş ${order.order_id ?? order.id} seç`}
                      />
                    </td>
                  )}
                  <td className="max-w-0 px-1 py-2 align-middle font-medium text-slate-900 lg:px-3 lg:py-3">
                    <span className="block truncate" title={order.order_id || order.id}>
                      {order.order_id || order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-1 py-2 text-right align-middle tabular-nums lg:px-2 lg:py-3">
                    {Number(order.m2).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-1 py-2 text-right align-middle font-medium text-slate-800 tabular-nums lg:px-2 lg:py-3">
                    {formatTonDisplayTr(estimateOrderDemandTon(order, tonMaterial.thicknessMm, tonMaterial.densityKgM3))}
                  </td>
                  <td className="whitespace-nowrap px-1 py-2 text-right align-middle tabular-nums lg:px-2 lg:py-3">
                    {Number(order.panel_width).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-1 py-2 text-right align-middle tabular-nums lg:px-2 lg:py-3">
                    {Number(order.panel_length ?? 1).toFixed(2)}
                  </td>
                  <td className="hidden max-w-0 px-2 py-2 align-middle text-slate-600 xl:table-cell">
                    <span className="block truncate" title={order.il || undefined}>
                      {order.il || '-'}
                    </span>
                  </td>
                  <td className="hidden whitespace-nowrap px-2 py-2 align-middle lg:table-cell">
                    {formatOrderTableDate(order.bitis_tarihi)}
                  </td>
                  <td className="min-w-0 px-1 py-2 align-middle lg:px-2 lg:py-3">
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
                        className={`w-full max-w-full min-w-0 rounded-md border border-slate-200 bg-white px-1 py-1 text-[11px] font-medium outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 lg:rounded-lg lg:px-2 lg:py-1.5 lg:text-xs ${getStatusTextClass((order.status as OrderStatusOption) || 'Pending')}`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {getStatusLabel(s)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`block truncate text-[11px] font-medium lg:text-xs ${getStatusTextClass(order.status as 'Pending' | 'Optimized' | 'In Production')}`}>
                        {getStatusLabel(order.status as 'Pending' | 'Optimized' | 'In Production')}
                      </span>
                    )}
                  </td>
                  <td className="px-1 py-2 align-middle lg:px-2 lg:py-3">
                    <div className="flex flex-row flex-wrap items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(order)}
                        className="rounded border border-slate-200 px-1.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50 lg:px-2 lg:text-xs"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(order)}
                        className="rounded border border-red-200 px-1.5 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 lg:px-2 lg:text-xs"
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
