/**
 * Demo KPI kartları: toplam maliyet, fire oranı, stok kullanımı, toplam rulo.
 * primary/secondary renkleri, hafif giriş animasyonu.
 */
const KPIS = [
  {
    label: 'Toplam Maliyet',
    value: '12.450 ₺',
    variant: 'default' as const,
  },
  {
    label: 'Fire Oranı',
    value: '%2,4',
    variant: 'warning' as const,
  },
  {
    label: 'Stok Kullanımı',
    value: '%98',
    variant: 'default' as const,
  },
  {
    label: 'Toplam Rulo',
    value: '450',
    variant: 'default' as const,
  },
];

export function KpiCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {KPIS.map((kpi, i) => (
        <div
          key={kpi.label}
          className="p-4 rounded-lg bg-third border border-gray-200 animate-fade-in-up"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {kpi.label}
          </p>
          <div className="flex items-center gap-2">
            <p
              className={
                kpi.variant === 'warning'
                  ? 'text-2xl font-bold text-red-500'
                  : 'text-2xl font-bold text-primary'
              }
            >
              {kpi.value}
            </p>
            {kpi.variant === 'warning' && (
              <span
                className="material-symbols-outlined text-red-500 text-[20px]"
                aria-hidden
              >
                warning
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
