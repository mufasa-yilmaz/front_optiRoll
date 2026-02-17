'use client';

const items = [
  { icon: 'content_cut', label: 'Toplam Kesim', value: '142' },
  { icon: 'view_column', label: 'Desen Sayısı', value: '8' },
  { icon: 'straighten', label: 'Toplam Uzunluk', value: '4.800 m' },
];

/**
 * Üretim istatistikleri listesi: toplam kesim, desen, uzunluk.
 */
export function ProductionStats() {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm animate-scale-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
      <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">
        Üretim İstatistikleri
      </h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li
            key={item.label}
            className="flex justify-between items-center text-sm animate-fade-in-up"
            style={{ animationDelay: `${150 + i * 50}ms`, animationFillMode: 'backwards' }}
          >
            <span className="text-gray-600 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-gray-400">
                {item.icon}
              </span>
              {item.label}
            </span>
            <span className="font-bold text-gray-900">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
