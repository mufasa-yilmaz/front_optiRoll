'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

/** Dashboard sidebar menü öğesi */
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/dashboard/configuration', label: 'Konfigürasyon', icon: 'tune' },
  { href: '/dashboard/orders', label: 'Sipariş Setleri', icon: 'list_alt' },
  { href: '/dashboard/stocks', label: 'Stok Setleri', icon: 'inventory_2' },
  { href: '/dashboard/sonuc', label: 'Sonuçlar', icon: 'analytics' },
  { href: '/dashboard/kesim-karsilastirma', label: 'Kesim Karşılaştırması', icon: 'compare' },
] as const;

/**
 * Dashboard sol sidebar: logo, navigasyon linkleri ve çıkış.
 * Dashboard sayfalarında Nav yerine kullanılır.
 */
export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-slate-200 bg-white min-h-screen">
      <div className="p-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined text-[22px]">cut</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#0f141a]">
            OptiRoll
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-slate-100 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            JD
          </div>
          <span className="text-sm text-slate-600 truncate">Kullanıcı</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-slate-100 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
