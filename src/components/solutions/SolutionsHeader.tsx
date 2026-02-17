/**
 * Çözümler sayfası üst navigasyonu: logo, menü linkleri, giriş butonu.
 * primary/secondary renk paleti, animasyonlu giriş.
 */
export function SolutionsHeader() {
  return (
    <header className="w-full border-b border-gray-200 bg-white px-6 lg:px-16 py-4 flex items-center justify-between z-20 animate-fade-in-down">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform duration-300 hover:scale-105">
          R
        </div>
        <span className="text-xl font-bold tracking-tight text-primary">
          RollCut Optims
        </span>
      </div>
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
        <a className="hover:text-primary transition-colors duration-200" href="/#">
          Özellikler
        </a>
        <a className="text-primary font-semibold" href="/solutions">
          Çözümler
        </a>
        <a className="hover:text-primary transition-colors duration-200" href="/#">
          Fiyatlandırma
        </a>
      </nav>
      <button
        type="button"
        className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/20 transition-all duration-200 active:scale-95"
      >
        Giriş Yap
      </button>
    </header>
  );
}
