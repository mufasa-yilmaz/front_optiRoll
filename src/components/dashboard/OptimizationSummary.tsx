'use client';

import { EfficiencyMetrics } from './EfficiencyMetrics';
import { ProductionStats } from './ProductionStats';
import { CuttingPatternsTable } from './CuttingPatternsTable';

/**
 * Detaylı optimizasyon özeti bölümü: başlık, verimlilik, üretim istatistikleri ve desen tablosu.
 */
export function OptimizationSummary() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col animate-fade-in-up">
      <div className="bg-primary px-6 py-4 border-b border-primary">
        <div className="flex items-center justify-between text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">analytics</span>
            Detaylı Optimizasyon Özeti
          </h2>
          <span className="text-xs font-medium bg-white/15 px-2 py-1 rounded text-white/95">
            v2.4.1 Çözücü
          </span>
        </div>
      </div>
      <div className="relative min-h-[400px] p-6 md:p-8">
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23e5e7eb'/%3E%3C/svg%3E")`,
            maskImage: 'linear-gradient(to bottom, white, transparent)',
          }}
        />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <EfficiencyMetrics />
            <ProductionStats />
          </div>
          <CuttingPatternsTable />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-2 px-6 pb-4">
        <button
          type="button"
          className="text-sm font-medium text-gray-500 hover:text-primary transition-colors px-4 py-2"
        >
          Gelişmiş Günlükler
        </button>
      </div>
    </div>
  );
}
