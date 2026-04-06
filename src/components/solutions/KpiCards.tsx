import type { SummaryResponse } from '@/lib/api';

export interface KpiCardsProps {
  /** API özeti; yoksa örnek placeholder değerler */
  summary?: SummaryResponse | null;
  loading?: boolean;
  /** Çözüm durumu (Optimal değilse uyarı) */
  status?: string | null;
}

const PLACEHOLDER_KPIS = [
  { label: 'Toplam Maliyet', value: '—', variant: 'default' as const },
  { label: 'Fire (ton)', value: '—', variant: 'default' as const },
  { label: 'Stok (ton)', value: '—', variant: 'default' as const },
  { label: 'Açılan rulo', value: '—', variant: 'default' as const },
];

/**
 * Demo KPI kartları: canlı özet veya placeholder.
 */
export function KpiCards({ summary, loading, status }: KpiCardsProps) {
  const isLive = summary != null;
  const kpis = isLive
    ? [
        {
          label: 'Toplam Maliyet',
          value: `${Number(summary.totalCost).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`,
          variant: 'default' as const,
        },
        {
          label: 'Fire (ton)',
          value: Number(summary.totalFire).toFixed(3),
          variant: Number(summary.totalFire) > 0.01 ? ('warning' as const) : ('default' as const),
        },
        {
          label: 'Stok (ton)',
          value: Number(summary.totalStock).toFixed(3),
          variant: 'default' as const,
        },
        {
          label: 'Açılan rulo',
          value: String(summary.openedRolls),
          variant: 'default' as const,
        },
      ]
    : PLACEHOLDER_KPIS;

  const seqPen = summary != null ? Number(summary.sequencePenalty ?? 0) : 0;
  const viol = summary != null ? Number(summary.interleavingViolationCount ?? 0) : 0;

  return (
    <div className="flex flex-col gap-3">
      {status && status !== 'Optimal' && isLive && !loading && (
        <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Durum: {status}
        </p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
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
                  loading
                    ? 'text-2xl font-bold text-gray-400 animate-pulse'
                    : kpi.variant === 'warning'
                      ? 'text-2xl font-bold text-red-500'
                      : 'text-2xl font-bold text-primary'
                }
              >
                {loading ? '…' : kpi.value}
              </p>
              {kpi.variant === 'warning' && !loading && isLive && (
                <span className="material-symbols-outlined text-red-500 text-[20px]" aria-hidden>
                  warning
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {isLive && !loading && (seqPen > 0 || viol > 0) && (
        <p className="text-xs text-slate-600 bg-slate-100 rounded-lg px-3 py-2">
          Sıra cezası: <strong>{seqPen.toFixed(2)}</strong> · Araya sipariş ihlali:{' '}
          <strong>{viol}</strong>
        </p>
      )}
      {!isLive && !loading && (
        <p className="text-xs text-gray-500">Sonuçları görmek için soldan &quot;Hesapla&quot;ya basın.</p>
      )}
    </div>
  );
}
