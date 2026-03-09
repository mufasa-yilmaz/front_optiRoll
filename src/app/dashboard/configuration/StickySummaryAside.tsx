'use client';

import type { ReactNode } from 'react';

export interface StickySummaryAsideProps {
  /** Senaryo özeti kartı ve altındaki bilgi kutusu gibi içerik. Scroll'da sayfayı takip eder (sticky). */
  children: ReactNode;
}

/**
 * Konfigürasyon sayfası sağ kolonu: aşağı/yukarı scroll'da summary sayfayla birlikte takip eder (sticky).
 * Dashboard layout'taki main overflow-auto ile scroll konteyneri olduğu için sticky burada çalışır.
 */
export function StickySummaryAside({ children }: StickySummaryAsideProps) {
  return (
    <aside className="w-full lg:w-80 lg:min-w-80 lg:shrink-0 lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">
      {children}
    </aside>
  );
}
