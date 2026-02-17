'use client';

import { DashboardCard } from './DashboardCard';

export interface ScenarioSelectionCardProps {
  safetyStock?: number;
  onSafetyStockChange?: (v: number) => void;
  maxOrdersPerRoll?: number;
  onMaxOrdersPerRollChange?: (v: number) => void;
  maxRollsPerOrder?: number;
  onMaxRollsPerOrderChange?: (v: number) => void;
}

/**
 * Senaryo seçimi kartı: optimizasyon stratejisi, güvenlik stoğu ve rulo/sipariş limitleri.
 */
export function ScenarioSelectionCard({
  safetyStock = 12,
  onSafetyStockChange,
  maxOrdersPerRoll = 8,
  onMaxOrdersPerRollChange,
  maxRollsPerOrder = 5,
  onMaxRollsPerOrderChange,
}: ScenarioSelectionCardProps) {
  return (
    <DashboardCard title="Senaryo Seçimi" icon="tune" animationDelayMs={100}>
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Optimizasyon Stratejisi
          </label>
          <div className="relative">
            <select className="block w-full appearance-none rounded-lg border border-slate-300 bg-white py-3 pl-4 pr-10 text-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all duration-200">
              <option>Standart Verimlilik (Fireyi Azalt)</option>
              <option>Yüksek Üretim (Hız)</option>
              <option>Dengeli Yaklaşım</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>
        </div>
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Güvenlik Stoğu %</label>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {safetyStock}%
              </span>
            </div>
            <input
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary transition-opacity hover:opacity-90"
              type="range"
              min={0}
              max={30}
              value={safetyStock}
              onChange={
                onSafetyStockChange
                  ? (e) => onSafetyStockChange(parseInt(e.target.value, 10))
                  : undefined
              }
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                1 ruloda maksimum kaç farklı sipariş?
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Bir rulo en fazla kaç farklı siparişe kesilebilir
              </p>
              <input
                className="block w-full rounded-md border border-slate-300 text-sm py-2 px-3 focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                type="number"
                min={1}
                value={maxOrdersPerRoll}
                onChange={
                  onMaxOrdersPerRollChange
                    ? (e) => onMaxOrdersPerRollChange(Math.max(1, parseInt(e.target.value, 10) || 1))
                    : undefined
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                1 sipariş için maksimum kaç rulo?
              </label>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Bir sipariş en fazla kaç farklı rulodan kesilebilir
              </p>
              <input
                className="block w-full rounded-md border border-slate-300 text-sm py-2 px-3 focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
                type="number"
                min={1}
                value={maxRollsPerOrder}
                onChange={
                  onMaxRollsPerOrderChange
                    ? (e) => onMaxRollsPerOrderChange(Math.max(1, parseInt(e.target.value, 10) || 1))
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
