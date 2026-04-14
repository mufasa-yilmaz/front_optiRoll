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

/** Çok modlu optimizasyon strateji anahtarları. */
export type OptimizationStrategyMode = 'az' | 'orta' | 'cok' | 'eszamanli';
/** Üst/alt hat senkron seviyesi anahtarları. */
export type SyncLevel = 'serbest' | 'dengeli' | 'siki';

export interface OptimizeRequest {
  material: MaterialInput;
  orders: OrderInput[];
  rollSettings: RollSettingsInput;
  costs: CostsInput;
  safetyStock?: number;
  /** @deprecated Sunucu optimize yolunda sabit 2 kullanır; gönderilse yok sayılır. */
  surfaceFactor?: number;
  /** @deprecated Kaldırıldı; gönderilse yok sayılır. */
  requireDualRollAllocation?: boolean;
  /** Araya max kac farkli siparis; asimda soft ceza */
  maxInterleavingOrders?: number;
  /** Fazla araya siparis basina ceza birimi (0 = kapali) */
  interleavingPenaltyCost?: number;
  configurationId?: string;
  /** false ise sadece hesaplama, DB'ye kaydetmez (önizleme modu) */
  saveToDb?: boolean;
  /** Kısa açıklama; sonuçlar tablosunda ID yerine gösterilir */
  description?: string;
  /** Bu çalıştırmada kullanılan stok rulo ID'leri; işleme alında stoktan düşülüp kalanlar tekrar stoka yazılır */
  stockRollIds?: string[];
  /** Tek çalıştırmada koşturulacak strateji modları; boşsa backend varsayılan seti kullanır. */
  strategyModes?: OptimizationStrategyMode[];
  /** Tekli senkron seviyesi seçimi (geri uyumluluk). */
  syncLevel?: SyncLevel;
  /** Karşılaştırma için seçilen senkron seviyeleri. */
  syncLevels?: SyncLevel[];
}

export interface SummaryResponse {
  totalCost: number;
  totalFire: number;
  totalStock: number;
  openedRolls: number;
  sequencePenalty?: number;
  interleavingViolationCount?: number;
}

export interface SequenceViolationItem {
  rollId: number;
  orderId: number;
  distinctInterleavedOrders: number;
  maxAllowed: number;
  excess: number;
}

