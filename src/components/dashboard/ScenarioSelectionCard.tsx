'use client';

import { DashboardCard } from './DashboardCard';
import { ROLL_ORDER_UNLIMITED } from '@/lib/api';

export interface ScenarioSelectionCardProps {
  safetyStock?: number;
  onSafetyStockChange?: (v: number) => void;
  maxOrdersPerRoll?: number;
  /** Sayı girerken number, alanı temizlemek için undefined (örn. "Limit koy" tıklanınca). */
  onMaxOrdersPerRollChange?: (v: number | undefined) => void;
  maxRollsPerOrder?: number;
  onMaxRollsPerOrderChange?: (v: number | undefined) => void;
  /** 1 rulodaki sipariş sayısı alanı eksik/hatali ise true olur */
  hasMaxOrdersPerRollError?: boolean;
  /** 1 sipariş için rulo sayısı alanı eksik/hatali ise true olur */
  hasMaxRollsPerOrderError?: boolean;
  /** Doğrulama tekrar tetiklendiğinde animasyonu yeniden başlatmak için key */
  blinkValidationKey?: number;
}

/** Verilen değerin "sonsuz" olarak kabul edilip edilmediğini döner. */
function isUnlimited(value: number | undefined): boolean {
  return value === ROLL_ORDER_UNLIMITED;
}

/**
 * Senaryo seçimi kartı: optimizasyon stratejisi, güvenlik stoğu ve rulo/sipariş limitleri.
 */
export function ScenarioSelectionCard({
  safetyStock = 0,
  onSafetyStockChange,
  maxOrdersPerRoll,
  onMaxOrdersPerRollChange,
  maxRollsPerOrder,
  onMaxRollsPerOrderChange,
  hasMaxOrdersPerRollError,
  hasMaxRollsPerOrderError,
  blinkValidationKey,
}: ScenarioSelectionCardProps) {
  return (
    <DashboardCard title="Senaryo Seçimi" icon="tune" animationDelayMs={100}>
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>Optimizasyon Stratejisi</span>
            <span
              className="material-symbols-outlined text-[14px] text-slate-400 cursor-help"
              title="Modelin önceliğini belirler: fireyi azalt, hızı artır veya dengeli yaklaşım."
            >
              info
            </span>
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
              <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <span>Güvenlik Stoğu %</span>
                <span
                  className="material-symbols-outlined text-[14px] text-slate-400 cursor-help"
                  title="Talep üzeri ekstra üretim yüzdesi; tedarik riskine karşı ek stok."
                >
                  info
                </span>
              </label>
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
          <div className="space-y-6">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">info</span>
              <span>
                <strong>Zorunlu alanlar.</strong> Aşağıdaki her iki limit için bir sayı girmeniz veya &quot;Sonsuz&quot; butonuna tıklamanız gerekir. Boş bırakılamaz.
              </span>
            </p>
            {/* 1 ruloda maksimum kaç farklı sipariş — veri girişi / Sonsuz ayrımı net */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <span>1 ruloda maksimum kaç farklı sipariş?</span>
                <span
                  className="material-symbols-outlined text-[14px] text-slate-400 cursor-help"
                  title="Aynı rulo üzerinde en fazla kaç farklı sipariş kombinasyonu kullanılacağını sınırlar."
                >
                  info
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Bir rulo en fazla kaç farklı siparişe kesilebilir
              </p>
              {isUnlimited(maxOrdersPerRoll) ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-primary/15 px-4 py-2.5 text-sm font-bold text-primary shadow-sm"
                    aria-label="Sonsuz seçili"
                  >
                    <span className="material-symbols-outlined text-xl">all_inclusive</span>
                    Sonsuz
                  </span>
                  {onMaxOrdersPerRollChange && (
                    <button
                      type="button"
                      onClick={() => onMaxOrdersPerRollChange(undefined)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-colors"
                    >
                      Limit koy
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <input
                      key={hasMaxOrdersPerRollError ? `maxOrders-${blinkValidationKey}` : 'maxOrders'}
                      className={`block w-full rounded-lg border-2 text-sm py-2.5 px-3 bg-white focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all ${
                        hasMaxOrdersPerRollError
                          ? 'border-accent-red animate-input-blink-error'
                          : 'border-slate-300'
                      }`}
                      type="number"
                      min={1}
                      placeholder="Sayı girin (zorunlu)"
                      value={maxOrdersPerRoll ?? ''}
                      onChange={
                        onMaxOrdersPerRollChange
                          ? (e) => {
                              const raw = e.target.value;
                              if (raw === '') {
                                onMaxOrdersPerRollChange(undefined);
                                return;
                              }
                              const num = parseInt(raw, 10);
                              if (!Number.isNaN(num)) onMaxOrdersPerRollChange(Math.max(1, num));
                            }
                          : undefined
                      }
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-400 shrink-0 hidden sm:inline">veya</span>
                  {onMaxOrdersPerRollChange && (
                    <button
                      type="button"
                      onClick={() => onMaxOrdersPerRollChange(ROLL_ORDER_UNLIMITED)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-primary hover:bg-primary/5 hover:text-primary transition-all shrink-0"
                    >
                      <span className="material-symbols-outlined text-lg">all_inclusive</span>
                      Sonsuz
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 1 sipariş için maksimum kaç rulo — veri girişi / Sonsuz ayrımı net */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <span>1 sipariş için maksimum kaç rulo?</span>
                <span
                  className="material-symbols-outlined text-[14px] text-slate-400 cursor-help"
                  title="Tek bir siparişin en fazla kaç farklı rulo üzerinden karşılanacağını belirler."
                >
                  info
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Bir sipariş en fazla kaç farklı rulodan kesilebilir
              </p>
              {isUnlimited(maxRollsPerOrder) ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-primary/15 px-4 py-2.5 text-sm font-bold text-primary shadow-sm"
                    aria-label="Sonsuz seçili"
                  >
                    <span className="material-symbols-outlined text-xl">all_inclusive</span>
                    Sonsuz
                  </span>
                  {onMaxRollsPerOrderChange && (
                    <button
                      type="button"
                      onClick={() => onMaxRollsPerOrderChange(undefined)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-colors"
                    >
                      Limit koy
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <input
                      key={hasMaxRollsPerOrderError ? `maxRolls-${blinkValidationKey}` : 'maxRolls'}
                      className={`block w-full rounded-lg border-2 text-sm py-2.5 px-3 bg-white focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all ${
                        hasMaxRollsPerOrderError
                          ? 'border-accent-red animate-input-blink-error'
                          : 'border-slate-300'
                      }`}
                      type="number"
                      min={1}
                      placeholder="Sayı girin (zorunlu)"
                      value={maxRollsPerOrder ?? ''}
                      onChange={
                        onMaxRollsPerOrderChange
                          ? (e) => {
                              const raw = e.target.value;
                              if (raw === '') {
                                onMaxRollsPerOrderChange(undefined);
                                return;
                              }
                              const num = parseInt(raw, 10);
                              if (!Number.isNaN(num)) onMaxRollsPerOrderChange(Math.max(1, num));
                            }
                          : undefined
                      }
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-400 shrink-0 hidden sm:inline">veya</span>
                  {onMaxRollsPerOrderChange && (
                    <button
                      type="button"
                      onClick={() => onMaxRollsPerOrderChange(ROLL_ORDER_UNLIMITED)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-primary hover:bg-primary/5 hover:text-primary transition-all shrink-0"
                    >
                      <span className="material-symbols-outlined text-lg">all_inclusive</span>
                      Sonsuz
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
