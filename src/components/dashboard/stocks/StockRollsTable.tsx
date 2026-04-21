'use client';

import { useMemo, useState } from 'react';
import type { StockRoll } from '@/lib/api';
import { formatTonDisplayTr } from '@/components/dashboard/orders/helpers';
import { StockRollImportDropdown } from './StockRollImportDropdown';

interface StockRollsTableProps {
  rolls: StockRoll[];
  loading: boolean;
  onAddRoll: () => void;
  onEditRoll: (roll: StockRoll) => void;
  onDeleteRoll: (roll: StockRoll) => void;
  /** Verilirse çoklu seçim ve "Seçilenleri sil" gösterilir. */
  onDeleteRolls?: (rolls: StockRoll[]) => void | Promise<void>;
  /** Excel/CSV/XML’den okunan ton değerleriyle ruloları sırayla oluşturur. */
  onImportTonnages?: (tonnages: number[]) => Promise<void>;
}

/**
 * Rulo listesi tablosu. Her satır = 1 rulo (tonaj).
 * onDeleteRolls verilirse checkbox ile çoklu seçim ve toplu silme yapılabilir.
 */
export function StockRollsTable({
  rolls,
  loading,
  onAddRoll,
  onEditRoll,
  onDeleteRoll,
  onDeleteRolls,
  onImportTonnages,
}: StockRollsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === rolls.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(rolls.map((r) => r.id)));
  };

  const selectedRolls = useMemo(() => rolls.filter((r) => selectedIds.has(r.id)), [rolls, selectedIds]);
  const hasSelection = selectedIds.size > 0;

  /** Rulonun kaç gündür stokta olduğunu hesaplar (created_at → bugün). */
  function daysInStock(createdAt?: string | null): number | null {
    if (!createdAt) return null;
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return null;
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  }

  /**
   * Stok süresini etiket olarak döndürür.
   * Tam hafta (7, 14, 21…) ise "N hafta", tam ay (30, 60, 90…) ise "N ay";
   * diğer durumlarda "N gün" (örn. 43 gün, 51 gün).
   */
  function formatStockDuration(days: number | null): string {
    if (days === null) return '—';
    if (days === 0) return 'Yeni';
    if (days >= 7 && days % 7 === 0) return `${days / 7} hafta`;
    if (days >= 30 && days % 30 === 0) return `${days / 30} ay`;
    return `${days} gün`;
  }

  function getSourceLabel(source: string): string {
    if (source === 'optimization_leftover') return 'Optimizasyondan';
    return 'Manuel';
  }

  const totalTon = rolls.reduce((sum, r) => sum + Number(r.tonnage), 0);

  /** Rulo no = eklenme sırasına göre sabit ID (en eski = 1, yeni eklenen = N). */
  const rollNoById = useMemo(() => {
    const sorted = [...rolls].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (ta !== tb) return ta - tb;
      return (a.id || '').localeCompare(b.id || '');
    });
    const map = new Map<string, number>();
    sorted.forEach((r, idx) => map.set(r.id, idx + 1));
    return map;
  }, [rolls]);

  return (
    <section className="overflow-hidden rounded-xl border border-primary/5 bg-white shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/5 bg-slate-50/70 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Stok Ruloları</h2>
          <p className="text-xs text-slate-500">
            Toplam {rolls.length} rulo, {totalTon.toFixed(1)} ton
            {hasSelection && ` · ${selectedIds.size} seçili`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onDeleteRolls && hasSelection && (
            <button
              type="button"
              onClick={async () => {
                if (selectedRolls.length === 0) return;
                await onDeleteRolls(selectedRolls);
                setSelectedIds(new Set());
              }}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
              Seçilenleri sil ({selectedIds.size})
            </button>
          )}
          {onImportTonnages && <StockRollImportDropdown onImportedTonnages={onImportTonnages} disabled={loading} />}
          <button
            type="button"
            onClick={onAddRoll}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Yeni Rulo Ekle
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {onDeleteRolls && (
                <th className="w-12 border-b border-primary/5 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={rolls.length > 0 && selectedIds.size === rolls.length}
                    onChange={toggleAll}
                    className="rounded border-slate-300"
                    aria-label="Tümünü seç"
                  />
                </th>
              )}
              <th className="border-b border-primary/5 px-6 py-4">Rulo No</th>
              <th className="border-b border-primary/5 px-6 py-4">Tonaj (ton)</th>
              <th className="border-b border-primary/5 px-6 py-4">Kaynak</th>
              <th className="border-b border-primary/5 px-6 py-4">Stok süresi</th>
              <th className="border-b border-primary/5 px-6 py-4 text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5 text-sm">
            {loading ? (
              <tr>
                <td colSpan={onDeleteRolls ? 6 : 5} className="px-6 py-8 text-sm text-slate-500">
                  Yükleniyor...
                </td>
              </tr>
            ) : rolls.length === 0 ? (
              <tr>
                <td colSpan={onDeleteRolls ? 6 : 5} className="px-6 py-8 text-center text-slate-500">
                  Henüz rulo yok. Yeni rulo ekleyin.
                </td>
              </tr>
            ) : (
              rolls.map((roll) => {
                const days = daysInStock(roll.created_at);
                const rollNo = rollNoById.get(roll.id) ?? '-';
                return (
                  <tr key={roll.id} className={`hover:bg-slate-50/50 ${selectedIds.has(roll.id) ? 'bg-primary/5' : ''}`}>
                    {onDeleteRolls && (
                      <td className="w-12 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(roll.id)}
                          onChange={() => toggleOne(roll.id)}
                          className="rounded border-slate-300"
                          aria-label={`Rulo #${rollNo} seç`}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 font-medium text-slate-900">#{rollNo}</td>
                    <td className="px-6 py-4">{formatTonDisplayTr(Number(roll.tonnage))}</td>
                    <td className="px-6 py-4 text-slate-600">{getSourceLabel(roll.source)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {formatStockDuration(days)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditRoll(roll)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRoll(roll)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
