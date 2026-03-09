'use client';

import { useMemo } from 'react';
import type { StockRoll } from '@/lib/api';

interface StockRollsTableProps {
  rolls: StockRoll[];
  loading: boolean;
  onAddRoll: () => void;
  onEditRoll: (roll: StockRoll) => void;
  onDeleteRoll: (roll: StockRoll) => void;
}

/**
 * Rulo listesi tablosu. Her satır = 1 rulo (tonaj).
 * "Yeni Rulo Ekle" butonu tablo toolbar'ında.
 */
export function StockRollsTable({ rolls, loading, onAddRoll, onEditRoll, onDeleteRoll }: StockRollsTableProps) {
  function formatDate(value?: string | null): string {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('tr-TR');
  }

  /** Rulonun kaç gündür stokta olduğunu hesaplar (created_at → bugün). */
  function daysInStock(createdAt?: string | null): number | null {
    if (!createdAt) return null;
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return null;
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000));
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
          </p>
        </div>
        <button
          type="button"
          onClick={onAddRoll}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Yeni Rulo Ekle
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="border-b border-primary/5 px-6 py-4">Rulo No</th>
              <th className="border-b border-primary/5 px-6 py-4">Tonaj (ton)</th>
              <th className="border-b border-primary/5 px-6 py-4">Kaynak</th>
              <th className="border-b border-primary/5 px-6 py-4">Gündür stokta</th>
              <th className="border-b border-primary/5 px-6 py-4">Eklenme Tarihi</th>
              <th className="border-b border-primary/5 px-6 py-4 text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-sm text-slate-500">
                  Yükleniyor...
                </td>
              </tr>
            ) : rolls.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Henüz rulo yok. Yeni rulo ekleyin.
                </td>
              </tr>
            ) : (
              rolls.map((roll) => {
                const days = daysInStock(roll.created_at);
                const rollNo = rollNoById.get(roll.id) ?? '-';
                return (
                  <tr key={roll.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">#{rollNo}</td>
                    <td className="px-6 py-4">{Number(roll.tonnage).toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-600">{getSourceLabel(roll.source)}</td>
                    <td className="px-6 py-4">
                      {days !== null ? `${days} gün` : '-'}
                    </td>
                    <td className="px-6 py-4">{formatDate(roll.created_at)}</td>
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
