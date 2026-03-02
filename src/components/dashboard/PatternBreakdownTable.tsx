'use client';

type PatternSegment = {
  width: string;
  color: string;
  label?: string;
};

type PatternRow = {
  id: string;
  segments: PatternSegment[];
  qty: number;
  wasteMm: number;
  efficiency: number;
};

const PATTERNS: PatternRow[] = [
  {
    id: 'PAT-001-A',
    segments: [
      { width: '30%', color: 'bg-primary/80', label: '300' },
      { width: '30%', color: 'bg-primary/80', label: '300' },
      { width: '20%', color: 'bg-accent-blue/80', label: '200' },
      { width: '15%', color: 'bg-accent-green/60', label: 'STK' },
      { width: '5%', color: 'bg-accent-red/20' },
    ],
    qty: 8,
    wasteMm: 45,
    efficiency: 98,
  },
  {
    id: 'PAT-002-B',
    segments: [
      { width: '45%', color: 'bg-primary/80', label: '450' },
      { width: '45%', color: 'bg-primary/80', label: '450' },
      { width: '10%', color: 'bg-accent-red/20' },
    ],
    qty: 3,
    wasteMm: 100,
    efficiency: 90,
  },
  {
    id: 'PAT-003-C',
    segments: [
      { width: '20%', color: 'bg-primary/80', label: '200' },
      { width: '20%', color: 'bg-primary/80', label: '200' },
      { width: '20%', color: 'bg-primary/80', label: '200' },
      { width: '20%', color: 'bg-primary/80', label: '200' },
      { width: '18%', color: 'bg-accent-green/60', label: 'STK' },
      { width: '2%', color: 'bg-accent-red/20' },
    ],
    qty: 1,
    wasteMm: 12,
    efficiency: 99,
  },
];

/**
 * Kesim deseni görselleştirmesi çubuğu.
 */
function CutDiagramBar({ segments }: { segments: PatternSegment[] }) {
  return (
    <div className="h-8 flex-1 bg-gray-200 rounded flex overflow-hidden border border-gray-300 relative min-w-[200px]">
      {segments.map((seg, i) => (
        <div
          key={i}
          className={`h-full ${seg.color} flex items-center justify-center text-[9px] ${
            seg.label ? 'text-white font-bold border-r border-white/20' : ''
          }`}
          style={{ width: seg.width }}
          title={seg.label || 'Fire (mm)'}
        >
          {seg.label}
        </div>
      ))}
    </div>
  );
}

/**
 * Kesim desenleri karşılaştırma tablosu: görselleştirme, desen ID, adet, fire, verimlilik.
 */
export function PatternBreakdownTable() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-primary text-lg">Desen Dağılımı</h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
            5 Desen
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Desen ID ara..."
              className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue w-64 text-gray-600"
            />
          </div>
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all"
          >
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
              <th className="px-6 py-4 w-[35%]">Kesim Diyagramı</th>
              <th className="px-6 py-4">Desen ID</th>
              <th className="px-6 py-4 text-center">Adet (Rulo)</th>
              <th className="px-6 py-4 text-right">Fire (mm)</th>
              <th className="px-6 py-4 w-[20%]">Verimlilik</th>
              <th className="px-6 py-4 w-[5%]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {PATTERNS.map((row) => (
              <tr
                key={row.id}
                className="group hover:bg-gray-50/80 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CutDiagramBar segments={row.segments} />
                  </div>
                </td>
                <td className="px-6 py-4 font-mono font-medium text-gray-700">
                  {row.id}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    {row.qty}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-gray-500">
                  {row.wasteMm} mm
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          row.efficiency >= 95 ? 'bg-primary' : 'bg-accent-blue'
                        }`}
                        style={{ width: `${row.efficiency}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-9 text-right">
                      %{row.efficiency}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-accent-blue transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      visibility
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          1-3 / 5 desen gösteriliyor
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_left
            </span>
          </button>
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded bg-primary text-white text-xs font-medium"
          >
            1
          </button>
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-primary text-xs font-medium"
          >
            2
          </button>
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-primary"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
