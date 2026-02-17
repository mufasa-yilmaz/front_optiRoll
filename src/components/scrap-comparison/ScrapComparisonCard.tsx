'use client';

type Variant = 'traditional' | 'modern';

interface ListItem {
  icon: string;
  title: React.ReactNode;
  description: string;
  iconBgClass: string;
  iconColorClass: string;
}

interface ScrapComparisonCardProps {
  variant: Variant;
  title: string;
  headerIcon: string;
  visual: React.ReactNode;
  visualLabel: string;
  items: ListItem[];
  /** Animasyon gecikmesi (saniye). */
  animationDelay?: number;
}

/**
 * Fire karşılaştırması için tek kart: geleneksel (sorun) veya modern (çözüm) varyantı.
 */
export function ScrapComparisonCard({
  variant,
  title,
  headerIcon,
  visual,
  visualLabel,
  items,
  animationDelay = 0,
}: ScrapComparisonCardProps) {
  const isModern = variant === 'modern';

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${
        isModern
          ? 'bg-primary text-white border-primary shadow-xl md:-translate-y-4 md:shadow-2xl ring-1 ring-white/10'
          : 'border-gray-200 bg-white'
      }`}
      style={{
        animation: 'fade-in-up 0.5s ease-out forwards',
        animationDelay: `${animationDelay}s`,
        opacity: 0,
      }}
    >
      {isModern && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-2xl" />
      )}
      <div
        className={`p-6 sm:p-8 border-b flex items-center justify-between ${
          isModern
            ? 'bg-white/10 border-white/10 relative z-10'
            : 'bg-third/80 border-gray-100'
        }`}
      >
        <h3
          className={`text-xl font-bold ${isModern ? 'text-white' : 'text-gray-700'}`}
        >
          {title}
        </h3>
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center ${
            isModern
              ? 'bg-secondary text-primary shadow-lg'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          <span className="material-symbols-outlined">{headerIcon}</span>
        </div>
      </div>
      <div className="flex-1 p-6 sm:p-8 flex flex-col gap-8 relative z-10">
        <div
          className={`flex flex-col items-center justify-center py-6 rounded-xl border ${
            isModern
              ? 'bg-white/5 border-white/10'
              : 'bg-third rounded-xl border-dashed border-gray-300'
          }`}
        >
          <div
            className={
              isModern
                ? 'relative flex items-center gap-4'
                : 'relative flex items-center gap-4 opacity-80'
            }
          >
            {visual}
          </div>
          <p
            className={`mt-4 text-sm font-medium ${
              isModern ? 'text-white/60' : 'text-gray-400'
            }`}
          >
            {visualLabel}
          </p>
        </div>
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={String(item.title)} className="flex items-start gap-4">
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.iconBgClass} ${item.iconColorClass}`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {item.icon}
                </span>
              </div>
              <div>
                <p
                  className={`font-bold text-lg ${
                    isModern ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {item.title}
                </p>
                <p
                  className={`text-sm ${
                    isModern ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
