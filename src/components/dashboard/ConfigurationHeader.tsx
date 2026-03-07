import Link from 'next/link';

/**
 * Optimizasyon sayfası üst başlığı: OptiRoll Giriş Parametreleri,
 * Dashboard / Optimizasyon / Geçmiş navigasyonu ve kullanıcı avatarları.
 */
export function ConfigurationHeader() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white shadow-md shadow-primary/30">
            <span className="material-symbols-outlined text-[20px]">
              cut
            </span>
          </div>
          <h1 className="text-xl font-bold font-display text-[#0f141a] tracking-tight">
            OptiRoll{' '}
            <span className="text-gray-400 font-medium text-base ml-2 border-l border-gray-300 pl-3">
              Giriş Parametreleri
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link
              href="/dashboard"
              className="hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/configuration"
              className="text-primary"
            >
              Optimizasyon
            </Link>
            <Link
              href="#"
              className="hover:text-primary transition-colors"
            >
              Geçmiş
            </Link>
          </nav>
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            JD
          </div>
        </div>
      </div>
    </header>
  );
}
