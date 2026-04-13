/** İçe aktarımda işlenecek maksimum sipariş satırı. */
const MAX_ORDER_IMPORT_ROWS = 2000;

/** İçe aktarımdan sonra API’ye gönderilecek sipariş alanları. */
export type OrderImportRow = {
  order_id: string;
  m2: number;
  panel_width: number;
  panel_length: number;
  il?: string;
  bitis_tarihi?: string;
  aciklama?: string;
};

type OrderImportField = keyof OrderImportRow;

const FIXED_COLUMN_MAP: Record<OrderImportField, number> = {
  order_id: 0,
  m2: 1,
  panel_width: 2,
  panel_length: 3,
  il: 4,
  bitis_tarihi: 5,
  aciklama: 6,
};

/**
 * Başlık metnini alan adına eşler; tanınmazsa null döner.
 */
function headerCellToField(raw: string): OrderImportField | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  const map: Record<string, OrderImportField> = {
    order_id: 'order_id',
    siparis: 'order_id',
    siparis_adi: 'order_id',
    siparisadi: 'order_id',
    siparis_no: 'order_id',
    name: 'order_id',
    id: 'order_id',
    m2: 'm2',
    talep: 'm2',
    metrekare: 'm2',
    panel_width: 'panel_width',
    genislik: 'panel_width',
    panel_genisligi: 'panel_width',
    panel_genislik: 'panel_width',
    kesim_genisligi: 'panel_width',
    panel_length: 'panel_length',
    uzunluk: 'panel_length',
    panel_uzunlugu: 'panel_length',
    kesim_uzunlugu: 'panel_length',
    il: 'il',
    sehir: 'il',
    konum: 'il',
    bitis_tarihi: 'bitis_tarihi',
    bitis: 'bitis_tarihi',
    teslim: 'bitis_tarihi',
    teslim_tarihi: 'bitis_tarihi',
    aciklama: 'aciklama',
    not: 'aciklama',
    description: 'aciklama',
  };
  return map[s] ?? null;
}

/**
 * CSV satırını noktalı virgül veya virgül ile hücrelere böler (Türkçe Excel için `;` öncelikli).
 */
function splitDataLine(line: string): string[] {
  const semi = line.split(';').map((c) => c.trim());
  const comma = line.split(',').map((c) => c.trim());
  if (semi.length >= 2 && semi.length >= comma.length) return semi;
  return comma;
}

/**
 * Metinden sayı okur (boşluk ve ondalık virgül toleranslı).
 */