export interface CuttingPlanItem {
  rollId: number;
  orderId: number;
  panelCount: number;
  panelWidth: number;
  panelLength?: number;
  tonnage: number;
  m2: number;
  /** Çift yüzey çözümünde bu (rulo,sipariş) satırının üst yüzeye düşen tonajı */
  upperTonnage?: number;
  /** Çift yüzey çözümünde alt yüzeye düşen tonajı */
  lowerTonnage?: number;
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

/** Mod bazlı karşılaştırma satırı: fire/maliyet/değişim ve eşzamanlılık özeti. */
export interface ModeComparisonItem {
  mode: OptimizationStrategyMode;
  status: string;
  objective: number;
  totalCost?: number;
  totalFire?: number;
  totalStock?: number;
  openedRolls?: number;
  rollChangeCount?: number;
  surfaceSyncViolations?: number;
}

/** Senkron seviye karşılaştırma satırı. */
export interface SyncComparisonItem {
  syncLevel: SyncLevel;
  status: string;
  totalCost?: number;
  totalFire?: number;
  rollChangeCount?: number;
  synchronousChanges?: number;
  independentChanges?: number;
}

/** Hat üzerinde tek tak-çıkar/devam olayı. */
export interface LineEventItem {
  timestampStep: number;
  line: 'ust' | 'alt';
  action: 'tak' | 'cikar' | 'devam';
  rollId: number;
  orderIdFrom?: number | null;
  orderIdTo?: number | null;
}

/** Hat geçiş özet metrikleri. */
export interface LineTransitionsSummary {
  totalChanges: number;
  synchronousChanges: number;
  independentChanges: number;
  stepCount?: number;
}

/** Tek adımda kesilen sipariş parçası. */
export interface LineScheduleCutItem {
  orderId: number;
  rollId: number;
  tonnage: number;
  m2: number;
  upperTonnage?: number;
  lowerTonnage?: number;
}

/** Tek hat adımı: üst/alt rulo durumu ve kesilen parçalar. */
export interface LineScheduleStepItem {
  step: number;
  orderId: number;
  upperRollId?: number | null;
  lowerRollId?: number | null;
  /** Üst hat aksiyon kodu: takildi | cikarildi | devam */
  upperAction?: string;
  /** Alt hat aksiyon kodu */
  lowerAction?: string;
  /** Sipariş akışı: basladi | devam | degisti | geri_donus | tamamlandi */
  orderAction?: string;
  /** Operatör için kısa Türkçe özet */
  actionSummary?: string;
  prevUpperRollId?: number | null;
  prevLowerRollId?: number | null;
  cuts: LineScheduleCutItem[];
}

export interface OptimizeResponse {
  status: string;
  objective: number;
  summary: SummaryResponse;
  cuttingPlan: CuttingPlanItem[];
  rollStatus: RollStatusItem[];
  fileId: string;
  sequencePenalty?: number;
  sequenceViolations?: SequenceViolationItem[];
  rollOrderSequences?: Record<string, number[]>;
  selectedModes?: OptimizationStrategyMode[];
  selectedModesCount?: number;
  comparisonEnabled?: boolean;
  selectedSyncLevels?: SyncLevel[];
  selectedSyncLevelsCount?: number;
  configurationId?: string | null;
  inputData?: OptimizeRequest;
  /** Supabase Storage'daki rapor URL'i (geçmiş sonuçlar için) */
  reportUrl?: string;
  /** Aynı isteğin farklı strateji modlarıyla karşılaştırmalı sonuçları. */
  modeComparisons?: ModeComparisonItem[];
  /** Seçilen senkron seviyelerin kısa karşılaştırması. */
  syncComparisons?: SyncComparisonItem[];
  /** Üst/alt hat olay zaman çizelgesi. */
  lineEvents?: LineEventItem[];
  /** Üst/alt hat adım çizelgesi. */
  lineSchedule?: LineScheduleStepItem[];
  /** Hat geçiş özet metrikleri. */
  lineTransitionsSummary?: LineTransitionsSummary;
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
  /** @deprecated Sunucu tarafında sabit çift yüzey; isteğe bağlı geri uyumluluk alanı. */
  surfaceFactor?: number;
  /** @deprecated */
  requireDualRollAllocation?: boolean;
  maxInterleavingOrders?: number;
  interleavingPenaltyCost?: number;
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
  surface_factor?: number;
  require_dual_roll_allocation?: boolean;
  max_interleaving_orders?: number;
  interleaving_penalty_cost?: number;
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

/** Tek sipariş (orders tablosu) */
export interface Order {
  id: string;
  /** Sipariş adı (zorunlu; arayüzde gösterilir). */
  order_id?: string | null;
  m2: number;
  panel_width: number;
  panel_length?: number;
  il?: string | null;
  bitis_tarihi?: string | null;
  aciklama?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/** Müşteri teklif talebi (customer_requests tablosu) */
export interface CustomerRequest {
  id: string;
  firma_adi: string;
  yetkili_adi: string;
  email: string;
  telefon?: string | null;
  m2: number;
  panel_width: number;
  panel_length?: number;
  il?: string | null;
  bitis_tarihi?: string | null;
  musteri_notu?: string | null;
  status: string;
  admin_notu?: string | null;
  tahmini_teklif?: string | null;
  converted_order_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Halka açık teklif talebi formu gövdesi */
export interface CustomerRequestCreatePayload {
  firma_adi: string;
  yetkili_adi: string;
  email: string;
  telefon: string;
  m2: number;
  panel_width: number;
  panel_length: number;
  il?: string;
  bitis_tarihi?: string;
  musteri_notu?: string;
}

export interface SavedStockSet {
  id: string;
  name: string;
  rolls: number[];
  created_at?: string;
  updated_at?: string;
}

/** Tek rulo (stock_rolls tablosu) */
export interface StockRoll {
  id: string;
  tonnage: number;
  source: string;
  run_id?: string | null;
  created_at?: string;
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

/**
 * Mod karşılaştırma özetinin CSV indirme URL'ini döndürür.
 * @param fileId - Backend'in döndürdüğü fileId
 */
export function getModeComparisonCsvUrl(fileId: string): string {
  return `${API_BASE}/api/runs/${fileId}/mode-comparison.csv`;
}

/**
 * Senkron seviye karşılaştırma özetinin CSV indirme URL'ini döndürür.
 * @param fileId - Backend'in döndürdüğü fileId
 */
export function getSyncComparisonCsvUrl(fileId: string): string {
  return `${API_BASE}/api/runs/${fileId}/sync-comparison.csv`;
}

/** Geçmiş çalıştırma özeti */
export interface RunSummary {
  id: string;
  file_id: string;
  created_at: string;
  summary: SummaryResponse;
  status: string;
  /** Çalıştırma durumu: saved = beklemede/test, processed = işlendi, cancelled = iptal */
  run_status?: string;
  processed_at?: string | null;
  /** Kısa açıklama (sonuçlar tablosunda ID yerine gösterilir) */
  description?: string | null;
}

/** Geçmiş çalıştırma detayı (OptimizeResponse + createdAt, reportUrl, runStatus) */
export interface RunDetail extends OptimizeResponse {
  createdAt?: string;
  reportUrl?: string;
  runStatus?: string;
  processedAt?: string | null;
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
 * Kayıtlı siparişleri listeler.
 * @param status - Opsiyonel durum filtresi (örn. 'Pending')
 */
export async function getOrders(status?: string): Promise<{ orders: Order[] }> {
  const url = status ? `${API_BASE}/api/orders?status=${encodeURIComponent(status)}` : `${API_BASE}/api/orders`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Siparişler yüklenemedi');
  return res.json();
}

/**
 * FastAPI `detail` alanını (string veya doğrulama dizisi) tek satır mesaja çevirir.
 */
function formatFastApiDetail(detail: unknown): string {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === 'object' && item !== null && 'msg' in item
          ? String((item as { msg: string }).msg)
          : JSON.stringify(item),
      )
      .join(' ');
  }
  return String(detail);
}

/**
 * Sipariş kaydeder veya günceller.
 */
export async function saveOrder(data: {
  id?: string;
  order_id?: string;
  m2: number;
  panel_width: number;
  panel_length?: number;
  il?: string;
  bitis_tarihi?: string;
  aciklama?: string;
  status?: string;
}): Promise<Order> {
  const url = `${API_BASE}/api/orders`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Sipariş kaydedilemedi' }));
    const msg = formatFastApiDetail(err.detail) || 'Sipariş kaydedilemedi';
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Siparişi siler.
 */
export async function deleteOrder(orderId: string): Promise<void> {
  const url = `${API_BASE}/api/orders/${orderId}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('Sipariş silinemedi');
}

/**
 * Halka açık teklif talebi oluşturur (giriş gerekmez).
 */
export async function createCustomerRequest(
  payload: CustomerRequestCreatePayload,
): Promise<{ customerRequest: CustomerRequest }> {
  const url = `${API_BASE}/api/customer-requests`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Talep gönderilemedi' }));
    throw new Error(formatFastApiDetail(err.detail) || 'Talep gönderilemedi');
  }
  return res.json();
}

/**
 * Müşteri taleplerini listeler.
 */
export async function getCustomerRequests(
  status?: string,
): Promise<{ customerRequests: CustomerRequest[] }> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const url = `${API_BASE}/api/customer-requests${qs}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Talepler yüklenemedi' }));
    throw new Error(formatFastApiDetail(err.detail) || 'Talepler yüklenemedi');
  }
  return res.json();
}

/**
 * Müşteri talebini günceller (durum, admin notu, tahmini teklif).
 */
export async function patchCustomerRequest(
  id: string,
  body: { status?: string; admin_notu?: string; tahmini_teklif?: string },
): Promise<{ customerRequest: CustomerRequest }> {
  const url = `${API_BASE}/api/customer-requests/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Talep güncellenemedi' }));
    throw new Error(formatFastApiDetail(err.detail) || 'Talep güncellenemedi');
  }
  return res.json();
}

/**
 * Reddedilmiş müşteri talebini kalıcı olarak siler (backend yalnızca status=rejected kabul eder).
 */
export async function deleteCustomerRequest(id: string): Promise<void> {
  const url = `${API_BASE}/api/customer-requests/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Talep silinemedi' }));
    throw new Error(formatFastApiDetail(err.detail) || 'Talep silinemedi');
  }
}

/**
 * Talebi onaylayıp sipariş oluşturur ve talebi converted yapar.
 */
export async function convertCustomerRequestToOrder(
  requestId: string,
  order: {
    order_id: string;
    m2: number;
    panel_width: number;
    panel_length?: number;
    il?: string;
    bitis_tarihi?: string;
    aciklama?: string;
    status?: string;
  },
): Promise<{ order: Order; customerRequest: CustomerRequest }> {
  const url = `${API_BASE}/api/customer-requests/${encodeURIComponent(requestId)}/convert-to-order`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Siparişe dönüştürülemedi' }));
    throw new Error(formatFastApiDetail(err.detail) || 'Siparişe dönüştürülemedi');
  }
  return res.json();
}

/**
 * Kayıtlı stok rulolarını listeler.
 */
export async function getStockRolls(): Promise<{ stockRolls: StockRoll[] }> {
  const url = `${API_BASE}/api/stock-rolls`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Stok ruloları yüklenemedi');
  return res.json();
}

/**
 * Yeni rulo ekler.
 */
export async function addStockRoll(tonnage: number): Promise<StockRoll> {
  const url = `${API_BASE}/api/stock-rolls`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tonnage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Rulo eklenemedi' }));
    throw new Error(formatFastApiDetail(err.detail) || 'Rulo eklenemedi');
  }
  return res.json();
}

/**
 * Rulo tonajını günceller.
 */
export async function updateStockRoll(rollId: string, tonnage: number): Promise<StockRoll> {
  const url = `${API_BASE}/api/stock-rolls/${rollId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tonnage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Rulo güncellenemedi' }));
    throw new Error(formatFastApiDetail(err.detail) || 'Rulo güncellenemedi');
  }
  return res.json();
}

/**
 * Ruloyu siler.
 */
export async function deleteStockRoll(rollId: string): Promise<void> {
  const url = `${API_BASE}/api/stock-rolls/${rollId}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Rulo silinemedi' }));
    throw new Error(formatFastApiDetail(err.detail) || 'Rulo silinemedi');
  }
}

