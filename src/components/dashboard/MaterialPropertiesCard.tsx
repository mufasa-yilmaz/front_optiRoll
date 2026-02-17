'use client';

import { DashboardCard } from './DashboardCard';

export interface MaterialPropertiesCardProps {
  thickness?: number;
  onThicknessChange?: (v: number) => void;
  density?: number;
  onDensityChange?: (v: number) => void;
}

/**
 * Malzeme özellikleri kartı: kalınlık girişi ve yoğunluk bilgisi.
 */
export function MaterialPropertiesCard({
  thickness = 0.75,
  onThicknessChange,
  density = 7850,
  onDensityChange,
}: MaterialPropertiesCardProps) {
  const controlled = onThicknessChange != null;

  return (
    <DashboardCard title="Malzeme Özellikleri" icon="layers" animationDelayMs={50}>
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Kalınlık
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              className="block w-full rounded-lg border border-slate-300 pl-4 pr-12 focus:border-secondary focus:ring-2 focus:ring-secondary/30 sm:text-sm py-3 transition-all duration-200"
              placeholder="0.00"
              type="number"
              value={controlled ? thickness : undefined}
              defaultValue={controlled ? undefined : 0.75}
              step="0.01"
              onChange={
                onThicknessChange
                  ? (e) => onThicknessChange(parseFloat(e.target.value) || 0)
                  : undefined
              }
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span className="text-slate-400 font-medium sm:text-sm">mm</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4 bg-secondary/10 rounded-lg border border-secondary/20 transition-colors hover:border-secondary/30">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Malzeme Yoğunluğu
          </span>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">science</span>
            {onDensityChange ? (
              <input
                type="number"
                value={density}
                onChange={(e) => onDensityChange(parseFloat(e.target.value) || 0)}
                className="text-lg font-bold text-primary font-display w-32 bg-transparent border-b border-primary/30 focus:outline-none focus:border-primary"
              />
            ) : (
              <span className="text-lg font-bold text-primary font-display">7850 kg/m³</span>
            )}
          </div>
          <p className="text-xs text-slate-600">kg/m³ (Standart çelik: 7850)</p>
        </div>
      </div>
    </DashboardCard>
  );
}
