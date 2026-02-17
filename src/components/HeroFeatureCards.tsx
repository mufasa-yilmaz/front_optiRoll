/**
 * Hero bölümü altındaki 3 özellik kartı:
 * Fire Oranı Azalması, Artan Tonajın Yeniden Kullanımı, Planlama Esnekliği.
 */
export function HeroFeatureCards() {
  const cards = [
    {
      icon: 'percent',
      iconBg: 'text-accent bg-accent/10',
      title: 'Fire Oranı Azalması',
    },
    {
      icon: 'recycling',
      iconBg: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
      title: 'Artan Tonajın Yeniden Kullanımı',
    },
    {
      icon: 'tune',
      iconBg: 'text-orange-500 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
      title: 'Planlama Esnekliği',
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(({ icon, iconBg, title }) => (
        <div
          key={title}
          className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-2 items-center text-center sm:items-start sm:text-left transition-transform hover:scale-105"
        >
          <div className={`${iconBg} p-2 rounded-lg mb-1`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <p className="font-bold text-sm text-primary dark:text-white">
            {title}
          </p>
        </div>
      ))}
    </div>
  );
}
