/**
 * Tek bir problem kartı: ikon, başlık, açıklama.
 * Hover'da border ve gölge, ikon scale animasyonu. Dark mode destekli.
 */
export interface ProblemCardProps {
  /** Material symbol adı (örn. delete, warning) */
  icon: string;
  /** İkon arka plan rengi sınıfı (örn. bg-red-50, bg-orange-50) */
  iconBgClass: string;
  /** İkon rengi sınıfı (örn. text-red-500, text-secondary) */
  iconColorClass: string;
  title: string;
  description: string;
  /** Stagger animasyon gecikmesi (s) - opsiyonel */
  delay?: number;
}

export function ProblemCard({
  icon,
  iconBgClass,
  iconColorClass,
  title,
  description,
}: ProblemCardProps) {
  return (
    <div className="group flex flex-col gap-4 p-6 rounded-2xl bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 hover:border-accent/50 dark:hover:border-accent/50 hover:shadow-lg transition-all duration-300">
      <div
        className={`w-12 h-12 rounded-lg ${iconBgClass} flex items-center justify-center ${iconColorClass} group-hover:scale-110 transition-transform`}
      >
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-primary dark:text-white text-lg font-bold">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
