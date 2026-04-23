'use client';

import { DashboardCard } from './DashboardCard';
import { ROLL_ORDER_UNLIMITED, type SyncLevel } from '@/lib/api';

export interface ScenarioSelectionCardProps {
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
  /** Seçilen senkron seviyeleri. */
  selectedSyncLevels?: SyncLevel[];
  /** Senkron seviyeleri değiştiğinde çağrılır. */
  onSelectedSyncLevelsChange?: (levels: SyncLevel[]) => void;
  /** Senkron seviye seçimi eksikse hata durumu. */
  hasSyncSelectionError?: boolean;
}

/** UI'da listelenecek senkron seviye seçeneklerini sabitler. */
const SYNC_LEVEL_OPTIONS: { id: SyncLevel; label: string; desc: string }[] = [
  { id: 'serbest', label: 'Serbest', desc: 'Üst/alt bağımsız değişebilir.' },
  { id: 'siki', label: 'Sıkı', desc: 'Üst/alt eşzamanlı değişim güçlüce zorlanır; çapraz taşıma cezalıdır.' },
];

/** Verilen değerin "sonsuz" olarak kabul edilip edilmediğini döner. */
function isUnlimited(value: number | undefined): boolean {
  return value === ROLL_ORDER_UNLIMITED;
}

/**
 * Senaryo seçimi kartı: rulo ve sipariş başına limitler (güvenlik stoğu ve strateji seçimi arayüzde yok; API varsayılanı kullanılır).
 */
export function ScenarioSelectionCard({
  maxOrdersPerRoll,
  onMaxOrdersPerRollChange,
  maxRollsPerOrder,
  onMaxRollsPerOrderChange,
  hasMaxOrdersPerRollError,
  hasMaxRollsPerOrderError,
  blinkValidationKey,
  selectedSyncLevels = [],
  onSelectedSyncLevelsChange,
  hasSyncSelectionError,
}: ScenarioSelectionCardProps) {
  /** Senkron seviye seçimini aç/kapat yapar ve üst bileşene bildirir. */
  function toggleSyncLevel(level: SyncLevel): void {
    if (!onSelectedSyncLevelsChange) return;
    if (selectedSyncLevels.includes(level)) {
      onSelectedSyncLevelsChange(selectedSyncLevels.filter((l) => l !== level));
      return;
    }
    onSelectedSyncLevelsChange([...selectedSyncLevels, level]);
  }

  return (
    <DashboardCard title="Senaryo Seçimi" icon="tune" animationDelayMs={100}>
      <div className="space-y-6">
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">info</span>
          <span>
            <strong>Zorunlu alanlar.</strong> Aşağıdaki her iki limit için bir sayı girmeniz veya &quot;Sonsuz&quot; butonuna tıklamanız gerekir. Boş
            bırakılamaz.
          </span>
        </p>
            <div
              key={hasSyncSelectionError ? `sync-${blinkValidationKey}` : 'sync'}
              className={`rounded-xl border p-4 ${hasSyncSelectionError ? 'border-accent-red animate-input-blink-error bg-red-50/40' : 'border-slate-200 bg-slate-50/50'}`}
            >
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Hat senkron seviyesi (en az 1 seçim zorunlu)
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {SYNC_LEVEL_OPTIONS.map((opt) => {
                  const checked = selectedSyncLevels.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`rounded-lg border px-3 py-2.5 text-xs cursor-pointer transition-colors ${checked ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSyncLevel(opt.id)}
                          className="mt-0.5 accent-primary"
                        />
                        <span>
                          <strong className="block text-[12px]">{opt.label}</strong>
                          <span className="text-[11px] text-slate-500">{opt.desc}</span>
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            {/* 1 ruloda maksimum kaç farklı sipariş — veri girişi / Sonsuz ayrımı net */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <span>1 ruloda maksimum kaç farklı sipariş?</span>
                <span
                  className="material-symbols-outlined text-[14px] text-slate-400 cursor-help"
                  title="Aynı fiziksel rulo üzerinde en fazla kaç farklı siparişe kesim yapılabileceğini sınırlar. Çok sipariş genelde daha fazla hat duruşu ve kurulum baskısı demektir; model bu üst sınırı LP ile uygular (tek tek rulo değişim sayacı yoktur)."
                >
                  info
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Bir ruloda en fazla kaç farklı siparişe pay verilebileceği; sınır düşük tutulursa hat üzerinde sipariş karmaşası ve duraksamalar azaltılır.
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
                Çift yüzey senaryosunda en az 2 olmalıdır; bir sipariş en fazla kaç farklı rulodan kesilebilir
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
                      min={2}
                      placeholder="En az 2 (zorunlu)"
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
                              if (!Number.isNaN(num)) onMaxRollsPerOrderChange(Math.max(2, num));
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
    </DashboardCard>
  );
}
