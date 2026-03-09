'use client';

import { useEffect, useState } from 'react';
import { calcWeightTon } from './helpers';
import type { NewOrderForm, OrderPipelineRow } from './types';

export interface ProjectOrderEditModalProps {
  /** Modal açık mı */
  isOpen: boolean;
  /** Kapatma callback'i */
  onClose: () => void;
  /** Bağlı olduğu proje adı (başlık altında gösterilir) */
  projectName: string;
  /** Düzenlenecek siparişin mevcut verisi */
  initialOrder: OrderPipelineRow | null;
  /** Kaydet tıklandığında güncellenmiş siparişi iletilir */
  onSave: (updated: OrderPipelineRow) => void;
}

/**
 * Proje içindeki tek bir siparişi düzenlemek için kullanılan modal.
 * Proje oluşturma/güncelleme modalından bağımsız, sadece sipariş alanlarını gösterir.
 */
export function ProjectOrderEditModal({
  isOpen,
  onClose,
  projectName,
  initialOrder,
  onSave,
}: ProjectOrderEditModalProps) {
  const [form, setForm] = useState<NewOrderForm>({
    id: '',
    m2: 100,
    widthM: 1,
    panelLengthM: 1,
    material: 'galvaniz',
    thicknessMm: 0.75,
    priority: 'Medium',
  });

  /** Modal açıldığında veya initialOrder değiştiğinde formu doldurur. */
  useEffect(() => {
    if (!isOpen || !initialOrder) return;
    const m2 = (initialOrder.widthMm / 1000) * initialOrder.lengthM;
    setForm({
      id: initialOrder.id,
      m2: Number(m2.toFixed(2)),
      widthM: initialOrder.widthMm / 1000,
      panelLengthM: initialOrder.panelLengthM ?? 1,
      material: (initialOrder.material as NewOrderForm['material']) ?? 'galvaniz',
      thicknessMm: initialOrder.thicknessMm ?? 0.75,
      priority: initialOrder.priority,
    });
  }, [isOpen, initialOrder]);

  /** Formdan OrderPipelineRow üretir ve onSave'e verir; modalı kapatır. */
  function handleSubmit() {
    if (!initialOrder) return;
    const m2 = Math.max(0.01, Number(form.m2) || 0.01);
    const widthM = Math.max(0.01, Number(form.widthM) || 1);
    const panelLengthM = Math.max(0.01, Number(form.panelLengthM) || 1);
    const thicknessMm = Math.max(0.1, Number(form.thicknessMm) || 0.75);
    const widthMm = Math.round(widthM * 1000);
    const lengthM = widthM > 0 ? Number((m2 / widthM).toFixed(4)) : 1;
    const weightTon = Number(calcWeightTon(m2, thicknessMm, form.material).toFixed(4));
    const id = form.id.trim() || initialOrder.id;
    const updated: OrderPipelineRow = {
      id,
      widthMm,
      lengthM,
      panelLengthM,
      weightTon,
      priority: form.priority,
      status: initialOrder.status,
      material: form.material,
      thicknessMm,
    };
    onSave(updated);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#1a2233] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white">Siparişi Düzenle</h3>
              <p className="text-xs text-slate-400">Proje: {projectName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-300 transition-colors hover:text-white" aria-label="Kapat">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Sipariş ID</label>
            <p className="mb-1.5 text-xs text-slate-500">Siparişi tanımlayan benzersiz kod</p>
            <input
              value={form.id}
              onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Örn: ORD-2024-X42"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="flex flex-col">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Talep (m²)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={form.m2}
                onChange={(e) => setForm((prev) => ({ ...prev, m2: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="100"
              />
              <p className="mt-1 text-xs text-slate-500">Sipariş toplam alanı, m²</p>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Genişlik (m)</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={form.widthM}
                onChange={(e) => setForm((prev) => ({ ...prev, widthM: Number(e.target.value) || 1 }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="1"
              />
              <p className="mt-1 text-xs text-slate-500">Panel genişliği, metre</p>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Kesim uzunluğu (m)</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={form.panelLengthM ?? 1}
                onChange={(e) => setForm((prev) => ({ ...prev, panelLengthM: Number(e.target.value) || 1 }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="1"
              />
              <p className="mt-1 text-xs text-slate-500">Parça başına kesim uzunluğu</p>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Malzeme</label>
              <select
                value={form.material}
                onChange={(e) => setForm((prev) => ({ ...prev, material: e.target.value as NewOrderForm['material'] }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="galvaniz">Galvaniz</option>
                <option value="aluminyum">Alüminyum</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">Yoğunluğa göre ağırlık hesaplanır</p>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Kalınlık (mm)</label>
              <input
                type="number"
                min={0.1}
                step={0.01}
                value={form.thicknessMm}
                onChange={(e) => setForm((prev) => ({ ...prev, thicknessMm: Number(e.target.value) || 0.75 }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="0.75"
              />
              <p className="mt-1 text-xs text-slate-500">Malzeme kalınlığı, mm</p>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Öncelik</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as NewOrderForm['priority'] }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="Low">Düşük</option>
                <option value="Medium">Orta</option>
                <option value="High">Yüksek</option>
                <option value="Urgent">Acil</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">Üretim sıralaması</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
