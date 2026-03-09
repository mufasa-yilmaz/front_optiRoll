/**
 * Backend API istemcisi.
 * Kesme Stoku Optimizasyon API'sine istek atar.
 */

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
// API taban adresini normalize eder: protokol yoksa https ekler, sonda ekstra /'ları temizler.
const API_BASE = RAW_API_BASE
  ? RAW_API_BASE.startsWith('http')
    ? RAW_API_BASE.replace(/\/+$/, '')
    : `https://${RAW_API_BASE.replace(/^\/+/, '').replace(/\/+$/, '')}`
  : '';

/** Rulo/sipariş limiti için "sonsuz" değeri; API'ye bu sayı gönderilir, backend limit uygulamaz. */
export const ROLL_ORDER_UNLIMITED = 999999;

export interface MaterialInput {
  thickness: number;
  density: number;
}

export interface OrderInput {
  /** Siparişin kullanıcı dostu/kaydedilen kimliği (opsiyonel). */
  orderId?: string;
  m2: number;
  panelWidth: number;
  /** Panel kesim uzunluğu (m); bu uzunluk ve katları kesilir (örn. 3m → 3*33+1 fire). Varsayılan 1. */
  panelLength?: number;
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
  safetyStock?: number;
  configurationId?: string;
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
  panelLength?: number;
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
  configurationId?: string | null;
  inputData?: OptimizeRequest;
  /** Supabase Storage'daki rapor URL'i (geçmiş sonuçlar için) */
  reportUrl?: string;
}

export interface ValidateResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  totalTonnageNeeded?: number;
}

export interface ConfigurationSaveRequest {
  configurationId?: string;
  name?: string;
  material: MaterialInput;
  safetyStock: number;
  orders: OrderInput[];
  rollSettings: RollSettingsInput;
  costs: CostsInput;
}

export interface ConfigurationSaveResponse {
  configurationId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedConfiguration {
  id: string;
  name?: string;
  material_thickness: number;
  material_density: number;
  safety_stock: number;
  max_orders_per_roll: number;
  max_rolls_per_order: number;
  fire_cost: number;
  setup_cost: number;
  stock_cost: number;
  rolls: number[];
  orders: OrderInput[];
  created_at?: string;
  updated_at?: string;
}

export interface SavedOrderSet {
  id: string;
  name: string;
  orders: OrderInput[];
  created_at?: string;
  updated_at?: string;
}

export interface SavedStockSet {
  id: string;
  name: string;
  rolls: number[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Optimizasyon isteği gönderir.
 * @param data - OptimizeRequest
 * @returns OptimizeResponse
 */
/** API isteği timeout (2 dakika) */
const OPTIMIZE_TIMEOUT_MS = 2 * 60 * 1000;

/** Backend JSON hata cevabından mesaj metnini çıkarır (detail string veya string[]). */
function getErrorMessage(err: { detail?: string | string[] }, fallback: string): string {
  const d = err?.detail;
  if (Array.isArray(d)) return d.length ? d.join('. ') : fallback;
  if (typeof d === 'string' && d.trim()) return d;
  return fallback;
}

export async function optimize(data: OptimizeRequest): Promise<OptimizeResponse> {
  const url = `${API_BASE}/api/optimize`;
  if (!API_BASE) {
    throw new Error('API adresi tanımlı değil. .env içinde NEXT_PUBLIC_API_URL ayarlayın (örn. https://optiroll-back-fastapi-production.up.railway.app)');
  }
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
      throw new Error(getErrorMessage(err, 'Optimizasyon hatası'));
    }
    return res.json();
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Hesaplama zaman aşımına uğradı (2 dk). Lütfen tekrar deneyin.');
    }
    if (e instanceof TypeError && (e.message === 'Failed to fetch' || e.message.includes('fetch'))) {
      throw new Error(`Backend'e bağlanılamadı. API URL: ${API_BASE} — CORS veya adres kontrol edin.`);
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
 * Konfigürasyonu kaydeder veya günceller.
 * @param data - ConfigurationSaveRequest
 * @returns ConfigurationSaveResponse
 */
export async function saveConfiguration(
  data: ConfigurationSaveRequest,
): Promise<ConfigurationSaveResponse> {
  const url = `${API_BASE}/api/configurations`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Konfigürasyon kaydı başarısız' }));
    throw new Error(err.detail || 'Konfigürasyon kaydı başarısız');
  }
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

/**
 * Geçmiş çalıştırma kaydını fileId ile siler.
 */
export async function deleteRun(fileId: string): Promise<void> {
  const url = `${API_BASE}/api/runs/${fileId}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Çalıştırma bulunamadı');
    const err = await res.json().catch(() => ({ detail: 'Silme işlemi başarısız' }));
    throw new Error(err.detail || 'Silme işlemi başarısız');
  }
}

/**
 * Kayıtlı bir konfigürasyonu ID ile getirir.
 */
export async function getConfigurationById(configurationId: string): Promise<SavedConfiguration> {
  const url = `${API_BASE}/api/configurations/${configurationId}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Konfigürasyon bulunamadı');
    throw new Error('Konfigürasyon yüklenemedi');
  }
  return res.json();
}

/**
 * Sonuç çalıştırmasının girdilerinden konfigürasyon kaydı üretir/günceller.
 */
export async function saveRunConfiguration(fileId: string): Promise<ConfigurationSaveResponse> {
  const url = `${API_BASE}/api/runs/${fileId}/save-configuration`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Konfigürasyon kaydı başarısız' }));
    throw new Error(err.detail || 'Konfigürasyon kaydı başarısız');
  }
  return res.json();
}

/**
 * Kayıtlı sipariş setlerini listeler.
 */
export async function getOrderSets(): Promise<{ orderSets: SavedOrderSet[] }> {
  const url = `${API_BASE}/api/order-sets`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Sipariş setleri yüklenemedi');
  return res.json();
}

/**
 * Yeni sipariş seti kaydeder.
 */
export async function saveOrderSet(
  name: string,
  orders: OrderInput[],
  setId?: string,
): Promise<SavedOrderSet> {
  const url = `${API_BASE}/api/order-sets`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: setId, name, orders }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Sipariş seti kaydedilemedi' }));
    throw new Error(err.detail || 'Sipariş seti kaydedilemedi');
  }
  return res.json();
}

/**
 * Sipariş setini siler.
 */
export async function deleteOrderSet(setId: string): Promise<void> {
  const url = `${API_BASE}/api/order-sets/${setId}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('Sipariş seti silinemedi');
}

/**
 * Kayıtlı stok setlerini listeler.
 */
export async function getStockSets(): Promise<{ stockSets: SavedStockSet[] }> {
  const url = `${API_BASE}/api/stock-sets`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Stok setleri yüklenemedi');
  return res.json();
}

/**
 * Yeni stok/rulo seti kaydeder.
 */
export async function saveStockSet(
  name: string,
  rolls: number[],
  setId?: string,
): Promise<SavedStockSet> {
  const url = `${API_BASE}/api/stock-sets`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: setId, name, rolls }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Stok seti kaydedilemedi' }));
    throw new Error(err.detail || 'Stok seti kaydedilemedi');
  }
  return res.json();
}

/**
 * Stok/rulo setini siler.
 */
export async function deleteStockSet(setId: string): Promise<void> {
  const url = `${API_BASE}/api/stock-sets/${setId}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('Stok seti silinemedi');
}
