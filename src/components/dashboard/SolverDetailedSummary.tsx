'use client';

import { useDisplayResult } from '@/contexts/ResultViewContext';

const formatTL = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatNum = (n: number, decimals = 2) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * Detaylı optimizasyon özeti: verimlilik metrikleri, üretim istatistikleri, kesim planı tablosu.
 */
export function SolverDetailedSummary() {
  const lastResult = useDisplayResult();

  const rollStatus = lastResult?.rollStatus ?? [];
  const cuttingPlan = lastResult?.cuttingPlan ?? [];

  const totalTonnage = rollStatus.reduce((s, r) => s + r.totalTonnage, 0);
  const totalUsed = rollStatus.reduce((s, r) => s + r.used, 0);
  const totalFire = rollStatus.reduce((s, r) => s + r.fire, 0);
  const materialUsagePct = totalTonnage > 0 ? (totalUsed / totalTonnage) * 100 : 0;
  const firePct = totalTonnage > 0 ? (totalFire / totalTonnage) * 100 : 0;

  const totalPanels = cuttingPlan.reduce((s, c) => s + c.panelCount, 0);
  const totalM2 = cuttingPlan.reduce((s, c) => s + c.m2, 0);
  const uniqueRolls = new Set(cuttingPlan.map((c) => c.rollId)).size;

  const rollRows = rollStatus.map((r) => ({
    rollId: r.rollId,
    totalTonnage: r.totalTonnage,
    used: r.used,
    remaining: r.remaining,
    fire: r.fire,
    stock: r.stock,
    ordersUsed: r.ordersUsed,
  }));

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
      <div className="bg-navy-custom px-6 py-4 border-b border-navy-custom">
        <div className="flex items-center justify-between text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">analytics</span>
            Detaylı Optimizasyon Özeti
          </h2>
          <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded text-white/90">
            v2.4.1 Çözücü
          </span>
        </div>
      </div>

      <div className="relative min-h-[400px] p-6 md:p-8">
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23e5e7eb'/%3E%3C/svg%3E")`,
            maskImage: 'linear-gradient(to bottom, white, transparent)',
          }}
        />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol kolon */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">
                Verimlilik Metrikleri
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">
                      Malzeme Kullanımı
                    </span>
                    <span className="font-bold text-navy-custom">
                      {lastResult ? `%${formatNum(materialUsagePct, 1)}` : '-'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-accent-green h-2 rounded-full"
                      style={{ width: lastResult ? `${Math.min(100, materialUsagePct)}%` : '0%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Fire Faktörü</span>
                    <span className="font-bold text-accent-red">
                      {lastResult ? `%${formatNum(firePct, 1)}` : '-'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-accent-red h-2 rounded-full"
                      style={{ width: lastResult ? `${Math.min(100, firePct)}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">
                Üretim İstatistikleri
              </h3>
              <ul className="space-y-3">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">
                      content_cut
                    </span>
                    Toplam Panel
                  </span>
                  <span className="font-bold text-gray-900">
                    {lastResult ? formatNum(totalPanels) : '-'}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">
                      view_column
                    </span>
                    Açılan Rulo
                  </span>
                  <span className="font-bold text-gray-900">
                    {lastResult ? String(uniqueRolls) : '-'}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">
                      grid_view
                    </span>
                    Toplam m²
                  </span>
                  <span className="font-bold text-gray-900">
                    {lastResult ? formatNum(totalM2) : '-'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sağ kolon - Rulo Durumu */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800">
                Rulo Bazında Kullanım
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                  <tr>
                    <th className="px-5 py-3">Rulo</th>
                    <th className="px-5 py-3 text-right">Kullanılan (ton)</th>
                    <th className="px-5 py-3 text-right">Fire (ton)</th>
                    <th className="px-5 py-3 text-right">Stok (ton)</th>
                    <th className="px-5 py-3 text-right">Sipariş</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lastResult && rollRows.length > 0 ? (
                    rollRows.map((row) => (
                      <tr
                        key={row.rollId}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-navy-custom">
                          Rulo #{row.rollId}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600">
                          {formatNum(row.used)}
                        </td>
                        <td className="px-5 py-3 text-right text-accent-red font-medium">
                          {formatNum(row.fire)}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600">
                          {formatNum(row.stock)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            {row.ordersUsed} sipariş
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                        Henüz optimizasyon sonucu yok
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {lastResult && rollRows.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
                Toplam {rollRows.length} rulo kullanıldı
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-2 px-6 pb-6">
        <button
          type="button"
          className="text-sm font-medium text-gray-500 hover:text-navy-custom transition px-4 py-2"
        >
          Gelişmiş Loglar
        </button>
      </div>
    </div>
  );
}
