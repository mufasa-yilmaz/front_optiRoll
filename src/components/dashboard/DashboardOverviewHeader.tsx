import Link from 'next/link';

export interface DashboardOverviewHeaderProps {
  /** Başlık altında gösterilen dinamik açıklama (API özetleri). */
  description: string;
  /** Son çalıştırma raporu indirme URL'i (`getReportDownloadUrl`); yoksa dışa aktar gizlenir. */
  exportHref?: string | null;
  /** true iken açıklama yerine yükleme metni gösterilir. */
  loading?: boolean;
}

/**
 * Dashboard genel bakış başlığı: özet metin ve optimizasyon / sonuç / dışa aktar yönlendirmeleri.
 */
export function DashboardOverviewHeader({
  description,
  exportHref,
  loading,
}: DashboardOverviewHeaderProps) {
  return (
    <div className="container mx-auto max-w-[1100px] mb-8 md:mb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-sm font-bold text-primary/70 uppercase tracking-wider mb-1 block">
            OptiRoll kontrol paneli
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f141a] sm:text-4xl">
            Sipariş ve stok özeti
          </h1>
          <p className="mt-2 text-gray-500 font-body max-w-2xl">
            {loading ? 'Veriler yükleniyor…' : description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {exportHref ? (
            <a
              href={exportHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] mr-2">download</span>
              Son raporu indir
            </a>
          ) : null}
          <Link
            href="/dashboard/sonuc"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">history</span>
            Geçmiş sonuçlar
          </Link>
          <Link
            href="/dashboard/configuration"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">play_arrow</span>
            Yeni optimizasyon
          </Link>
        </div>
      </div>
    </div>
  );
}
