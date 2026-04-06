'use client';

/**
 * Demo sol paneli: dashboard ile aynı optimizasyon parametreleri + Hesapla (API).
 */
export interface DemoSidebarProps {
  thickness: number;
  onThicknessChange: (v: number) => void;
  maxInterleavingOrders: number;
  onMaxInterleavingOrdersChange: (v: number) => void;
  interleavingPenaltyCost: number;
  onInterleavingPenaltyCostChange: (v: number) => void;
  maxOrdersPerRoll: number;
  onMaxOrdersPerRollChange: (v: number) => void;
  maxRollsPerOrder: number;
  onMaxRollsPerOrderChange: (v: number) => void;
  onRun: () => void;
  loading: boolean;
  hasApiUrl: boolean;
  lastError: string | null;
}

/**
 * Çözümler demosu giriş alanlarını ve hesapla eylemini sunar.
 */
export function DemoSidebar({
  thickness,
  onThicknessChange,
  maxInterleavingOrders,
  onMaxInterleavingOrdersChange,
  interleavingPenaltyCost,
  onInterleavingPenaltyCostChange,
  maxOrdersPerRoll,
  onMaxOrdersPerRollChange,
  maxRollsPerOrder,
  onMaxRollsPerOrderChange,
  onRun,
  loading,
  hasApiUrl,
  lastError,
}: DemoSidebarProps) {
  const inputCls =
    'w-full rounded-lg border border-gray-300 bg-white text-gray-900 h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

  return (
    <div className="w-full md:w-[320px] bg-third border-r border-gray-200 p-6 flex flex-col gap-4 shrink-0 max-h-[min(90vh,720px)] overflow-y-auto">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200 animate-fade-in">
        <span className="material-symbols-outlined text-primary">tune</span>
        <h3 className="font-bold text-primary text-lg">Giriş Parametreleri</h3>
      </div>

      {!hasApiUrl && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <strong>API yok:</strong> <code className="text-[10px]">NEXT_PUBLIC_API_URL</code> tanımlayın;
          parametreler dashboard ile aynıdır; canlı hesap için backend adresi gerekir.
        </p>
      )}

      {lastError && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{lastError}</p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="demo-thickness" className="text-gray-700 text-xs font-medium">
          Malzeme kalınlığı (mm)
        </label>
        <input
          id="demo-thickness"
          type="number"
          min={0.01}
          step={0.01}
          value={thickness}
          onChange={(e) => onThicknessChange(Math.max(0.01, parseFloat(e.target.value) || 0.75))}
          className={inputCls}
        />
      </div>

      <p className="text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        Talep her zaman çift yüzey (2×) ile hesaplanır; sipariş başına en az iki rulo gerekir.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-gray-600">Araya max sipariş</label>
          <input
            type="number"
            min={0}
            step={1}
            value={maxInterleavingOrders}
            onChange={(e) =>
              onMaxInterleavingOrdersChange(Math.max(0, parseInt(e.target.value, 10) || 0))
            }
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-gray-600">Ceza / fazla</label>
          <input
            type="number"
            min={0}
            step={1}
            value={interleavingPenaltyCost}
            onChange={(e) =>
              onInterleavingPenaltyCostChange(Math.max(0, parseFloat(e.target.value) || 0))
            }
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-gray-600">Ruloda max sipariş</label>
          <input
            type="number"
            min={1}
            step={1}
            value={maxOrdersPerRoll}
            onChange={(e) =>
              onMaxOrdersPerRollChange(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-gray-600">Siparişte max rulo</label>
          <input
            type="number"
            min={2}
            step={1}
            value={maxRollsPerOrder}
            onChange={(e) =>
              onMaxRollsPerOrderChange(Math.max(2, parseInt(e.target.value, 10) || 2))
            }
            className={inputCls}
          />
        </div>
      </div>

      <p className="text-[10px] text-gray-500">
        Demo sabit 3 sipariş ve 4 rulo kullanır (dashboard’daki tam senaryo değil).
      </p>

      <div className="grow min-h-2" />
      <button
        type="button"
        disabled={loading || !hasApiUrl}
        onClick={onRun}
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white h-12 rounded-lg font-bold text-sm shadow-md shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">
          {loading ? 'hourglass_empty' : 'play_arrow'}
        </span>
        {loading ? 'Hesaplanıyor…' : 'Hesapla'}
      </button>
    </div>
  );
}
