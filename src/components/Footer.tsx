import Link from 'next/link';

/**
 * Site footer: logo, linkler, sosyal ikonlar, telif.
 * Kullanıcı verdiği tasarıma göre dark mode destekli.
 */
export function Footer() {
  return (
    <footer className="bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 pt-12 pb-8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-6 text-primary dark:text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">cut</span>
            </div>
            <span className="text-primary dark:text-white text-lg font-bold">
              OptiRoll
            </span>
          </Link>
          <div className="flex flex-wrap justify-center gap-8">
            <Link
              className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white text-sm transition-colors"
              href="#"
            >
              Gizlilik Politikası
            </Link>
            <Link
              className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white text-sm transition-colors"
              href="#"
            >
              Kullanım Şartları
            </Link>
            <Link
              className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white text-sm transition-colors"
              href="#"
            >
              Destek
            </Link>
          </div>
          <div className="flex gap-4">
            <Link
              className="text-gray-400 hover:text-accent transition-colors"
              href="#"
              aria-label="Web"
            >
              <span className="material-symbols-outlined">public</span>
            </Link>
            <Link
              className="text-gray-400 hover:text-accent transition-colors"
              href="#"
              aria-label="Mail"
            >
              <span className="material-symbols-outlined">mail</span>
            </Link>
          </div>
        </div>
        <div className="text-center text-gray-400 text-sm">
          © 2024 OptiRoll. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
