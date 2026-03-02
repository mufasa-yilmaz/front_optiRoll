'use client';

interface StockFiltersBarProps {
  value: string;
  onChange: (value: string) => void;
}

/** Stok sayfası için arama alanı. OrdersFiltersBar ile aynı görsel stili kullanır. */
export function StockFiltersBar({ value, onChange }: StockFiltersBarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-[280px] flex-1">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 text-sm"
            placeholder="Set adı veya ID ile ara..."
            type="text"
          />
        </div>
      </div>
    </div>
  );
}
