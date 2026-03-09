'use client';

import type { ReactNode } from 'react';
import { ROLL_ORDER_UNLIMITED } from '@/lib/api';

export interface ConfigurationSummaryCardProps {
  /** Kalınlık (mm) */
  thickness?: number | null;
  /** Yoğunluk (kg/m³) */
  density?: number | null;
  /** Toplam rulo sayısı */
  rollsCount: number;
  /** Toplam talep (m²) - siparişlerden hesaplanır */
  totalDemandM2: number;
  /** Güvenlik stoğu % */
  safetyStock?: number;
  /** Max sipariş/rulo - ROLL_ORDER_UNLIMITED ise "Sonsuz" gösterilir */
  maxOrdersPerRoll?: number | null;
  /** Max rulo/sipariş - ROLL_ORDER_UNLIMITED ise "Sonsuz" gösterilir */
  maxRollsPerOrder?: number | null;
  /** Alt kısımda gösterilecek CTA (Run butonu vb.) */
  children?: ReactNode;
}

/**
 * Optimizasyon senaryosu özet paneli: malzeme, envanter ve optimizasyon ayarlarının özeti + CTA.
 */
export function ConfigurationSummaryCard({
  thickness,
  density,
  rollsCount,
  totalDemandM2,
  safetyStock = 0,
  maxOrdersPerRoll,
  maxRollsPerOrder,
  children,
}: ConfigurationSummaryCardProps) {
  const formatVal = (v: number | undefined | null, fallback: string) =>
    v != null && v > 0 ? String(v) : fallback;

  const label = (v: number | undefined | null) =>
    v === ROLL_ORDER_UNLIMITED ? 'Sonsuz' : formatVal(v, '—');

  return (
    <div className="w-full rounded-xl bg-white dark:bg-slate-900 p-6 shadow-lg ring-1 ring-slate-200 dark:ring-slate-800">
      <h3 className="mb-6 text-sm font-extrabold uppercase tracking-widest text-slate-400">
        Senaryo Özeti
      </h3>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
            Malzeme
          </p>
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Kalınlık</span>
            <span className="text-sm font-bold">{thickness != null ? `${thickness} mm` : '—'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Yoğunluk</span>
            <span className="text-sm font-bold">
              {density != null ? `${density} kg/m³` : '—'}
            </span>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
            Envanter &amp; Talep
          </p>
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Toplam Rulo</span>
            <span className="text-sm font-bold">{rollsCount}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Toplam Talep</span>
            <span className="text-sm font-bold">{totalDemandM2} m²</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
            Optimizasyon
          </p>
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Max sipariş / rulo</span>
            <span className="text-sm font-bold text-primary">{label(maxOrdersPerRoll)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Max rulo / sipariş</span>
            <span className="text-sm font-bold text-primary">{label(maxRollsPerOrder)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Güvenlik stoğu</span>
            <span className="text-sm font-bold">%{safetyStock}</span>
          </div>
        </div>
      </div>
      {children && <div className="mt-6 w-full">{children}</div>}
    </div>
  );
}
