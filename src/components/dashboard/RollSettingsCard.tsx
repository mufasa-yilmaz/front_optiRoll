'use client';

import { DashboardCard } from './DashboardCard';

export interface RollSettingsCardProps {
  rolls: number[];
  onRollsChange: (rolls: number[]) => void;
  /** Tahmini ihtiyaç (ton) - gösterim için */
  estimatedNeedTon?: number;
}

/**
 * Rulo stoku kartı: her rulonun ağırlığını manuel giriş.
 */
export function RollSettingsCard({
  rolls,
  onRollsChange,
  estimatedNeedTon,
}: RollSettingsCardProps) {
  const total = rolls.reduce((s, r) => s + r, 0);

  const addRoll = () => onRollsChange([...rolls, 5]);
  const removeRoll = (i: number) => onRollsChange(rolls.filter((_, idx) => idx !== i));
  const updateRoll = (i: number, v: number) => {
    const next = [...rolls];
    next[i] = Math.max(1, v);
    onRollsChange(next);
  };

  return (
    <DashboardCard title="Rulo Stoku" icon="inventory_2" animationDelayMs={75}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-600">
            Rulo Ağırlıkları (ton)
          </label>
          <button
            type="button"
            onClick={addRoll}
            className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Rulo Ekle
          </button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {rolls.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              Rulo eklemek için &quot;Rulo Ekle&quot; butonuna tıklayın
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
                  min={1}
                  step={1}
                  value={ton}
                  onChange={(e) =>
                    updateRoll(i, parseInt(e.target.value, 10) || 1)
                  }
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
