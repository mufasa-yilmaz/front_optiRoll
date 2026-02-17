'use client';

const cards = [
  {
    id: 'status',
    label: 'Çözücü Durumu',
    value: 'Optimal',
    icon: 'check_circle',
    bgClass: 'bg-green-50',
    valueClass: 'text-green-600',
    iconClass: 'text-green-600',
    delay: 0,
  },
  {
    id: 'objective',
    label: 'Hedef Değer',
    value: 'Toplam Maliyet: 12.450 ₺',
    icon: 'attach_money',
    bgClass: 'bg-third',
    valueClass: 'text-gray-800',
    iconClass: 'text-primary',
    delay: 50,
  },
  {
    id: 'runtime',
    label: 'Çalışma Süresi',
    value: '4,2 sn',
    icon: 'timer',
    bgClass: 'bg-secondary/10',
    valueClass: 'text-gray-800',
    iconClass: 'text-secondary',
    delay: 100,
  },
  {
    id: 'rolls',
    label: 'Kullanılan Rulo',
    value: '12',
    icon: 'inventory_2',
    bgClass: 'bg-amber-50',
    valueClass: 'text-gray-800',
    iconClass: 'text-amber-600',
    delay: 150,
  },
];

/**
 * Özet KPI kartları: çözücü durumu, maliyet, süre, rulo sayısı.
 */
export function StatusCards() {
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {cards.map((card, i) => (
          <div
            key={card.id}
            className="flex-1 p-5 flex items-center gap-4 animate-fade-in-up hover:bg-third/30 transition-colors duration-200"
            style={{ animationDelay: `${card.delay}ms`, animationFillMode: 'backwards' }}
          >
            <div
              className={`h-12 w-12 rounded-full ${card.bgClass} flex items-center justify-center shrink-0`}
            >
              <span
                className={`material-symbols-outlined text-2xl font-bold ${card.iconClass}`}
              >
                {card.icon}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                {card.label}
              </p>
              <p className={`text-lg font-bold ${card.valueClass}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
