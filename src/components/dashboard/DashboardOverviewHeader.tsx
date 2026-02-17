/**
 * Dashboard genel bakış sayfa başlığı: Optimizasyon Sonuçları, Dashboard Overview,
 * Export ve Yeni Çalıştır butonları.
 */
export function DashboardOverviewHeader() {
  return (
    <div className="container mx-auto max-w-[1100px] mb-8 md:mb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-sm font-bold text-primary/70 uppercase tracking-wider mb-1 block">
            Optimizasyon Sonuçları
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f141a] sm:text-4xl">
            Dashboard Genel Bakış
          </h1>
          <p className="mt-2 text-gray-500 font-body max-w-2xl">
            Son optimizasyon çalışması #2024-08-A performans metrikleri.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">
              download
            </span>
            Dışa Aktar
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">
              play_arrow
            </span>
            Yeni Çalıştır
          </button>
        </div>
      </div>
    </div>
  );
}
