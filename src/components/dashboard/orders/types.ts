/** Malzeme tipi: yoğunluğa göre ağırlık hesaplanır. */
export type MaterialType = 'galvaniz' | 'aluminyum';

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
  /** Malzeme (galvaniz/alüminyum); ağırlık hesaplamada kullanılır. */
  material?: MaterialType;
  /** Malzeme kalınlığı (mm); ağırlık hesaplamada kullanılır. */
  thicknessMm?: number;
};

/** Yeni sipariş form modeli. */
export type NewOrderForm = {
  id: string;
  /** Talep alanı (m²). */
  m2: number;
  /** Panel genişliği (m); varsayılan 1 m. */
  widthM: number;
  /** Panel kesim uzunluğu (m); bu uzunluk ve katları kesilir. */
  panelLengthM?: number;
  /** Malzeme tipi; yoğunluğa göre ağırlık hesaplanır. */
  material: MaterialType;
  /** Malzeme kalınlığı (mm). */
  thicknessMm: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
};
