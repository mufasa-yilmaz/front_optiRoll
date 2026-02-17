/**
 * Maliyet dağılımı grafiği.
 * Fire, stok ve kurulum maliyetlerini kategorik olarak gösterir.
 */
export function CostBreakdownChart() {
  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 animate-slide-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '0.1s' }}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-gray-900 text-lg font-semibold mb-1">Maliyet Dağılımı</h3>
          <p className="text-gray-500 text-sm">Fire, Stok ve Kurulum Analizi</p>
        </div>
        <div className="text-right">
          <p className="text-gray-900 text-2xl font-bold">₺4.200</p>
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
            Fire Tasarrufu
          </p>
        </div>
      </div>
      <div className="space-y-6">
        {/* Fire Maliyeti */}
        <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-lg">delete</span>
              Fire Maliyeti
            </span>
            <span className="text-gray-500">-%25</span>
          </div>
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-gray-300 w-[60%]" />
            <div className="h-full bg-green-500 w-[40%] rounded-r-full animate-pulse" />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Önceki: ₺12k</span>
            <span className="font-bold text-primary">Şimdi: ₺9k</span>
          </div>
        </div>
        {/* Stok Kullanımı */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">inventory_2</span>
              Stok Kullanımı
            </span>
            <span className="text-gray-500">-%8</span>
          </div>
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[85%] rounded-r-full transition-all duration-500" />
          </div>
        </div>
        {/* Kurulum Süresi */}
        <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">settings</span>
              Kurulum Süresi
            </span>
            <span className="text-gray-500">-%12</span>
          </div>
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-secondary w-[70%] rounded-r-full transition-all duration-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
