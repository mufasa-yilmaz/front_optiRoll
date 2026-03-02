interface OrdersFiltersBarProps {
  value: string;
  onChange: (value: string) => void;
}

/** Proje listesi için üst filtre ve arama alanı. */
export function OrdersFiltersBar({ value, onChange }: OrdersFiltersBarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-[280px] flex-1">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 text-sm"
            placeholder="Proje kodu, set adı veya tarihe göre ara..."
            type="text"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-lg">filter_list</span>
          Durum: Tümü
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-lg">calendar_today</span>
          Tarih Aralığı
        </button>
      </div>
    </div>
  );
}
