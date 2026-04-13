'use client';

import type { Order } from '@/lib/api';

export interface OrderFormData {
  order_id: string;
  m2: number;
  panel_width: number;
  panel_length: number;
  il: string;
  bitis_tarihi: string;
  aciklama: string;
}

interface OrderCreateModalProps {
  isOpen: boolean;
  isEdit: boolean;
  initial?: Order | null;
  form: OrderFormData;
  onFormChange: (updater: (prev: OrderFormData) => OrderFormData) => void;
  onClose: () => void;
  onSave: () => void;
  /** Başlık metnini özelleştirir (varsayılan: yeni sipariş / düzenle). */
  titleOverride?: string;
  /** Birincil buton etiketi (varsayılan: Kaydet / Güncelle). */
  submitLabel?: string;
}

/**
 * Sipariş oluşturma veya düzenleme modalı.
 * Zorunlu: sipariş adı, m2, panel_width, panel_length. Opsiyonel: il, teslim tarihi, açıklama.
 */
export function OrderCreateModal({
  isOpen,
  isEdit,
  initial,
  form,
  onFormChange,
  onClose,
  onSave,
  titleOverride,
  submitLabel,
}: OrderCreateModalProps) {
  if (!isOpen) return null;

  const headerTitle =
    titleOverride ?? (isEdit ? 'Siparişi Düzenle' : 'Yeni Sipariş Ekle');
  const primaryLabel = submitLabel ?? (isEdit ? 'Güncelle' : 'Kaydet');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#1a2233] px-6 py-4">
          <h3 className="text-lg font-bold tracking-tight text-white">
            {headerTitle}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-300 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Sipariş adı *</label>
            <input
              required
              value={form.order_id}
              onChange={(e) => onFormChange((p) => ({ ...p, order_id: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5"
              placeholder="Örn: ORD-2025-001"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Talep (m²) *</label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.m2 || ''}
              onChange={(e) => onFormChange((p) => ({ ...p, m2: Number(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Panel Genişliği (m) *</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={form.panel_width || ''}
              onChange={(e) => onFormChange((p) => ({ ...p, panel_width: Number(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Panel Kesim Uzunluğu (m) *</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={form.panel_length || ''}
              onChange={(e) => onFormChange((p) => ({ ...p, panel_length: Number(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">İl (opsiyonel)</label>
            <input
              value={form.il || ''}
              onChange={(e) => onFormChange((p) => ({ ...p, il: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5"
              placeholder="Örn: İstanbul"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Teslim Tarihi (opsiyonel)</label>
            <input
              type="date"
              value={form.bitis_tarihi || ''}
              onChange={(e) => onFormChange((p) => ({ ...p, bitis_tarihi: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Açıklama (opsiyonel)</label>
            <textarea
              value={form.aciklama || ''}
              onChange={(e) => onFormChange((p) => ({ ...p, aciklama: e.target.value }))}
              className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5"
              rows={3}
              placeholder="Sipariş notları..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
