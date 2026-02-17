'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Nav, Footer } from '@/components';

/**
 * Nav ve Footer'ı pathname'e göre koşullu render eder.
 * /login: Nav ve Footer gizlenir (tam ekran login).
 * /dashboard/*: Nav ve Footer gizlenir (dashboard kendi sidebar layout'unu kullanır).
 * Hydration hatası önlemek için pathname kontrolü mount sonrasına ertelenir.
 */
export function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoginPage = pathname === '/login';
  const isDashboard = pathname?.startsWith('/dashboard');
  const hideShell = mounted && (isLoginPage || isDashboard);

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex flex-col min-h-screen w-full overflow-x-hidden">
      <Nav />
      <main className="flex-grow flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
