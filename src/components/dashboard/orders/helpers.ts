import type { Order, SavedOrderSet } from '@/lib/api';
import type { MaterialType, OrderPipelineRow } from './types';

/** Malzeme yoğunlukları (kg/m³); ağırlık hesaplamada kullanılır. */
export const MATERIAL_DENSITY_KG_M3: Record<MaterialType, number> = {
  galvaniz: 7850,
  aluminyum: 2700,
};

/**
 * Optimizasyon backend’i ile aynı çift yüzey talep çarpanı (SURFACE_FACTOR_OPTIMIZE = 2).
 */
export const OPTIMIZATION_SURFACE_FACTOR = 2;

/**
 * Sipariş tablosunda malzeme bilgisi yokken kullanılan varsayılanlar (konfigürasyon formu ile uyumlu).
 */
export const DEFAULT_ORDER_TABLE_MATERIAL = {
  thicknessMm: 0.75,
  densityKgM3: MATERIAL_DENSITY_KG_M3.galvaniz,
} as const;

/**
 * Tek sipariş için talep tonajını hesaplar: m² hedefi doğrudan alınır, yüzey çarpanı uygulanır,
 * ardından hacim × yoğunluk (güvenlik stoğu dahil değil; backend calculate_demand ile uyumlu).
 */
export function estimateOrderDemandTon(
  order: Pick<Order, 'm2' | 'panel_width' | 'panel_length'>,
  thicknessMm: number,
  densityKgM3: number,
  surfaceFactor: number = OPTIMIZATION_SURFACE_FACTOR,
): number {
  const densityGcm3 = densityKgM3 / 1000;
  const pw = Number(order.panel_width);
  const pl = Number(order.panel_length ?? 1);
  const m2 = Number(order.m2);
  if (pw <= 0 || pl <= 0 || m2 <= 0 || thicknessMm <= 0 || densityKgM3 <= 0) return 0;
  const effectiveM2 = m2 * Math.max(1, surfaceFactor);
  return effectiveM2 * (thicknessMm / 1000) * densityGcm3;
}

export type OrderAreaDivisibilityCheck = {
  isValid: boolean;
  panelAreaM2: number;
  panelCountExact: number;
  floorM2: number;
  ceilM2: number;
};

/**
 * Sipariş m² değerinin panel alanına tam bölünüp bölünmediğini doğrular.
 */
export function validateOrderAreaDivisibility(
  m2: number,
  panelWidthM: number,
  panelLengthM: number,
): OrderAreaDivisibilityCheck {
  const m2Safe = Number(m2);
  const widthSafe = Number(panelWidthM);
  const lengthSafe = Number(panelLengthM);
  if (m2Safe <= 0 || widthSafe <= 0 || lengthSafe <= 0) {
    return {
      isValid: true,
      panelAreaM2: 0,
      panelCountExact: 0,
      floorM2: 0,
      ceilM2: 0,
    };
  }
  const panelAreaM2 = widthSafe * lengthSafe;
  const panelCountExact = m2Safe / panelAreaM2;
  const nearestInt = Math.round(panelCountExact);
  const isValid = Math.abs(panelCountExact - nearestInt) < 1e-9;
  const floorPanels = Math.floor(panelCountExact);
  const ceilPanels = Math.ceil(panelCountExact);
  return {
    isValid,
    panelAreaM2,
    panelCountExact,
    floorM2: Number((floorPanels * panelAreaM2).toFixed(6)),
    ceilM2: Number((ceilPanels * panelAreaM2).toFixed(6)),
  };
}

/**
 * Listelenen siparişlerin tahmini talep tonajlarını toplar (satır başı estimateOrderDemandTon ile aynı mantık).
 */
export function sumOrdersEstimatedDemandTon(
  orders: Pick<Order, 'm2' | 'panel_width' | 'panel_length'>[],
  thicknessMm: number,
  densityKgM3: number,
  surfaceFactor: number = OPTIMIZATION_SURFACE_FACTOR,
): number {
  return orders.reduce((acc, o) => acc + estimateOrderDemandTon(o, thicknessMm, densityKgM3, surfaceFactor), 0);
}

/** Ton cinsinden gösterimde virgülden sonraki ondalık basamak sayısı (hesap hassasiyeti). */
export const TON_DISPLAY_DECIMALS = 3;

/**
 * Tahmini ton değerini arayüzde göstermek için Türkçe biçimlendirir (ondalık ayırıcı virgül, üç basamak).
 */
export function formatTonDisplayTr(ton: number): string {
  return ton.toLocaleString('tr-TR', {
    minimumFractionDigits: TON_DISPLAY_DECIMALS,
    maximumFractionDigits: TON_DISPLAY_DECIMALS,
  });
}

/**
 * Rulo tablosu gibi yerlerde sabit 3 haneye zorlamadan ton gösterir (API ham değerine yakın).
 */
export function formatTonTrUnrounded(ton: number): string {
  const x = Number(ton);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

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
    Optimized: 'Optimize Edildi',
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
  const weightTon = Number((calcWeightTon(m2, 0.75, 'galvaniz')).toFixed(TON_DISPLAY_DECIMALS));
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