/**
 * Optimizasyon sonucunu işleme alır.
 */
export async function processResult(fileId: string): Promise<{ ok: boolean; fileId: string }> {
  const url = `${API_BASE}/api/process-result/${fileId}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'İşleme alınamadı' }));
    throw new Error(err.detail || 'İşleme alınamadı');
  }
  return res.json();
}

/**
 * Optimizasyon çalıştırmasını iptal olarak işaretler.
 */
export async function cancelRun(fileId: string): Promise<{ ok: boolean; fileId: string }> {
  const url = `${API_BASE}/api/runs/${fileId}/cancel`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'İptal edilemedi' }));
    throw new Error(err.detail || 'İptal edilemedi');
  }
  return res.json();
}

/** Geriye dönük uyumluluk - orders tablosundan set benzeri dönüşüm */
export async function getOrderSets(): Promise<{ orderSets: SavedOrderSet[] }> {
  const { orders } = await getOrders();
  if (orders.length === 0) return { orderSets: [] };
  return {
    orderSets: [{
      id: 'all',
      name: 'Tüm Siparişler',
      orders: orders.map(o => ({
        orderId: o.id,
        m2: o.m2,
        panelWidth: o.panel_width,
        panelLength: o.panel_length ?? 1,
      })),
      created_at: orders[0]?.created_at,
      updated_at: orders[0]?.updated_at,
    }],
  };
}

/** @deprecated Yeni yapıda saveOrder kullanın */
export async function saveOrderSet(_name: string, _orders: OrderInput[], _setId?: string): Promise<SavedOrderSet> {
  throw new Error('Sipariş seti kaldırıldı. Tek tek sipariş ekleyin.');
}

/** @deprecated Yeni yapıda deleteOrder kullanın */
export async function deleteOrderSet(_setId: string): Promise<void> {
  throw new Error('Sipariş seti kaldırıldı.');
}

/** Geriye dönük uyumluluk - stock_rolls'tan set benzeri dönüşüm */
export async function getStockSets(): Promise<{ stockSets: SavedStockSet[] }> {
  const { stockRolls } = await getStockRolls();
  if (stockRolls.length === 0) return { stockSets: [] };
  return {
    stockSets: [{
      id: 'all',
      name: 'Mevcut Rulolar',
      rolls: stockRolls.map(r => r.tonnage),
      created_at: stockRolls[0]?.created_at,
      updated_at: stockRolls[0]?.created_at,
    }],
  };
}

/** @deprecated Yeni yapıda addStockRoll kullanın */
export async function saveStockSet(_name: string, rolls: number[], _setId?: string): Promise<SavedStockSet> {
  for (const t of rolls) {
    if (t > 0) await addStockRoll(t);
  }
  return { id: 'all', name: 'Rulolar', rolls, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
}

/** @deprecated Tek rulo silmek için deleteStockRoll kullanın */
export async function deleteStockSet(_setId: string): Promise<void> {
  throw new Error('Set kaldırıldı. Tek tek rulo silin.');
}
