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
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-shadow hover:shadow-md duration-300 animate-fade-in-up [animation-fill-mode:both] ${className}`}
      style={animationDelayMs != null ? { animationDelay: `${animationDelayMs}ms` } : undefined}
    >
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap bg-third/50">
        <h2 className="text-lg font-bold text-primary font-display">{title}</h2>
        {headerRight ?? (
          <span className="material-symbols-outlined text-slate-400 text-xl">{icon}</span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
