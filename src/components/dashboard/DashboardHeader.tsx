'use client';

/**
 * Dashboard üst başlık: başlık, run bilgisi ve aksiyon butonları (PDF, Yeniden Çalıştır).
 */
export function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-down">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          Optimizasyon Sonuçları
        </h1>
        <p className="text-gray-500 font-body text-sm mt-1">
          Çalışma ID: #OPT-2409-X82 • Yapılandırma: Standart Rulo Kesim
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-third transition-all duration-200 flex items-center gap-2 hover:shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          PDF İndir
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5"
        >
          <span className="material-symbols-outlined text-[18px]">replay</span>
          Çözücüyü Yeniden Çalıştır
        </button>
      </div>
    </div>
  );
}
