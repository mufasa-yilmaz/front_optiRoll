'use client';

import { ScrapComparisonCard } from './ScrapComparisonCard';
import { ScrapComparisonHeader } from './ScrapComparisonHeader';

/** Geleneksel yaklaşım kartı için görsel (doğrusal tüketim). */
function TraditionalVisual() {
  return (
    <>
      <span className="material-symbols-outlined text-6xl text-gray-400">
        inventory_2
      </span>
      <span className="material-symbols-outlined text-3xl text-gray-300">
        arrow_right_alt
      </span>
      <div className="flex flex-col items-center">
        <span className="material-symbols-outlined text-5xl text-gray-600">
          content_cut
        </span>
        <span className="text-xs font-mono text-tertiary font-bold mt-1">
          FİRE
        </span>
      </div>
    </>
  );
}

/** Bu çalışmanın yaklaşımı kartı için görsel (dinamik optimizasyon). */
function ModernVisual() {
  return (
    <>
      <span className="material-symbols-outlined text-6xl text-white">
        inventory_2
      </span>
      <span className="material-symbols-outlined text-3xl text-secondary">
        arrow_right_alt
      </span>
      <div className="flex items-end gap-1">
        <div className="flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-white">
            view_cozy
          </span>
          <span className="text-[10px] font-mono text-white/70 mt-1">
            SİPARİŞLER
          </span>
        </div>
        <span className="material-symbols-outlined text-2xl text-secondary mb-4">
          add
        </span>
        <div className="flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-secondary">
            savings
          </span>
          <span className="text-[10px] font-mono text-secondary font-bold mt-1">
            STOK
          </span>
        </div>
      </div>
    </>
  );
}

const TRADITIONAL_ITEMS = [
  {
    icon: 'remove',
    iconBgClass: 'bg-red-100',
    iconColorClass: 'text-tertiary',
    title: 'Tek sipariş – tek rulo',
    description: 'Her sipariş için yeni rulo açılır.',
  },
  {
    icon: 'delete_forever',
    iconBgClass: 'bg-red-100',
    iconColorClass: 'text-tertiary',
    title: (
      <>
        Artan ={' '}
        <span className="text-tertiary underline decoration-2 underline-offset-2">
          fire
        </span>
      </>
    ),
    description: 'Kalan parçalar hurdaya ayrılır.',
  },
  {
    icon: 'lock',
    iconBgClass: 'bg-gray-100',
    iconColorClass: 'text-gray-500',
    title: 'Katı planlama',
    description: 'Değişkenlere kapalı statik süreç.',
  },
];

const MODERN_ITEMS = [
  {
    icon: 'done_all',
    iconBgClass: 'bg-secondary',
    iconColorClass: 'text-primary',
    title: 'Çoklu sipariş – tek rulo',
    description: 'Bir rulo birden fazla siparişi karşılar.',
  },
  {
    icon: 'recycling',
    iconBgClass: 'bg-secondary',
    iconColorClass: 'text-primary',
    title: (
      <>
        Artan ={' '}
        <span className="text-secondary underline decoration-2 underline-offset-2">
          potansiyel stok
        </span>
      </>
    ),
    description: 'Parçalar değerli envantere dönüşür.',
  },
  {
    icon: 'tune',
    iconBgClass: 'bg-white/20',
    iconColorClass: 'text-white',
    title: 'Esnek planlama',
    description: 'Anlık değişime uyumlu dinamik yapı.',
  },
];

/**
 * Fire oluşumu karşılaştırması bölümü: başlık + geleneksel ve modern iki kart.
 */
export function ScrapComparisonSection() {
  return (
    <>
      <ScrapComparisonHeader />
      <section className="py-8 md:py-16 px-4">
        <div className="container mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            <ScrapComparisonCard
              variant="traditional"
              title="Geleneksel Yaklaşım"
              headerIcon="history"
              visual={<TraditionalVisual />}
              visualLabel="Doğrusal Tüketim Modeli"
              items={TRADITIONAL_ITEMS}
              animationDelay={0.1}
            />
            <ScrapComparisonCard
              variant="modern"
              title="Bu Çalışmanın Yaklaşımı"
              headerIcon="check"
              visual={<ModernVisual />}
              visualLabel="Dinamik Optimizasyon Modeli"
              items={MODERN_ITEMS}
              animationDelay={0.2}
            />
          </div>
        </div>
      </section>
    </>
  );
}
