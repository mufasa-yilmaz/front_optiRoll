'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Dashboard alanı layout header: OptiRoll logosu,
 * Dashboard, Optimizasyon, Geçmiş linkleri ve Çıkış Yap.
 */
export function DashboardLayoutHeader() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e8edf2] bg-white/90 backdrop-blur-md">
      <div className="container mx-auto max-w-[1280px] px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined text-[20px]">
                cut
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0f141a]">
              OptiRoll
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              Kontrol Paneli
            </Link>
            <Link
              href="/dashboard/sonuc"
              className={`text-sm font-medium transition-colors ${
                pathname === '/dashboard/sonuc'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              Sonuçlar
            </Link>
            <Link
              href="/dashboard/kesim-karsilastirma"
              className={`text-sm font-medium transition-colors ${
                pathname === '/dashboard/kesim-karsilastirma'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              Kesim Karşılaştırması
            </Link>
            <Link
              href="/dashboard/configuration"
              className={`text-sm font-medium transition-colors ${
                pathname === '/dashboard/configuration'
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              Optimizasyon
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Geçmiş
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              JD
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">
                logout
              </span>
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
