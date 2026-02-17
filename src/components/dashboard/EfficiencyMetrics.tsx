'use client';

/**
 * Verimlilik metrikleri: malzeme kullanımı ve fire oranı progress barları.
 */
export function EfficiencyMetrics() {
  const utilization = 96.4;
  const waste = 3.6;

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm animate-scale-in">
      <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">
        Verimlilik Metrikleri
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">Malzeme Kullanımı</span>
            <span className="font-bold text-primary">{utilization}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-secondary h-2 rounded-full animate-fade-in opacity-0"
              style={{ width: `${utilization}%`, animationDelay: '0.1s' }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">Fire Oranı</span>
            <span className="font-bold text-tertiary">{waste}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-tertiary h-2 rounded-full animate-fade-in opacity-0"
              style={{ width: `${waste}%`, animationDelay: '0.25s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
