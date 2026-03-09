'use client';

import { useRef, useEffect } from 'react';
import { DashboardCard } from './DashboardCard';

/** Hazır stok seti (liste seçimi için) */
export type StockSetOption = {
  id: string;
  name: string;
  rolls?: number[];
};

export interface RollSettingsCardProps {
  rolls: number[];
  onRollsChange: (rolls: number[]) => void;
  /** Tahmini ihtiyaç (ton) - gösterim için */
  estimatedNeedTon?: number;
  /** Hazır stok setleri - verilirse Rulo Stoku bölümünde dropdown gösterilir */
  stockSets?: StockSetOption[];
  /** Seçili hazır stok seti id */
  selectedStockSetId?: string;
  /** Hazır stok seti seçildiğinde çağrılır */
  onStockSetSelect?: (setId: string) => void;
  /** Rulo listesi eksik/hatali ise true olur */
  hasRollsError?: boolean;
  /** Doğrulama tekrar tetiklendiğinde animasyonu yeniden başlatmak için key */
  blinkValidationKey?: number;
  /** Manuel "Rulo Ekle" butonunu göster (hazır set seçimi varsa false yapılabilir) */
  showManualAdd?: boolean;
}

/**
 * Rulo stoku kartı: her rulonun ağırlığını manuel giriş; isteğe bağlı hazır stok seti seçimi.
 */
export function RollSettingsCard({
  rolls,
  onRollsChange,
  estimatedNeedTon,
  stockSets = [],
  selectedStockSetId = '',
  onStockSetSelect,
  hasRollsError,
  blinkValidationKey,
  showManualAdd = true,
}: RollSettingsCardProps) {
  const total = rolls.reduce((s, r) => s + r, 0);
  const showStockSetSelect = stockSets.length > 0 && onStockSetSelect;
  const listRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(rolls.length);

  /** Yeni rulo eklendiğinde liste alanını aşağı kaydırarak son eklenen satırı görünür yapar */
  useEffect(() => {
    if (rolls.length > prevLengthRef.current) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
    prevLengthRef.current = rolls.length;
  }, [rolls.length]);

  /** Yeni rulo ekler; varsayılan ağırlık 0 ton — kullanıcı girecek. */
  const addRoll = () => onRollsChange([...rolls, 0]);
  const removeRoll = (i: number) => onRollsChange(rolls.filter((_, idx) => idx !== i));
  /** Rulo ağırlığını günceller; 0 geçerlidir (kullanıcı doldurana kadar). */
  const updateRoll = (i: number, v: number) => {
    const next = [...rolls];
    next[i] = Math.max(0, v);
    onRollsChange(next);
  };

  const headerRight = (
    <div className="flex gap-3 items-center flex-wrap">
      <span className="text-xs font-medium text-slate-400">
        {rolls.length} rulo
      </span>
      {showStockSetSelect && (
        <select
          value={selectedStockSetId}
          onChange={(e) => onStockSetSelect(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:border-secondary focus:ring-1 focus:ring-secondary/30"
          title="Hazır stok seti seç"
        >
          <option value="">Hazır Stok Seti Seç</option>
          {stockSets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({(s.rolls || []).length} rulo)
            </option>
          ))}
        </select>
      )}
      {showManualAdd && (
        <button
          type="button"
          onClick={addRoll}
          className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Rulo Ekle
        </button>
      )}
    </div>
  );

  return (
    <DashboardCard title="Rulo Stoku" icon="inventory_2" animationDelayMs={75} headerRight={headerRight}>
      <div className="space-y-4">
        <label className="block text-xs font-medium text-slate-600 flex items-center gap-1">
          <span>Rulo Ağırlıkları (ton)</span>
          <span
            className="material-symbols-outlined text-[14px] text-slate-400 cursor-help"
            title="Her rulo için toplam tonaj. Mevcut stok kapasitesini ve açılan rulo sayısını etkiler."
          >
            info
          </span>
        </label>
        <div
          ref={listRef}
          className={`space-y-2 max-h-48 overflow-y-auto ${
            hasRollsError ? 'border border-accent-red rounded-md animate-input-blink-error' : ''
          }`}
          key={hasRollsError ? `rolls-${blinkValidationKey}` : 'rolls'}
        >
          {rolls.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              {showManualAdd
                ? 'Rulo eklemek için "Rulo Ekle" butonuna tıklayın'
                : 'Yukarıdan bir hazır stok seti seçin'}
            </p>
          ) : (
            rolls.map((ton, i) => (
              <div
                key={i}
                className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0"
              >
                <span className="text-xs text-slate-500 w-16">Rulo {i + 1}</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={ton}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    updateRoll(i, Number.isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="flex-1 rounded border border-slate-300 py-1.5 px-2 text-sm"
                />
                <span className="text-xs text-slate-400">ton</span>
                <button
                  type="button"
                  onClick={() => removeRoll(i)}
                  className="p-1 text-slate-400 hover:text-accent-red rounded"
                  title="Ruloyu kaldır"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ))
          )}
        </div>
        {rolls.length > 0 && (
          <p className="text-xs font-medium text-primary bg-primary/10 rounded px-3 py-2">
            Toplam: {total} ton · {rolls.length} rulo
          </p>
        )}
        {estimatedNeedTon != null && rolls.length > 0 && (
          <p className="text-xs text-slate-500">
            Tahmini ihtiyaç: ~{Math.ceil(estimatedNeedTon)} ton
            {total < estimatedNeedTon && (
              <span className="text-accent-red font-medium ml-1">(Yetersiz tonaj)</span>
            )}
          </p>
        )}
      </div>
    </DashboardCard>
  );
}
