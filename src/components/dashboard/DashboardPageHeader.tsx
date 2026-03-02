'use client';

import type { ReactNode } from 'react';

export interface DashboardPageHeaderProps {
  /** Sayfa başlığı */
  title: string;
  /** Alt açıklama metni */
  description?: string;
  /** Sağ tarafta gösterilecek aksiyon (buton, link vb.) */
  action?: ReactNode;
}

/**
 * Dashboard sayfalarında tek tip kullanılan üst başlık alanı.
 * Orders sayfası header stili ile uyumludur.
 */
export function DashboardPageHeader({
  title,
  description,
  action,
}: DashboardPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-black leading-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
