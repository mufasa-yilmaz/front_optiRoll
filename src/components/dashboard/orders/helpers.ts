import type { SavedOrderSet } from '@/lib/api';
import type { OrderPipelineRow } from './types';

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
): { orderId: string; m2: number; panelWidth: number } {
  const panelWidth = row.widthMm / 1000;
  const m2 = panelWidth * row.lengthM;
  return {
    orderId: row.id,
    m2: Number(m2.toFixed(4)),
    panelWidth: Number(panelWidth.toFixed(4)),
  };
}

/** API order satırını pipeline satırına dönüştürür. */
export function fromApiOrderRow(
  row: { orderId?: string; m2: number; panelWidth: number },
  index: number,
): OrderPipelineRow {
  const panelWidth = Number(row.panelWidth || 0);
  const m2 = Number(row.m2 || 0);
  const lengthM = panelWidth > 0 ? m2 / panelWidth : 1;
  return {
    id: row.orderId?.trim() || `ORD-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
    widthMm: Math.max(1, Math.round(panelWidth * 1000)),
    lengthM: Number(lengthM.toFixed(2)),
    weightTon: Number((m2 * 0.007).toFixed(2)),
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
