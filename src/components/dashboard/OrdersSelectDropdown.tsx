'use client';

import { useState, useEffect } from 'react';
import type { Order } from '@/lib/api';
import { OrdersSelectModal } from './OrdersSelectModal';

export interface OrdersSelectDropdownProps {
  /** Orders tablosundan gelen Pending siparişler */
  orders: Order[];
  /** Seçili sipariş ID'leri */
  selectedIds: Set<string>;
  /** Seçim değiştiğinde çağrılır */
  onSelectionChange: (selectedIds: Set<string>) => void;
  /** Hata durumu (buton etrafında vurgu) */
  hasError?: boolean;
  /** Tetikleyici buton metni */
  label?: string;
  /** true ise modalda seçim tabloya eklenene kadar bekler; onAppendOrders ile birleştirir */
  appendMode?: boolean;
  /** appendMode: tabloda zaten olan sipariş id'leri (tekrar eklemeyi engellemek için) */
  existingOrderIds?: Set<string>;
  /** appendMode: "Seçilenleri tabloya ekle" tıklanınca çağrılır */
  onAppendOrders?: (rows: { id: string; m2: number; panelWidth: number; panelLength?: number }[]) => void;
}

/**
 * Sipariş seçimi: buton modal açar; detaylı tablo, filtre ve sıralama ile çoklu seçim.
 * appendMode kapalıyken seçim doğrudan üst bileşenle senkron (otomatik konfigürasyon).
 * appendMode açıkken taslak seçim modalda kalır; onayda satırlar onAppendOrders ile eklenir.
 */
export function OrdersSelectDropdown({
  orders,
  selectedIds,
  onSelectionChange,
  hasError,
  label = 'Siparişlerden seç',
  appendMode = false,
  existingOrderIds,
  onAppendOrders,
}: OrdersSelectDropdownProps) {
  const [modalOpen, setModalOpen] = useState(false);
  /** appendMode için modal içi geçici seçim (üst state’i kapatana kadar değiştirmez). */
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set());

  /** Modal açılırken append modunda taslağı sıfırlar. */
  useEffect(() => {
    if (modalOpen && appendMode) {
      setDraftIds(new Set());
    }
  }, [modalOpen, appendMode]);

  if (orders.length === 0) {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Bekleyen sipariş yok. Önce sipariş sayfasından sipariş ekleyin.
      </span>
    );
  }

  const modalSelected = appendMode ? draftIds : selectedIds;
  const modalOnChange = appendMode ? setDraftIds : onSelectionChange;
  /** Senkron modda seçili/bekleyen oranı; append modda sadece bekleyen kayıt sayısı (taslak modalda). */
  const countLabel = appendMode ? `${orders.length} kayıt` : `${selectedIds.size}/${orders.length}`;

  /**
   * Append modunda: seçilen siparişleri (tabloda olmayanlar) üst bileşene iletir ve modalı kapatır.
   */
  function handleAppendConfirm() {
    if (!onAppendOrders || !appendMode) return;
    const rows = orders
      .filter((o) => draftIds.has(o.id))
      .filter((o) => !existingOrderIds?.has(o.id))
      .map((o) => ({
        id: o.id,
        m2: Number(o.m2),
        panelWidth: Number(o.panel_width),
        panelLength: o.panel_length != null ? Number(o.panel_length) : undefined,
      }));
    onAppendOrders(rows);
    setModalOpen(false);
    setDraftIds(new Set());
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
          hasError
            ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80'
        }`}
        aria-expanded={modalOpen}
        aria-haspopup="dialog"
      >
        <span className="material-symbols-outlined text-lg">table_rows</span>
        {label}
        <span className="text-slate-500 dark:text-slate-400">({countLabel})</span>
      </button>

      <OrdersSelectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          if (appendMode) setDraftIds(new Set());
        }}
        orders={orders}
        selectedIds={modalSelected}
        onSelectionChange={modalOnChange}
        footerMode={appendMode ? 'append' : 'closeOnly'}
        onAppendConfirm={appendMode ? handleAppendConfirm : undefined}
      />
    </div>
  );
}
