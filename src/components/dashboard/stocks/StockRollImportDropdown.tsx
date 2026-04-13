'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { parseStockRollImportFile } from '@/lib/stockRollImport';

type ImportKind = 'excel' | 'csv' | 'xml';

interface StockRollImportDropdownProps {
  /** Ayrıştırılan her ton için sırayla API çağrısı yapılır; tamamlandığında liste yenilenmeli. */
  onImportedTonnages: (tonnages: number[]) => Promise<void>;
  /** Tablo yüklenirken tıklamayı kapatır. */
  disabled?: boolean;
}

/**
 * Dosya seçiciyi sıfırlayıp programatik olarak açar (açılır menü kapanışı ile çakışmaması için gecikme kullanılabilir).
 */
function triggerInput(input: HTMLInputElement | null) {
  if (!input) return;
  input.value = '';
  input.click();
}

/**
 * Menü kapandıktan sonra dosya diyaloğunun güvenilir şekilde açılması için kısa gecikmeyle tetikler.
 */
function triggerInputAfterMenuClose(input: HTMLInputElement | null) {
  window.setTimeout(() => triggerInput(input), 0);
}

/**
 * Stok tablosu araç çubuğunda Excel / CSV / XML içe aktarma için açılır menü ve gizli dosya girişleri.
 */
export function StockRollImportDropdown({ onImportedTonnages, disabled }: StockRollImportDropdownProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const xmlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  /**
   * Seçilen dosyayı ayrıştırıp üst bileşene iletir; hata ve boş listelerde kullanıcıya bildirir.
   */
  async function handleFileSelected(kind: ImportKind, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    setOpen(false);
    if (!file || disabled || importing) return;
    const extHint =
      kind === 'excel' ? 'Excel' : kind === 'csv' ? 'CSV' : 'XML';
    try {
      setImporting(true);
      const tonnages = await parseStockRollImportFile(file);
      if (tonnages.length === 0) {
        toast.error(`${extHint} dosyasında geçerli ton bulunamadı.`);
        return;
      }
      await onImportedTonnages(tonnages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${extHint} içe aktarılamadı.`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        aria-hidden
        onChange={(e) => void handleFileSelected('excel', e)}
      />
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv,.txt"
        className="hidden"
        aria-hidden
        onChange={(e) => void handleFileSelected('csv', e)}
      />
      <input
        ref={xmlInputRef}
        type="file"
        accept=".xml,text/xml,application/xml"
        className="hidden"
        aria-hidden
        onChange={(e) => void handleFileSelected('xml', e)}
      />

      <button
        type="button"
        disabled={disabled || importing}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="material-symbols-outlined text-lg">upload_file</span>
        {importing ? 'İçe aktarılıyor…' : 'İçe aktar'}
        <span className="material-symbols-outlined text-lg">{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[220px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              triggerInputAfterMenuClose(excelInputRef.current);
            }}
          >
            <span className="material-symbols-outlined text-lg text-emerald-600">table_chart</span>
            Excel (.xlsx, .xls)
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              triggerInputAfterMenuClose(csvInputRef.current);
            }}
          >
            <span className="material-symbols-outlined text-lg text-sky-600">description</span>
            CSV
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              triggerInputAfterMenuClose(xmlInputRef.current);
            }}
          >
            <span className="material-symbols-outlined text-lg text-violet-600">code</span>
            XML
          </button>
        </div>
      )}
    </div>
  );
}
