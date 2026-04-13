/** İçe aktarımda işlenecek maksimum satır sayısı (aşırı yükü önler). */
const MAX_IMPORT_TONNAGE_ROWS = 2000;

/**
 * CSV metninden her satırın ilk hücresindeki pozitif ton değerlerini çıkarır (virgül veya noktalı virgül ayırıcı).
 */
export function parseTonnagesFromCsv(content: string): number[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: number[] = [];
  for (const line of lines) {
    const raw = line.split(/[;,]/)[0]?.trim().replace(/\s/g, '').replace(',', '.') ?? '';
    const n = parseFloat(raw);
    if (Number.isFinite(n) && n > 0) out.push(n);
  }
  return out.slice(0, MAX_IMPORT_TONNAGE_ROWS);
}

/**
 * Basit stok XML’inden ton listesi çıkarır: `roll`/`rulo` üzerinde `tonnage` özniteliği veya `tonnage` etiketi metni.
 */
export function parseTonnagesFromXml(xml: string): number[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('XML ayrıştırılamadı. Geçerli bir XML dosyası seçin.');
  }
  const out: number[] = [];
  doc.querySelectorAll('roll[tonnage], rulo[tonnage]').forEach((el) => {
    const raw = String(el.getAttribute('tonnage') ?? '').trim().replace(',', '.');
    const n = parseFloat(raw);
    if (Number.isFinite(n) && n > 0) out.push(n);
  });
  doc.querySelectorAll('tonnage, Tonaj, tonaj').forEach((el) => {
    const raw = String(el.textContent ?? '').trim().replace(/\s/g, '').replace(',', '.');
    const n = parseFloat(raw);
    if (Number.isFinite(n) && n > 0) out.push(n);
  });
  return out.slice(0, MAX_IMPORT_TONNAGE_ROWS);
}

/**
 * Excel çalışma kitabının ilk sayfasından A sütunundaki pozitif sayıları ton listesi olarak okur.
 */
export async function parseTonnagesFromXlsx(buffer: ArrayBuffer): Promise<number[]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const name = wb.SheetNames[0];
  if (!name) return [];
  const sheet = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
  const out: number[] = [];
  for (const row of rows) {
    const cell = row[0];
    const n = typeof cell === 'number' ? cell : parseFloat(String(cell).trim().replace(/\s/g, '').replace(',', '.'));
    if (Number.isFinite(n) && n > 0) out.push(n);
    if (out.length >= MAX_IMPORT_TONNAGE_ROWS) break;
  }
  return out;
}

/**
 * Dosya uzantısına göre CSV, XML veya Excel okuyup ton listesi döndürür.
 */
export async function parseStockRollImportFile(file: File): Promise<number[]> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (ext === 'csv' || ext === 'txt') {
    const text = await file.text();
    return parseTonnagesFromCsv(text);
  }
  if (ext === 'xml') {
    const text = await file.text();
    return parseTonnagesFromXml(text);
  }
  if (ext === 'xlsx' || ext === 'xls') {
    const buf = await file.arrayBuffer();
    return parseTonnagesFromXlsx(buf);
  }
  throw new Error(`Desteklenmeyen dosya türü (.${ext}). CSV, XML veya Excel seçin.`);
}
