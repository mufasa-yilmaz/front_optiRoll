'use client';

import Link from 'next/link';
import { useDisplayResult } from '@/contexts/ResultViewContext';
import { getReportDownloadUrl } from '@/lib/api';

/**
 * Çözücü sonuç sayfası başlığı: Optimizasyon Sonuçları, Run ID, Excel indir, Yeniden Çalıştır.
 */
export function SolverResultsHeader() {
  const lastResult = useDisplayResult();
  const fileId = lastResult?.fileId;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0f141a]">
          Optimizasyon Sonuçları
        </h1>
        <p className="text-gray-500 font-body text-sm mt-1">
          {fileId ? (
            <>
              Çalışma ID: #{fileId} • Yapılandırma: Standart Rulo Kesim
            </>
          ) : (
            'Henüz optimizasyon çalıştırılmadı'
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {fileId && (
          <a
            href={lastResult?.reportUrl || getReportDownloadUrl(fileId)}
            download={!lastResult?.reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Excel İndir
          </a>
        )}
        <Link
          href="/dashboard/configuration"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">replay</span>
          Çözücüyü Yeniden Çalıştır
        </Link>
      </div>
    </div>
  );
}
