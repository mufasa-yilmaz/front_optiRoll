'use client';

import { DashboardCard } from './DashboardCard';

export interface CostParametersCardProps {
  fireCost?: number;
  onFireCostChange?: (v: number) => void;
  setupCost?: number;
  onSetupCostChange?: (v: number) => void;
  stockCost?: number;
  onStockCostChange?: (v: number) => void;
}

/**
 * Maliyet parametreleri kartı: fire maliyeti (cf), rulo açılış (A), elde tutma maliyeti (h).
 */
export function CostParametersCard({
  fireCost = 450,
  onFireCostChange,
  setupCost = 120,
  onSetupCostChange,
  stockCost = 2.5,
  onStockCostChange,
}: CostParametersCardProps) {
  return (
    <DashboardCard title="Maliyet Parametreleri" icon="payments" animationDelayMs={150}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="group">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-secondary transition-colors duration-200">
            Fire Maliyeti (cf)
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">₺</span>
            </div>
            <input
              className="block w-full rounded-lg border border-slate-300 pl-8 focus:border-secondary focus:ring-2 focus:ring-secondary/30 sm:text-sm py-2.5 transition-all duration-200"
              placeholder="0.00"
              type="number"
              step="1"
              value={fireCost}
              onChange={
                onFireCostChange
                  ? (e) => onFireCostChange(parseFloat(e.target.value) || 0)
                  : undefined
              }
            />
          </div>
        </div>
        <div className="group">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-secondary transition-colors duration-200">
            Rulo Açılış (A)
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">₺</span>
            </div>
            <input
              className="block w-full rounded-lg border border-slate-300 pl-8 focus:border-secondary focus:ring-2 focus:ring-secondary/30 sm:text-sm py-2.5 transition-all duration-200"
              placeholder="0.00"
              type="number"
              step="1"
              value={setupCost}
              onChange={
                onSetupCostChange
                  ? (e) => onSetupCostChange(parseFloat(e.target.value) || 0)
                  : undefined
              }
            />
          </div>
        </div>
        <div className="group">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-secondary transition-colors duration-200">
            Elde Tutma Maliyeti (h)
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">₺/ton</span>
            </div>
            <input
              className="block w-full rounded-lg border border-slate-300 pl-14 focus:border-secondary focus:ring-2 focus:ring-secondary/30 sm:text-sm py-2.5 transition-all duration-200"
              placeholder="0"
              type="number"
              min={0}
              step="1"
              value={stockCost}
              onChange={
                onStockCostChange
                  ? (e) => onStockCostChange(Math.max(0, parseInt(e.target.value, 10) || 0))
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
