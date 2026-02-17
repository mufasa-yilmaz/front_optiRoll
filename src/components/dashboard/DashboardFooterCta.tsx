'use client';

import Link from 'next/link';

export interface DashboardFooterCtaProps {
  /** Verilirse buton tıklanınca bu fonksiyon çağrılır (konfig sayfasında API tetikleme) */
  onSubmit?: () => void | Promise<void>;
  /** Yükleme durumu - buton disabled olur */
  isLoading?: boolean;
}

/**
 * Dashboard alt CTA: bilgi metni ve "Optimizasyonu Çöz" butonu.
 * onSubmit verilirse API çağrısı yapılır, yoksa sonuç sayfasına link.
 */
export function DashboardFooterCta({ onSubmit, isLoading }: DashboardFooterCtaProps) {
  if (onSubmit) {
    return (
      <div className="mt-8 pt-6 border-t border-slate-200 animate-fade-in-up">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-symbols-outlined text-lg">info</span>
            <span>
              Model yapılandırması hazır. Tahmini hesaplama süresi:{' '}
              <span className="font-bold text-slate-700">~25 sn</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading}
            className="w-full md:w-auto bg-secondary hover:bg-primary text-white font-bold text-lg py-3 px-10 rounded-lg shadow-lg shadow-secondary/30 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Hesaplanıyor...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined transition-transform duration-300 group-hover:rotate-90">
                  settings
                </span>
                Optimizasyon Modelini Çöz
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-slate-200 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="material-symbols-outlined text-lg">info</span>
          <span>
            Model yapılandırması hazır. Tahmini hesaplama süresi:{' '}
            <span className="font-bold text-slate-700">~25 sn</span>
          </span>
        </div>
        <Link
          href="/dashboard/sonuc"
          className="w-full md:w-auto bg-secondary hover:bg-primary text-white font-bold text-lg py-3 px-10 rounded-lg shadow-lg shadow-secondary/30 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
        >
          <span className="material-symbols-outlined transition-transform duration-300 group-hover:rotate-90">
            settings
          </span>
          Optimizasyon Modelini Çöz
        </Link>
      </div>
    </div>
  );
}
