import Link from 'next/link';

/**
 * Ana sayfa üst navigasyon: logo, menü linkleri (Özellikler, Fiyatlandırma, İletişim), Demo İste butonu.
 * Sticky, blur arka plan, dark mode destekli.
 */
export function Nav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#eaecf1] dark:border-gray-800 bg-surface-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 text-primary dark:text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">cut</span>
            </div>
            <h1 className="text-primary dark:text-white text-xl font-bold tracking-tight">
              OptiRoll
            </h1>
          </Link>
          <div className="hidden md:flex flex-1 justify-end items-center gap-8">
            <nav className="flex gap-6">
              <Link
                className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors"
                href="/"
              >
                Ana Sayfa
              </Link>
              <Link
                className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors"
                href="/solutions"
              >
                Çözümler
              </Link>
              <Link
                className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors"
                href="/analytics"
              >
                Analitik
              </Link>
              <Link
                className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors"
                href="/scrap-comparison"
              >
                Fire Karşılaştırması
              </Link>
            </nav>
            <Link
              href="/login"
              className="bg-primary hover:bg-[#1a2e4d] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Giriş Yap
            </Link>
          </div>
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-primary dark:text-gray-300"
              aria-label="Menü"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
