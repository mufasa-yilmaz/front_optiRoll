/** Sipariş yönetim tablosu satır modeli. */
export type OrderPipelineRow = {
  id: string;
  widthMm: number;
  lengthM: number;
  weightTon: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'Optimized' | 'In Production';
};

/** Yeni sipariş form modeli. */
export type NewOrderForm = {
  id: string;
  widthMm: number;
  lengthM: number;
  weightTon: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
};
