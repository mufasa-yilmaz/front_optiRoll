/** Sipariş yönetim tablosu satır modeli. */
export type OrderPipelineRow = {
  id: string;
  widthMm: number;
  lengthM: number;
  /** Panel kesim uzunluğu (m); bu uzunluk ve katları kesilir. */
  panelLengthM?: number;
  weightTon: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'Optimized' | 'In Production';
};

/** Yeni sipariş form modeli. */
export type NewOrderForm = {
  id: string;
  widthMm: number;
  lengthM: number;
  /** Panel kesim uzunluğu (m); bu uzunluk ve katları kesilir (örn. 3m → 3*33+1 fire). */
  panelLengthM?: number;
  weightTon: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
};
