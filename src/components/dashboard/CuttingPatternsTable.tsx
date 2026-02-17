'use client';

const patterns = [
  { id: 'PT-01', frequency: 4, waste: 1.2, cost: '4.200 ₺', wasteClass: 'text-green-600' },
  { id: 'PT-02', frequency: 3, waste: 0.8, cost: '3.150 ₺', wasteClass: 'text-green-600' },
  { id: 'PT-03', frequency: 3, waste: 4.5, cost: '3.100 ₺', wasteClass: 'text-yellow-600' },
  { id: 'PT-04', frequency: 2, waste: 7.2, cost: '2.000 ₺', wasteClass: 'text-orange-600' },
];

/**
 * Üretilen kesim desenleri tablosu: desen ID, frekans, fire %, maliyet.
 */
export function CuttingPatternsTable() {
  return (
    <div className="lg:col-span-2 bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden flex flex-col animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-third/30">
        <h3 className="font-bold text-gray-800">Üretilen Kesim Desenleri</h3>
        <button
          type="button"
          className="text-sm text-primary font-medium hover:underline transition-colors"
        >
          Tüm Desenleri Görüntüle
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
            <tr>
              <th className="px-5 py-3">Desen ID</th>
              <th className="px-5 py-3">Frekans</th>
              <th className="px-5 py-3">Fire (%)</th>
              <th className="px-5 py-3 text-right">Maliyet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patterns.map((row, i) => (
              <tr
                key={row.id}
                className="hover:bg-third/30 transition-colors duration-200"
              >
                <td className="px-5 py-3 font-medium text-primary">#{row.id}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary/15 text-secondary">
                    {row.frequency} rulo
                  </span>
                </td>
                <td className={`px-5 py-3 font-medium ${row.wasteClass}`}>
                  %{row.waste}
                </td>
                <td className="px-5 py-3 text-right text-gray-600">{row.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 bg-third/20 border-t border-gray-100 text-xs text-gray-500 text-center">
        Frekansa göre ilk 4 desen gösteriliyor
      </div>
    </div>
  );
}
