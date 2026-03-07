'use client';

import { DashboardCard } from './DashboardCard';

export interface CostParametersCardProps {
  fireCost?: number;
  onFireCostChange?: (v: number) => void;
  setupCost?: number;
  onSetupCostChange?: (v: number) => void;
  stockCost?: number;
  onStockCostChange?: (v: number) => void;
  /** Fire maliyeti alanı eksik/hatali ise true olur */
  hasFireCostError?: boolean;
  /** Rulo açılış maliyeti alanı eksik/hatali ise true olur */
  hasSetupCostError?: boolean;
  /** Elde tutma maliyeti alanı eksik/hatali ise true olur */
  hasStockCostError?: boolean;
  /** Doğrulama tekrar tetiklendiğinde animasyonu yeniden başlatmak için key */
  blinkValidationKey?: number;
}

/**
 * Maliyet parametreleri kartı: fire maliyeti (cf), rulo açılış (A), elde tutma maliyeti (h).
 */
export function CostParametersCard({
  fireCost,
  onFireCostChange,
  setupCost,
  onSetupCostChange,
  stockCost,
  onStockCostChange,
  hasFireCostError,
  hasSetupCostError,
  hasStockCostError,
  blinkValidationKey,
}: CostParametersCardProps) {
  return (
    <DashboardCard title="Maliyet Parametreleri" icon="payments" animationDelayMs={150}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="group">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-secondary transition-colors duration-200 flex items-center gap-1">
            <span>Fire Maliyeti (cf)</span>
            <span
              className="material-symbols-outlined text-[14px] text-slate-400 cursor-help"
              title="Kesim sonrası atılan firelerin birim maliyeti. Toplam fire maliyetini belirler."
            >
              info
            </span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">₺</span>
            </div>
            <input
              key={hasFireCostError ? `fire-${blinkValidationKey}` : 'fire'}
              className={`block w-full rounded-lg border pl-8 focus:border-secondary focus:ring-2 focus:ring-secondary/30 sm:text-sm py-2.5 transition-all duration-200 ${
                hasFireCostError ? 'border-accent-red animate-input-blink-error' : 'border-slate-300'
              }`}
              placeholder="0.00"
              type="number"
              step="1"
              value={fireCost ?? ''}
              onChange={
                onFireCostChange
                  ? (e) => onFireCostChange(parseFloat(e.target.value) || 0)
                  : undefined
              }
            />
          </div>
        </div>
        <div className="group">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-secondary transition-colors duration-200 flex items-center gap-1">
            <span>Rulo Açılış (A)</span>
            <span
              className="material-symbols-outlined text-[14px] text-slate-400 cursor-help"
              title="Yeni bir rulo üretime almanın sabit maliyeti. Fazla rulo açmayı sınırlar."
            >
              info
            </span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">₺</span>
            </div>
            <input
              key={hasSetupCostError ? `setup-${blinkValidationKey}` : 'setup'}
              className={`block w-full rounded-lg border pl-8 focus:border-secondary focus:ring-2 focus:ring-secondary/30 sm:text-sm py-2.5 transition-all duration-200 ${
                hasSetupCostError ? 'border-accent-red animate-input-blink-error' : 'border-slate-300'
              }`}
              placeholder="0.00"
              type="number"
              step="1"
              value={setupCost ?? ''}
              onChange={
                onSetupCostChange
                  ? (e) => onSetupCostChange(parseFloat(e.target.value) || 0)
                  : undefined
              }
            />
          </div>
        </div>
        <div className="group">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-secondary transition-colors duration-200 flex items-center gap-1">
            <span>Elde Tutma Maliyeti (h)</span>
            <span
              className="material-symbols-outlined text-[14px] text-slate-400 cursor-help"
              title="Stokta bekleyen ton başına maliyet (finansman, depolama vb.)."
            >
              info
            </span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">₺/ton</span>
            </div>
            <input
              key={hasStockCostError ? `stock-${blinkValidationKey}` : 'stock'}
              className={`block w-full rounded-lg border pl-14 focus:border-secondary focus:ring-2 focus:ring-secondary/30 sm:text-sm py-2.5 transition-all duration-200 ${
                hasStockCostError ? 'border-accent-red animate-input-blink-error' : 'border-slate-300'
              }`}
              placeholder="0"
              type="number"
              min={0}
              step="1"
              value={stockCost ?? ''}
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
