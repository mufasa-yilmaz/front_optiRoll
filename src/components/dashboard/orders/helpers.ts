import type { SavedOrderSet } from '@/lib/api';
import type { MaterialType, OrderPipelineRow } from './types';

/** Malzeme yoğunlukları (kg/m³); ağırlık hesaplamada kullanılır. */
export const MATERIAL_DENSITY_KG_M3: Record<MaterialType, number> = {
  galvaniz: 7850,
  aluminyum: 2700,
};

/**
 * m², kalınlık ve malzemeden ağırlığı (ton) hesaplar.
 * weightTon = m2 * (thicknessMm/1000) * (density/1000)
 */
export function calcWeightTon(m2: number, thicknessMm: number, material: MaterialType): number {
  const density = MATERIAL_DENSITY_KG_M3[material];
  return (m2 * (thicknessMm / 1000) * density) / 1000;
}

/** Öncelik etiket sınıfını döndürür. */
export function getPriorityBadge(priority: OrderPipelineRow['priority']): string {
  const map = {
    Low: 'bg-slate-100 text-slate-600',
    Medium: 'bg-slate-100 text-slate-600',
    High: 'bg-amber-100 text-amber-700',
    Urgent: 'bg-red-100 text-red-700',
  } as const;
  return map[priority];
}

/** Öncelik görüntü metnini (Türkçe) döndürür. */
export function getPriorityLabel(priority: OrderPipelineRow['priority']): string {
  const map = {
    Low: 'Düşük',
    Medium: 'Orta',
    High: 'Yüksek',
    Urgent: 'Acil',
  } as const;
  return map[priority];
}

/** Durum görüntü metnini (Türkçe) döndürür. */
export function getStatusLabel(status: OrderPipelineRow['status']): string {
  const map = {
    Pending: 'Beklemede',
    Optimized: 'Optimize',
    'In Production': 'Üretimde',
  } as const;
  return map[status];
}

/** Durum metni sınıfını döndürür. */
export function getStatusTextClass(status: OrderPipelineRow['status']): string {
  const map = {
    Pending: 'text-slate-500',
    Optimized: 'text-primary',
    'In Production': 'text-blue-600',
  } as const;
  return map[status];
}

/** Durum ikon adını döndürür. */
export function getStatusIcon(status: OrderPipelineRow['status']): string {
  const map = {
    Pending: 'schedule',
    Optimized: 'auto_awesome',
    'In Production': 'sync',
  } as const;
  return map[status];
}

/** Pipeline satırını API order satırına dönüştürür. */
export function toApiOrderRow(
  row: OrderPipelineRow,
): { orderId: string; m2: number; panelWidth: number; panelLength?: number } {
  const panelWidth = row.widthMm / 1000;
  const m2 = panelWidth * row.lengthM;
  const panelLength = row.panelLengthM ?? 1;
  return {
    orderId: row.id,
    m2: Number(m2.toFixed(4)),
    panelWidth: Number(panelWidth.toFixed(4)),
    panelLength: Number(panelLength),
  };
}

/** API order satırını pipeline satırına dönüştürür. (API'de malzeme/kalınlık yok; ağırlık tahmini.) */
export function fromApiOrderRow(
  row: { orderId?: string; m2: number; panelWidth: number; panelLength?: number },
  index: number,
): OrderPipelineRow {
  const panelWidth = Number(row.panelWidth || 0);
  const m2 = Number(row.m2 || 0);
  const lengthM = panelWidth > 0 ? m2 / panelWidth : 1;
  const panelLengthM = Number(row.panelLength ?? 1);
  const widthMm = Math.max(1, Math.round(panelWidth * 1000));
  /** Galvaniz 0.75 mm varsayımı ile tahmini ağırlık */
  const weightTon = Number((calcWeightTon(m2, 0.75, 'galvaniz')).toFixed(2));
  return {
    id: row.orderId?.trim() || `ORD-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
    widthMm,
    lengthM: Number(lengthM.toFixed(2)),
    panelLengthM: panelLengthM > 0 ? panelLengthM : 1,
    weightTon,
    priority: 'Medium',
    status: 'Pending',
  };
}

/** Set tarihini tablo gösterimine uygun formatlar. */
export function formatOrderSetDate(value?: string): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('tr-TR');
}

/** Set için basit bir ilerleme yüzdesi üretir. */
export function getProjectProgress(setItem: SavedOrderSet, index: number): number {
  const base = Math.min(95, (setItem.orders?.length || 0) * 12);
  const seeded = base + (index % 4) * 7;
  return Math.max(8, Math.min(100, seeded));
}
