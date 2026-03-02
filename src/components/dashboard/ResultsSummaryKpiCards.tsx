'use client';

/**
 * Optimizasyon sonuç özeti KPI kartları: toplam maliyet, fire, stok, rulo sayısı, kullanım oranı.
 */
export function ResultsSummaryKpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {/* Toplam Maliyet */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-blue-50 text-primary rounded-lg">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <span className="material-symbols-outlined text-gray-300 text-lg">
            more_horiz
          </span>
        </div>
        <div className="relative z-10">
          <div className="text-3xl font-bold text-gray-900 font-display mb-1">
            ₺12.450
          </div>
          <div className="text-sm font-medium text-gray-500">Toplam Maliyet</div>
          <div className="mt-2 text-[10px] text-gray-400 border-t border-gray-100 pt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[10px]">info</span>
            Fire, stok ve kurulum maliyeti
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-full opacity-50 group-hover:scale-110 transition-transform" />
      </div>

      {/* Toplam Fire */}
      <div className="bg-white rounded-xl border-l-4 border-l-accent-orange border-y-gray-200 border-r-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-orange-50 text-accent-orange rounded-lg">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <span className="text-xs font-bold text-accent-orange bg-orange-50 px-2 py-1 rounded">
            Yüksek
          </span>
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900 font-display mb-1">
            1,2 Ton
          </div>
          <div className="text-sm font-medium text-gray-500">Toplam Fire</div>
          <div className="mt-2 text-[10px] text-gray-400 border-t border-gray-100 pt-2">
            1,0T eşiğini aşıyor
          </div>
        </div>
      </div>

      {/* Toplam Stok */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-green-50 text-accent-green rounded-lg">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <span className="text-xs font-bold text-accent-green bg-green-50 px-2 py-1 rounded">
            +12%
          </span>
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900 font-display mb-1">
            3,4 Ton
          </div>
          <div className="text-sm font-medium text-gray-500">
            Üretilen Toplam Stok
          </div>
          <div className="mt-2 text-[10px] text-accent-green/80 font-medium border-t border-gray-100 pt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[10px]">recycling</span>
            Yeniden Kullanılabilir Envanter
          </div>
        </div>
      </div>

      {/* Açılan Rulolar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-gray-50 text-primary rounded-lg">
            <span className="material-symbols-outlined">album</span>
          </div>
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900 font-display mb-1">
            12
          </div>
          <div className="text-sm font-medium text-gray-500">Açılan Rulo</div>
          <div className="mt-2 text-[10px] text-gray-400 border-t border-gray-100 pt-2">
            4 farklı partiden
          </div>
        </div>
      </div>

      {/* Ortalama Kullanım */}
      <div className="bg-primary rounded-xl border border-primary p-5 shadow-md shadow-blue-900/10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-2 bg-white/20 rounded-lg">
            <span className="material-symbols-outlined text-white">percent</span>
          </div>
        </div>
        <div className="relative z-10">
          <div className="text-3xl font-bold font-display mb-1">%96,4</div>
          <div className="text-sm font-medium text-blue-100">
            Ortalama Kullanım
          </div>
          <div className="mt-3 w-full bg-black/20 rounded-full h-1.5">
            <div
              className="bg-accent-blue h-1.5 rounded-full"
              style={{ width: '96.4%' }}
            />
          </div>
          <div className="mt-2 text-[10px] text-blue-200 flex justify-between">
            <span>Hedef: %95</span>
            <span className="font-bold text-white">Mükemmel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
