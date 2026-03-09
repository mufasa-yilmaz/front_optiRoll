'use client';

import { useState, useEffect } from 'react';
import type { StockRoll } from '@/lib/api';

interface StockRollAddModalProps {
  isOpen: boolean;
  /** Düzenleme modunda doldurulacak rulo; null ise yeni ekleme. */
  editingRoll?: StockRoll | null;
  onClose: () => void;
  /** (tonnage, rollId?) — rollId verilirse güncelleme, yoksa yeni ekleme */
  onSave: (tonnage: number, rollId?: string) => void;
}

/**
 * Yeni rulo ekleme veya mevcut rulo tonajı güncelleme modalı.
 */
export function StockRollAddModal({ isOpen, editingRoll, onClose, onSave }: StockRollAddModalProps) {
  const [tonnage, setTonnage] = useState<string>('');

  const isEdit = !!editingRoll;

  useEffect(() => {
    if (isOpen) {
      setTonnage(isEdit && editingRoll ? String(editingRoll.tonnage) : '');
    }
  }, [isOpen, isEdit, editingRoll]);

  if (!isOpen) return null;

  function handleSave() {
    const num = Number(tonnage);
    if (num <= 0 || Number.isNaN(num)) return;
    onSave(num, editingRoll?.id);
    setTonnage('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          {isEdit ? 'Rulo Güncelle' : 'Yeni Rulo Ekle'}
        </h3>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tonaj (ton) *</label>
          <input
            type="number"
            min="1"
            step="1"
            value={tonnage}
            onChange={(e) => setTonnage(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5"
            placeholder="Örn: 8"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!tonnage || Number(tonnage) <= 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEdit ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
