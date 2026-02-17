/**
 * Backend API istemcisi.
 * Kesme Stoku Optimizasyon API'sine istek atar.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface MaterialInput {
  thickness: number;
  density: number;
}

export interface OrderInput {
  m2: number;
  panelWidth: number;
}

export interface RollSettingsInput {
  /** Manuel modda: rulo tonajları listesi. Otomatik modda: boş */
  rolls?: number[];
  /** Otomatik modda: toplam tonaj. Manuel modda: kullanılmaz */
  totalTonnage?: number;
  /** Otomatik bölmede min rulo tonajı */
  minRollTon?: number;
  /** Otomatik bölmede max rulo tonajı */
  maxRollTon?: number;
  maxOrdersPerRoll: number;
  maxRollsPerOrder?: number;
}

export interface CostsInput {
  fireCost: number;
  setupCost: number;
  stockCost: number;
}

export interface OptimizeRequest {
  material: MaterialInput;
  orders: OrderInput[];
  rollSettings: RollSettingsInput;
  costs: CostsInput;
}

export interface SummaryResponse {
  totalCost: number;
  totalFire: number;
  totalStock: number;
  openedRolls: number;
}

export interface CuttingPlanItem {
  rollId: number;
  orderId: number;
  panelCount: number;
  panelWidth: number;
  tonnage: number;
  m2: number;
}

export interface RollStatusItem {
  rollId: number;
  totalTonnage: number;
  used: number;
  remaining: number;
  fire: number;
  stock: number;
  ordersUsed: number;
}

export interface OptimizeResponse {
  status: string;
  objective: number;
  summary: SummaryResponse;
  cuttingPlan: CuttingPlanItem[];
  rollStatus: RollStatusItem[];
  fileId: string;
  /** Supabase Storage'daki rapor URL'i (geçmiş sonuçlar için) */
  reportUrl?: string;
}

export interface ValidateResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  totalTonnageNeeded?: number;
}

/**
 * Optimizasyon isteği gönderir.
 * @param data - OptimizeRequest
 * @returns OptimizeResponse
 */
/** API isteği timeout (2 dakika) */
const OPTIMIZE_TIMEOUT_MS = 2 * 60 * 1000;

export async function optimize(data: OptimizeRequest): Promise<OptimizeResponse> {
  const url = `${API_BASE}/api/optimize`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPTIMIZE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || Array.isArray(err.detail) ? err.detail.join(', ') : 'Optimizasyon hatası');
    }
    return res.json();
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Hesaplama zaman aşımına uğradı (2 dk). Lütfen tekrar deneyin.');
    }
    throw e;
  }
}

/**
 * Girdi doğrulaması yapar.
 * @param data - OptimizeRequest
 * @returns ValidateResponse
 */
export async function validate(data: OptimizeRequest): Promise<ValidateResponse> {
  const url = `${API_BASE}/api/validate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Doğrulama isteği başarısız');
  return res.json();
}

/**
 * Excel rapor dosyasının indirme URL'ini döndürür.
 * @param fileId - Backend'in döndürdüğü fileId
 */
export function getReportDownloadUrl(fileId: string): string {
  return `${API_BASE}/api/results/${fileId}`;
}

/** Geçmiş çalıştırma özeti */
export interface RunSummary {
  id: string;
  file_id: string;
  created_at: string;
  summary: SummaryResponse;
  status: string;
}

/** Geçmiş çalıştırma detayı (OptimizeResponse + createdAt, reportUrl) */
export interface RunDetail extends OptimizeResponse {
  createdAt?: string;
  reportUrl?: string;
}

/**
 * Geçmiş optimizasyon çalıştırmalarını listeler.
 */
export async function getRuns(limit = 50, offset = 0): Promise<{ runs: RunSummary[] }> {
  const url = `${API_BASE}/api/runs?limit=${limit}&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geçmiş yüklenemedi');
  return res.json();
}

/**
 * Belirli bir çalıştırmanın detayını getirir.
 */
export async function getRun(fileId: string): Promise<RunDetail> {
  const url = `${API_BASE}/api/runs/${fileId}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Çalıştırma bulunamadı');
    throw new Error('Detay yüklenemedi');
  }
  return res.json();
}
