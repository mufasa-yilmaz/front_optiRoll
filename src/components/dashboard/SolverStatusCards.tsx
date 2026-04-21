'use client';

import { useDisplayResult } from '@/contexts/ResultViewContext';
import { formatTonDisplayTr } from '@/components/dashboard/orders/helpers';

const formatTL = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/**
 * Çözücü durum kartları: durum, toplam maliyet (özet + kırılım), fire tonu, açılan rulo.
 */
export function SolverStatusCards() {
  const lastResult = useDisplayResult();

  const status = lastResult?.status ?? '-';
  const summary = lastResult?.summary;
  const totalCost = summary != null ? Number(summary.totalCost ?? 0) : 0;
  const totalFireTon = summary != null ? Number(summary.totalFire ?? 0) : 0;
  const totalStockTon = summary != null ? Number(summary.totalStock ?? 0) : 0;
  const openedRolls = summary != null ? Number(summary.openedRolls ?? 0) : 0;
  const cf = summary != null ? Number(summary.costFireLira ?? 0) : 0;
  const ch = summary != null ? Number(summary.costStockLira ?? 0) : 0;
  const cA = summary != null ? Number(summary.costSetupLira ?? 0) : 0;
  const cSeq = summary != null ? Number(summary.costSequencePenaltyLira ?? 0) : 0;

  const cards = [
    {
      icon: 'check_circle',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      label: 'Çözücü Durumu',
      value: status,
      valueClass: 'text-green-600',
      sub: null as string | null,
    },
    {
      icon: 'attach_money',
      iconBg: 'bg-blue-50',
      iconColor: 'text-primary',
      label: 'Toplam Maliyet',
      value: lastResult ? `₺${formatTL(totalCost)}` : '-',
      valueClass: 'text-gray-800',
      sub: lastResult
        ? `Fire ₺${formatTL(cf)} · Stok (üretim+elde) ₺${formatTL(ch)} · Kurulum ₺${formatTL(cA)}${
            cSeq > 0 ? ` · Sıra cezası ₺${formatTL(cSeq)}` : ''
          }`
        : null,
    },
    {
      icon: 'local_fire_department',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      label: 'Fire (ton)',
      value: lastResult ? `${formatTonDisplayTr(totalFireTon)} t` : '-',
      valueClass: 'text-gray-800',
      sub:
        lastResult && totalStockTon > 1e-9
          ? `Üretim stoku: ${formatTonDisplayTr(totalStockTon)} t`
          : lastResult
            ? 'Üretim stoku: 0 t'
            : null,
    },
    {
      icon: 'inventory_2',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      label: 'Açılan Rulo',
      value: lastResult ? String(openedRolls) : '-',
      valueClass: 'text-gray-800',
      sub: null as string | null,
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
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                {card.label}
              </p>
              <p className={`text-lg font-bold ${card.valueClass}`}>
                {card.value}
              </p>
              {card.sub ? (
                <p className="mt-1 text-[11px] leading-snug text-gray-500 break-words">{card.sub}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