function parsePositiveNumber(raw: string): number | null {
  const n = parseFloat(String(raw ?? '').replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Tarih alanını YYYY-MM-DD veya GG.AA.YYYY biçiminde normalize eder.
 */
function normalizeDateInput(raw: string): string | undefined {
  const t = String(raw ?? '').trim();
  if (!t) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(t);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }
  return undefined;
}

/**
 * İlk satır başlık satırı mı diye kolon eşlemesi üretir; zorunlu alanlar yoksa null.
 */
function tryBuildHeaderColumnMap(headerCells: string[]): Partial<Record<OrderImportField, number>> | null {
  const colMap: Partial<Record<OrderImportField, number>> = {};
  headerCells.forEach((cell, i) => {
    const f = headerCellToField(cell);
    if (f) colMap[f] = i;
  });
  if (colMap.order_id !== undefined && colMap.m2 !== undefined && colMap.panel_width !== undefined) {
    return colMap;
  }
  return null;
}

/**
 * Hücre dizisi ve kolon haritasından tek sipariş satırı üretir; geçersizse null.
 */
function rowFromCells(cells: string[], colMap: Partial<Record<OrderImportField, number>>): OrderImportRow | null {
  const get = (f: OrderImportField): string => {
    const i = colMap[f];
    if (i === undefined) return '';
    return String(cells[i] ?? '').trim();
  };

  const order_id = get('order_id');
  const m2 = parsePositiveNumber(get('m2'));
  const panel_width = parsePositiveNumber(get('panel_width'));
  const plRaw = get('panel_length');
  const panel_lengthParsed = plRaw ? parsePositiveNumber(plRaw) : null;
  const panel_length = panel_lengthParsed && panel_lengthParsed > 0 ? panel_lengthParsed : 1;

  if (!order_id || m2 === null || panel_width === null) return null;

  const ilRaw = get('il');
  const bitisRaw = get('bitis_tarihi');
  const aciklamaRaw = get('aciklama');

  return {
    order_id,
    m2,
    panel_width,
    panel_length,
    il: ilRaw || undefined,
    bitis_tarihi: normalizeDateInput(bitisRaw),
    aciklama: aciklamaRaw || undefined,
  };
}

/**
 * Başlık satırı olmadan sabit sütun sırası (A–G) ile kolon haritası oluşturur.
 */
function fixedColumnMap(): Partial<Record<OrderImportField, number>> {
  return { ...FIXED_COLUMN_MAP };
}

/**
 * CSV metninden sipariş satırlarını okur; ilk satır tanınan başlıksa atlanır.
 */
export function parseOrdersFromCsv(content: string): { rows: OrderImportRow[]; skippedLines: number } {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { rows: [], skippedLines: 0 };

  const firstCells = splitDataLine(lines[0] ?? '');
  const headerMap = tryBuildHeaderColumnMap(firstCells);
  const dataLines = headerMap ? lines.slice(1) : lines;
  const colMap = headerMap ?? fixedColumnMap();

  const rows: OrderImportRow[] = [];
  let skippedLines = 0;

  for (const line of dataLines) {
    if (rows.length >= MAX_ORDER_IMPORT_ROWS) break;
    const cells = splitDataLine(line);
    const row = rowFromCells(cells, colMap);
    if (row) rows.push(row);
    else skippedLines += 1;
  }

  return { rows, skippedLines };
}

/**
 * XML içindeki `order` / `siparis` elemanlarından sipariş listesi çıkarır (öznitelik veya alt etiket).
 */
export function parseOrdersFromXml(xml: string): { rows: OrderImportRow[]; skippedLines: number } {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('XML ayrıştırılamadı. Geçerli bir XML dosyası seçin.');
  }

  /**
   * Tek sipariş elemanından metin veya öznitelik okur.
   */
  function readField(el: Element, field: OrderImportField): string {
    const attrNames: Partial<Record<OrderImportField, string[]>> = {
      order_id: ['order_id', 'siparis_adi', 'siparis', 'name'],
      m2: ['m2', 'talep', 'metrekare'],
      panel_width: ['panel_width', 'genislik', 'panel_genisligi'],
      panel_length: ['panel_length', 'uzunluk', 'kesim_uzunlugu'],
      il: ['il', 'sehir', 'konum'],
      bitis_tarihi: ['bitis_tarihi', 'bitis', 'teslim', 'teslim_tarihi'],
      aciklama: ['aciklama', 'not', 'description'],
    };
    const attrs = attrNames[field] ?? [];
    for (const a of attrs) {
      const v = el.getAttribute(a);
      if (v != null && String(v).trim()) return String(v).trim();
    }
    const tagNames = attrs.map((a) => a.toLowerCase());
    const descendants = Array.from(el.getElementsByTagName('*'));
    for (let i = 0; i < descendants.length; i += 1) {
      const child = descendants[i];
      const tag = child.tagName.toLowerCase();
      if (tagNames.includes(tag)) {
        const t = child.textContent?.trim() ?? '';
        if (t) return t;
      }
    }
    return '';
  }

  const candidates = doc.querySelectorAll('orders order, order, siparisler siparis, siparis');
  const rows: OrderImportRow[] = [];
  let skippedLines = 0;

  candidates.forEach((el) => {
    if (rows.length >= MAX_ORDER_IMPORT_ROWS) return;
    const cells = [
      readField(el, 'order_id'),
      readField(el, 'm2'),
      readField(el, 'panel_width'),
      readField(el, 'panel_length'),
      readField(el, 'il'),
      readField(el, 'bitis_tarihi'),
      readField(el, 'aciklama'),
    ];
    const row = rowFromCells(cells, fixedColumnMap());
    if (row) rows.push(row);
    else skippedLines += 1;
  });

  return { rows, skippedLines };
}

/**
 * Excel’in ilk sayfasından sipariş satırlarını okur (ilk satır başlık olabilir).
 */
export async function parseOrdersFromXlsx(buffer: ArrayBuffer): Promise<{ rows: OrderImportRow[]; skippedLines: number }> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const name = wb.SheetNames[0];
  if (!name) return { rows: [], skippedLines: 0 };
  const sheet = wb.Sheets[name];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];

  const toStr = (v: unknown) => String(v ?? '').trim();
  if (matrix.length === 0) return { rows: [], skippedLines: 0 };

  const firstRow = (matrix[0] ?? []).map(toStr);
  const headerMap = tryBuildHeaderColumnMap(firstRow);
  const dataRows = headerMap ? matrix.slice(1) : matrix;

  const rows: OrderImportRow[] = [];
  let skippedLines = 0;
  const colMap = headerMap ?? fixedColumnMap();

  for (const r of dataRows) {
    if (rows.length >= MAX_ORDER_IMPORT_ROWS) break;
    const cells = r.map(toStr);
    const row = rowFromCells(cells, colMap);
    if (row) rows.push(row);
    else skippedLines += 1;
  }

  return { rows, skippedLines };
}

/**
 * Dosya uzantısına göre sipariş listesi ve atlanan satır sayısını döndürür.
 */
export async function parseOrderImportFile(file: File): Promise<{ rows: OrderImportRow[]; skippedLines: number }> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (ext === 'csv' || ext === 'txt') {
    const text = await file.text();
    return parseOrdersFromCsv(text);
  }
  if (ext === 'xml') {
    const text = await file.text();
    return parseOrdersFromXml(text);
  }
  if (ext === 'xlsx' || ext === 'xls') {
    const buf = await file.arrayBuffer();
    return parseOrdersFromXlsx(buf);
  }
  throw new Error(`Desteklenmeyen dosya türü (.${ext}). CSV, XML veya Excel seçin.`);
}
