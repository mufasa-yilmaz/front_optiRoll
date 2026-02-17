import { ProblemCard } from './ProblemCard';

const PROBLEMS = [
  {
    icon: 'delete',
    iconBgClass: 'bg-red-50 dark:bg-red-900/20',
    iconColorClass: 'text-red-500 dark:text-red-400',
    title: 'Yüksek Fire Oranları',
    description:
      'Optimize edilmemiş kesim planları hammadde israfını artırır ve karlılığı düşürür.',
  },
  {
    icon: 'warning',
    iconBgClass: 'bg-orange-50 dark:bg-orange-900/20',
    iconColorClass: 'text-orange-500 dark:text-orange-400',
    title: 'Manuel Planlama Hataları',
    description:
      'İnsan hatasına açık excel tabloları ile yapılan hesaplamalar verimsiz ve yavaştır.',
  },
  {
    icon: 'inventory_2',
    iconBgClass: 'bg-blue-50 dark:bg-blue-900/20',
    iconColorClass: 'text-accent',
    title: 'Atıl Stok Yönetimi',
    description:
      'Kullanılmayan parça ruloların depolarda yer kaplaması envanter maliyetini artırır.',
  },
  {
    icon: 'money_off',
    iconBgClass: 'bg-gray-100 dark:bg-gray-800',
    iconColorClass: 'text-gray-600 dark:text-gray-300',
    title: 'Operasyonel Giderler',
    description:
      'Verimsiz süreçler gereksiz iş gücü, zaman ve enerji kaybına yol açar.',
  },
] as const;

/**
 * Problem bölümü: "Endüstriyel Üretimin Gizli Maliyetleri" başlığı ve ProblemCard grid.
 */
export function ProblemSection() {
  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-primary dark:text-white text-3xl sm:text-4xl font-bold leading-tight mb-4">
            Endüstriyel Üretimin Gizli Maliyetleri
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Geleneksel yöntemler ve manuel planlama süreçleri işletmenize tahmin
            ettiğinizden daha fazlasına mal olabilir.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {PROBLEMS.map((p) => (
            <ProblemCard
              key={p.title}
              icon={p.icon}
              iconBgClass={p.iconBgClass}
              iconColorClass={p.iconColorClass}
              title={p.title}
              description={p.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
