import type { ReactNode } from 'react';

type DashboardCardProps = {
  /** Kart başlığı */
  title: string;
  /** Başlık yanında gösterilecek Material ikon adı */
  icon?: string;
  /** Kart gövdesi */
  children: ReactNode;
  /** Üst bölümün sağ tarafına eklenecek içerik (örn. dropdown + buton); verilirse ikon gösterilmez */
  headerRight?: ReactNode;
  /** Ek sınıflar (örn. flex-grow) */
  className?: string;
  /** Animasyon gecikmesi (ms) */
  animationDelayMs?: number;
};

/**
 * Dashboard kartı sarmalayıcı: ortak başlık + ikon ve gölgeli kutu.
 */
export function DashboardCard({
  title,
  icon = 'widgets',
  children,
  headerRight,
  className = '',
  animationDelayMs,
}: DashboardCardProps) {
  return (
    <section
      className={`rounded-xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden transition-shadow hover:shadow-md duration-300 animate-fade-in-up [animation-fill-mode:both] ${className}`}
      style={animationDelayMs != null ? { animationDelay: `${animationDelayMs}ms` } : undefined}
    >
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        {headerRight}
      </div>
      <div>{children}</div>
    </section>
  );
}
