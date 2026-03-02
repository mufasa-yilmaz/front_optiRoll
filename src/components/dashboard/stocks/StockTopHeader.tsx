interface StockTopHeaderProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onRegisterClick: () => void;
}

/**
 * Stok ekranı üst navigasyon alanı ve arama kontrolü.
 */
export function StockTopHeader({
  searchTerm,
  onSearchTermChange,
  onRegisterClick,
}: StockTopHeaderProps) {
  return (
    <header className="sticky top-0 z-20 rounded-xl border border-primary/10 bg-white px-4 py-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">Stok ve Envanter</h1>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">
              Envanter Sistemleri
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              search
            </span>
            <input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              className="w-full rounded-lg bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-800 outline-none ring-primary/20 transition focus:ring-2"
              placeholder="Set adi veya ID ara..."
              type="text"
            />
          </div>
          <button
            type="button"
            onClick={onRegisterClick}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Yeni Set Gir
          </button>
        </div>
      </div>
    </header>
  );
}
