'use client';

import { useRef, useEffect } from 'react';
import { DashboardCard } from './DashboardCard';

/**
 * Stok toplamı ile tahmini sipariş ihtiyacı arasındaki farkı ton olarak hesaplar.
 * İhtiyaç yok veya sıfırsa null döner.
 */
function stockDeltaVersusOrderNeed(totalStockTon: number, estimatedNeedTon: number | undefined): number | null {
  if (estimatedNeedTon == null || Number.isNaN(estimatedNeedTon) || estimatedNeedTon <= 0) return null;
  return totalStockTon - estimatedNeedTon;
}

/** Hazır stok seti (liste seçimi için) */
export type StockSetOption = {
  id: string;
  name: string;
  rolls?: number[];
};

export interface RollSettingsCardProps {
  rolls: number[];
  onRollsChange: (rolls: number[]) => void;
  /** Aynı siparişe dönüşte araya max kaç farklı sipariş (üst sınır). */
  maxInterleavingOrders?: number;
  onMaxInterleavingOrdersChange?: (v: number) => void;
  /** Fazla araya sipariş başına soft ceza birimi (0 = sıra cezası kapalı). */
  interleavingPenaltyCost?: number;
  onInterleavingPenaltyCostChange?: (v: number) => void;
  /** Tahmini ihtiyaç (ton) - gösterim için */
  estimatedNeedTon?: number;
  /** Hazır stok setleri - verilirse Rulo Stoğu bölümünde dropdown gösterilir */
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
 * Rulo stoğu kartı: her rulonun ağırlığını manuel giriş; stok toplamı ile siparişe göre tahmini ihtiyaç
 * karşılaştırması (artan / eksik / denge); isteğe bağlı hazır stok seti seçimi.
 */
export function RollSettingsCard({
  rolls,
  onRollsChange,
  maxInterleavingOrders = 2,
  onMaxInterleavingOrdersChange,
  interleavingPenaltyCost = 0,
  onInterleavingPenaltyCostChange,
  estimatedNeedTon,
  stockSets = [],
  selectedStockSetId = '',
  onStockSetSelect,
  hasRollsError,
  blinkValidationKey,
  showManualAdd = true,
}: RollSettingsCardProps) {
  const total = rolls.reduce((s, r) => s + r, 0);
  const deltaTon = stockDeltaVersusOrderNeed(total, estimatedNeedTon);
  /** Sipariş ihtiyacı veya stok satırı varken özet kutusunu göster (stok boş ama ihtiyaç varsa eksik görünür). */
  const showStockVersusNeedSummary =
    rolls.length > 0 || (estimatedNeedTon != null && estimatedNeedTon > 0);
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
    <DashboardCard title="Rulo Stoğu" icon="inventory_2" animationDelayMs={75} headerRight={headerRight}>
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
        {showStockVersusNeedSummary && (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary/90 dark:text-primary/80">
              Yukarıdaki siparişlere göre
            </p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Toplam stok:{' '}
              <span className="font-bold text-primary">{Number(total).toFixed(2)} ton</span>
              <span className="text-slate-400 dark:text-slate-500">
                {' '}
                · {rolls.length} rulo
                {rolls.length === 0 && (estimatedNeedTon ?? 0) > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400"> — henüz rulo girilmedi</span>
                ) : null}
              </span>
            </p>
            {deltaTon != null ? (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Tahmini sipariş ihtiyacı (ton):{' '}
                  <span className="font-semibold tabular-nums">~{Number(estimatedNeedTon).toFixed(2)}</span>
                  <span className="text-slate-400 dark:text-slate-500">
                    {' '}
                    — seçili sipariş m², çift yüzey (2×) ve malzeme varsayımlarıyla
                  </span>
                </p>
                {deltaTon > 0.01 ? (
                  <p className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50/90 px-2.5 py-2 text-xs font-semibold text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100">
                    <span className="material-symbols-outlined text-[18px] shrink-0 text-emerald-600 dark:text-emerald-400">
                      trending_up
                    </span>
                    <span>
                      Siparişe göre <span className="tabular-nums">+{deltaTon.toFixed(2)} ton</span> artan stok
                      (fazla kapasite).
                    </span>
                  </p>
                ) : deltaTon < -0.01 ? (
                  <p className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50/90 px-2.5 py-2 text-xs font-semibold text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
                    <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600 dark:text-red-400">
                      trending_down
                    </span>
                    <span>
                      Siparişe göre <span className="tabular-nums">{Math.abs(deltaTon).toFixed(2)} ton</span> eksik
                      stok (ihtiyaç, mevcut stoktan büyük).
                    </span>
                  </p>
                ) : (
                  <p className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                    <span className="material-symbols-outlined text-[18px] text-slate-500">balance</span>
                    Siparişe göre stok ile ihtiyaç yaklaşık denge (~±0,01 ton).
                  </p>
                )}
              </>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Fazla veya eksik stok için yukarıdan en az bir sipariş seçin (veya manuel sayfada sipariş satırı ekleyin);
                tahmini ihtiyaç hesaplanınca bu blok güncellenir.
              </p>
            )}
          </div>
        )}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-700">Kaplama talebi</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Siparişteki m² tek yüzey olarak alınır; optimizasyon talebi her zaman çift yüzey (2×) ile hesaplanır.
              Sipariş başına en az iki rulo kullanılır. Üst/alt bant paylaşımı liste sırasına bağlı değildir; aynı rulo
              sahada önce bir yüzeyde sonra diğerinde kullanılabilir — sonuç ekranındaki üst/alt satırlar yalnızca
              okunabilirlik için sıralı rulo numarasına göre bölünür.
            </p>
          </div>
          <p className="text-[10px] text-slate-500">
            Her açılan rulo için zaman maliyeti, Maliyet kartındaki <strong>Kurulum (setup)</strong> tutarıyla
            hesaplanır.
          </p>
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-700">Siparişe geri dönüş (soft ceza)</p>
            <p className="text-[11px] text-slate-500">
              Yarım kalan siparişe tekrar dönmeden önce araya giren farklı sipariş sayısı sınırı aşılırsa toplam
              maliyete ceza eklenir. 0 ceza = sıra optimizasyonu kapalı. Mevcut kesim planı aynı (rulo, sipariş)
              çiftini tek satırda topladığı için üretim sırası tam anlamıyla modellenmeyebilir; parametreler yine
              dashboard üzerinden ayarlanır.
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Araya max sipariş</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={maxInterleavingOrders}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    onMaxInterleavingOrdersChange?.(Number.isNaN(n) ? 0 : Math.max(0, n));
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Ceza / fazla sipariş</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={interleavingPenaltyCost}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value);
                    onInterleavingPenaltyCostChange?.(Number.isNaN(n) ? 0 : Math.max(0, n));
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
