'use client';

import Link from 'next/link';

export interface DashboardFooterCtaProps {
  /** Verilirse buton tıklanınca bu fonksiyon çağrılır (konfig sayfasında API tetikleme) */
  onSubmit?: () => void | Promise<void>;
  /** Verilirse konfigürasyonu kaydet/güncelle işlemi yapar */
  onSave?: () => void | Promise<void>;
  /** Yükleme durumu - buton disabled olur */
  isLoading?: boolean;
  /** Kaydetme işlemi yükleme durumu */
  isSaving?: boolean;
}

/**
 * Dashboard alt CTA: bilgi metni ve "Optimizasyonu Çöz" butonu.
 * onSubmit verilirse API çağrısı yapılır, yoksa sonuç sayfasına link.
 */
export function DashboardFooterCta({
  onSubmit,
  onSave,
  isLoading,
  isSaving,
}: DashboardFooterCtaProps) {
  if (onSubmit) {
    return (
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fade-in-up min-w-0">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-base shrink-0">info</span>
            <span>
              Tahmini süre: <span className="font-semibold text-slate-600 dark:text-slate-300">~25 sn</span>
            </span>
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving || isLoading}
                className="w-full min-w-0 bg-white dark:bg-slate-800 border border-primary text-primary font-semibold text-sm py-2.5 px-4 rounded-lg shadow-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    Konfigürasyonu Kaydet
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading || isSaving}
              className="w-full min-w-0 bg-secondary hover:bg-primary text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow-md shadow-secondary/20 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Hesaplanıyor...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:rotate-90">
                    settings
                  </span>
                  Optimizasyonu Çöz
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 animate-fade-in-up min-w-0">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-base shrink-0">info</span>
          <span>
            Tahmini süre: <span className="font-semibold text-slate-600 dark:text-slate-300">~25 sn</span>
          </span>
        </div>
        <Link
          href="/dashboard/sonuc"
          className="w-full min-w-0 bg-secondary hover:bg-primary text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow-md shadow-secondary/20 transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:rotate-90">
            settings
          </span>
          Optimizasyonu Çöz
        </Link>
      </div>
    </div>
  );
}
