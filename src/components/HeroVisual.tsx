/**
 * Hero bölümündeki dashboard mock: Optimizasyon Skoru, bar grafiği, kesim planı görselleştirmesi.
 * Aktif kesim planı ve Fire Oranı azalma rozeti.
 */
export function HeroVisual() {
  return (
    <div className="flex flex-col gap-6 max-w-[600px] mx-auto w-full">
      <div className="relative w-full aspect-[4/3] lg:aspect-square">
        <div
          className="absolute inset-0 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          data-alt="Abstract interface showing optimized roll cutting plan with colored segments representing minimized waste"
        >
          <div className="h-8 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-2">
            <div className="size-2.5 rounded-full bg-red-400" />
            <div className="size-2.5 rounded-full bg-yellow-400" />
            <div className="size-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 p-6 flex flex-col gap-6 bg-gradient-to-b from-white to-gray-50 dark:from-surface-dark dark:to-background-dark">
            <div className="flex gap-4 items-end justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="space-y-1">
                <div className="text-xs text-gray-400 font-medium">
                  Optimizasyon Skoru
                </div>
                <div className="text-3xl font-bold text-accent">98.4%</div>
              </div>
              <div className="flex gap-1 h-12 items-end">
                <div className="w-3 bg-accent/20 h-[40%] rounded-t-sm" />
                <div className="w-3 bg-accent/30 h-[60%] rounded-t-sm" />
                <div className="w-3 bg-accent/50 h-[50%] rounded-t-sm" />
                <div className="w-3 bg-accent h-[90%] rounded-t-sm" />
              </div>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 relative flex items-center justify-center">
              <div className="w-full h-32 bg-gray-300 dark:bg-gray-600 rounded-full relative overflow-hidden shadow-inner flex">
                <div className="h-full bg-primary w-[25%] border-r border-white/20 flex items-center justify-center text-white/50 text-xs font-mono">
                  25%
                </div>
                <div className="h-full bg-accent w-[35%] border-r border-white/20 flex items-center justify-center text-white/50 text-xs font-mono">
                  35%
                </div>
                <div className="h-full bg-primary/80 w-[15%] border-r border-white/20 flex items-center justify-center text-white/50 text-xs font-mono">
                  15%
                </div>
                <div className="h-full bg-accent/80 w-[20%] border-r border-white/20 flex items-center justify-center text-white/50 text-xs font-mono">
                  20%
                </div>
                <div className="h-full bg-red-400 w-[5%] flex items-center justify-center text-white text-[10px] font-bold">
                  Fire
                </div>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-gray-500 font-medium bg-white dark:bg-surface-dark px-3 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                Aktif Kesim Planı #402
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-6 -left-6 bg-white dark:bg-surface-dark p-4 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 animate-pulse z-10">
          <div className="bg-green-100 text-green-600 p-2 rounded-lg dark:bg-green-900/20 dark:text-green-400">
            <span className="material-symbols-outlined">trending_down</span>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium dark:text-gray-400">
              Fire Oranı
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              - 12.5%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
