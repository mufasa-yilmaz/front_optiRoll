/**
 * Toplam maliyet karşılaştırma grafiği.
 * Mevcut vs optimizasyon sonrası maliyetleri çubuk grafik ile gösterir.
 */
export function TotalCostChart() {
  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 animate-slide-up hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-gray-900 text-lg font-semibold mb-1">
            Toplam Maliyet Karşılaştırması
          </h3>
          <p className="text-gray-500 text-sm">Aylık gider projeksiyonu</p>
        </div>
        <div className="text-right">
          <p className="text-primary text-3xl font-bold tracking-tight">₺12.500</p>
          <div className="flex items-center justify-end gap-1 text-tertiary">
            <span className="material-symbols-outlined text-sm">trending_down</span>
            <span className="text-sm font-bold">%18 Tasarruf</span>
          </div>
        </div>
      </div>
      {/* Bar Visualization */}
      <div className="relative h-64 w-full flex items-end justify-center gap-12 md:gap-20 pb-6 border-b border-gray-200">
        {/* Bar 1: Mevcut */}
        <div className="group relative flex flex-col items-center justify-end h-full w-24 animate-fade-in">
          <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs py-1 px-2 rounded mb-2 z-10">
            ₺69.450
          </div>
          <div
            className="w-full bg-gray-300 rounded-t-md hover:bg-gray-400 transition-colors duration-200 animate-bar-grow"
            style={{ height: '100%' }}
          />
          <p className="mt-3 text-sm font-medium text-gray-500">Mevcut</p>
        </div>
        {/* Bar 2: Optimize */}
        <div className="group relative flex flex-col items-center justify-end h-full w-24 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="absolute top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary text-white text-xs py-1 px-2 rounded mb-2 z-10">
            ₺56.950
          </div>
          <div
            className="w-full bg-primary rounded-t-md shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors duration-200 relative animate-bar-grow"
            style={{ height: '82%', animationDelay: '0.2s' }}
          >
            <div className="absolute -top-3 -right-3 size-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <span className="material-symbols-outlined text-white text-[14px]">check</span>
            </div>
          </div>
          <p className="mt-3 text-sm font-bold text-primary">Optimize</p>
        </div>
      </div>
    </div>
  );
}
