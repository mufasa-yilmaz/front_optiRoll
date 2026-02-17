'use client';

import { useDisplayResult } from '@/contexts/ResultViewContext';

const formatTL = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/**
 * Çözücü durum kartları: Solver Status, Objective Value, Fire/Stok Maliyeti, Rolls Used.
 */
export function SolverStatusCards() {
  const lastResult = useDisplayResult();

  const status = lastResult?.status ?? '-';
  const objective = lastResult?.objective ?? 0;
  const totalFireTon = lastResult?.summary?.totalFire ?? 0;
  const openedRolls = lastResult?.summary?.openedRolls ?? 0;

  const cards = [
    {
      icon: 'check_circle',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      label: 'Çözücü Durumu',
      value: status,
      valueClass: 'text-green-600',
    },
    {
      icon: 'attach_money',
      iconBg: 'bg-blue-50',
      iconColor: 'text-primary',
      label: 'Toplam Maliyet',
      value: lastResult ? `₺${formatTL(objective)}` : '-',
      valueClass: 'text-gray-800',
    },
    {
      icon: 'local_fire_department',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      label: 'Fire (ton)',
      value: lastResult ? `${formatTL(totalFireTon)} ton` : '-',
      valueClass: 'text-gray-800',
    },
    {
      icon: 'inventory_2',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      label: 'Kullanılan Rulo',
      value: lastResult ? String(openedRolls) : '-',
      valueClass: 'text-gray-800',
    },
  ];

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex-1 p-5 flex items-center gap-4"
          >
            <div
              className={`h-12 w-12 rounded-full ${card.iconBg} flex items-center justify-center shrink-0`}
            >
              <span
                className={`material-symbols-outlined ${card.iconColor} text-2xl font-bold`}
              >
                {card.icon}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                {card.label}
              </p>
              <p className={`text-lg font-bold ${card.valueClass}`}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
