/**
 * Optimizasyon sonuç özeti sayfa başlığı: Finished rozeti, ID, başlık, açıklama, Yeniden Çalıştır butonu.
 */
export function ResultsSummaryHeader() {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-primary uppercase tracking-wide">
            Tamamlandı
          </span>
          <span className="text-xs text-gray-400 font-mono">
            ID: #OPT-2024-892
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary font-display">
          Optimizasyon Sonuç Özeti
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Hesaplama 1,4 sn içinde tamamlandı • Senaryo: &quot;Max Verimlilik Q4&quot;
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-accent-blue hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">restart_alt</span>
          Optimizasyonu Yeniden Çalıştır
        </button>
      </div>
    </div>
  );
}
