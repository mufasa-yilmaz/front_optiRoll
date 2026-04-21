'use client';

import type { ReactNode } from 'react';

/**
 * Kesim karşılaştırması için sunucu PNG’si olmadan çizilen özet SVG grafikleri
 * (toplam maliyet ve TL kırılımı — tez raporundaki bar grafiklerine benzer).
 */
import type { SummaryResponse } from '@/lib/api';

const RENK = {
  fire: '#E45756',
  stokUretim: '#4C78A8',
  stokRaf: '#6B9BD1',
  setup: '#72B7B2',
  seq: '#B279A2',
  eksen: '#e5e7eb',
  metin: '#374151',
} as const;

/**
 * Güvenli sayı döndürür (yoksa 0).
 */
function n(v: number | undefined | null): number {
  if (v === undefined || v === null || Number.isNaN(v)) return 0;
  return Math.max(0, v);
}

/**
 * Özetten yatay stacked bar için segment TL listesini üretir.
 */
function breakdownSegments(s: SummaryResponse | undefined): { key: string; label: string; value: number; color: string }[] {
  if (!s) return [];
  return [
    { key: 'fire', label: 'Fire', value: n(s.costFireLira), color: RENK.fire },
    { key: 'sp', label: 'Stok (üretim)', value: n(s.costStockProductionLira), color: RENK.stokUretim },
    { key: 'ss', label: 'Stok (raf)', value: n(s.costStockShelfLira), color: RENK.stokRaf },
    { key: 'setup', label: 'Kurulum', value: n(s.costSetupLira), color: RENK.setup },
    { key: 'seq', label: 'Sıra cezası', value: n(s.costSequencePenaltyLira), color: RENK.seq },
  ].filter((x) => x.value > 1e-6);
}

type TotalCostCompareSvgProps = {
  /** Sol sütun etiketi (örn. A veya kısa fileId). */
  labelA: string;
  /** Sağ sütun etiketi. */
  labelB: string;
  /** A toplam maliyeti (₺). */
  totalA: number;
  /** B toplam maliyeti (₺). */
  totalB: number;
};

/**
 * İki çalıştırmanın toplam maliyetini yan yana sütun olarak gösteren SVG.
 */
export function TotalCostCompareSvg({ labelA, labelB, totalA, totalB }: TotalCostCompareSvgProps) {
  const w = 520;
  const h = 220;
  const pad = 36;
  const chartW = w - pad * 2;
  const chartH = 120;
  const baseY = pad + chartH;
  const maxV = Math.max(totalA, totalB, 1);
  const barW = Math.min(72, chartW / 2 - 24);
  const xA = pad + chartW * 0.25 - barW / 2;
  const xB = pad + chartW * 0.75 - barW / 2;
  const hA = (totalA / maxV) * chartH;
  const hB = (totalB / maxV) * chartH;

  const fmt = (v: number) =>
    `₺${v.toLocaleString('tr-TR', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Toplam maliyet karşılaştırması</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto max-h-[240px]" role="img" aria-label="Toplam maliyet A ve B">
        <line x1={pad} y1={baseY} x2={w - pad} y2={baseY} stroke={RENK.eksen} strokeWidth={2} />
        <rect x={xA} y={baseY - hA} width={barW} height={hA} rx={4} fill="#153b6a" opacity={0.9} />
        <rect x={xB} y={baseY - hB} width={barW} height={hB} rx={4} fill="#4A90E2" opacity={0.9} />
        <text x={xA + barW / 2} y={baseY + 22} textAnchor="middle" fontSize={12} fill={RENK.metin}>
          {labelA.length > 14 ? `${labelA.slice(0, 12)}…` : labelA}
        </text>
        <text x={xB + barW / 2} y={baseY + 22} textAnchor="middle" fontSize={12} fill={RENK.metin}>
          {labelB.length > 14 ? `${labelB.slice(0, 12)}…` : labelB}
        </text>
        <text x={xA + barW / 2} y={baseY - hA - 8} textAnchor="middle" fontSize={11} fontWeight="600" fill={RENK.metin}>
          {fmt(totalA)}
        </text>
        <text x={xB + barW / 2} y={baseY - hB - 8} textAnchor="middle" fontSize={11} fontWeight="600" fill={RENK.metin}>
          {fmt(totalB)}
        </text>
      </svg>
    </div>
  );
}

type CostBreakdownCompareSvgProps = {
  /** Sol özet (çalıştırma A). */
  summaryA: SummaryResponse | undefined;
  /** Sağ özet (çalıştırma B). */
  summaryB: SummaryResponse | undefined;
  labelA: string;
  labelB: string;
};

/**
 * İki çalıştırma için maliyet kırılımını yatay stacked bar ile gösteren SVG (A üst, B alt).
 */
export function CostBreakdownCompareSvg({ summaryA, summaryB, labelA, labelB }: CostBreakdownCompareSvgProps) {
  const w = 600;
  const rowH = 44;
  const pad = 16;
  const barLeft = 140;
  const barW = w - barLeft - pad;
  const segsA = breakdownSegments(summaryA);
  const segsB = breakdownSegments(summaryB);
  const totA = segsA.reduce((s, x) => s + x.value, 0);
  const totB = segsB.reduce((s, x) => s + x.value, 0);
  const h = pad * 2 + rowH * 2 + 56;

  const renderRow = (
    y: number,
    label: string,
    segs: { key: string; label: string; value: number; color: string }[],
    total: number,
  ) => {
    let x = barLeft;
    const els: ReactNode[] = [];
    const t = total > 0 ? total : 1;
    segs.forEach((seg) => {
      const segW = (seg.value / t) * barW;
      if (segW < 0.5) return;
      els.push(
        <rect
          key={seg.key}
          x={x}
          y={y}
          width={segW}
          height={rowH - 8}
          rx={3}
          fill={seg.color}
          stroke="#fff"
          strokeWidth={0.5}
        />,
      );
      x += segW;
    });
    return (
      <g key={label}>
        <text x={pad} y={y + (rowH - 8) / 2 + 5} fontSize={12} fill={RENK.metin} fontWeight="500">
          {label.length > 18 ? `${label.slice(0, 16)}…` : label}
        </text>
        {els}
        <text x={barLeft + barW + 8} y={y + (rowH - 8) / 2 + 5} fontSize={11} fill="#6b7280">
          {total > 0
            ? `₺${total.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`
            : '—'}
        </text>
      </g>
    );
  };

  const legendItems = [
    { c: RENK.fire, t: 'Fire' },
    { c: RENK.stokUretim, t: 'Stok üretim' },
    { c: RENK.stokRaf, t: 'Stok raf' },
    { c: RENK.setup, t: 'Kurulum' },
    { c: RENK.seq, t: 'Sıra' },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Maliyet kırılımı (TL) — oranlar</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto max-h-[280px]" role="img" aria-label="Maliyet kırılımı A ve B">
        {renderRow(pad, labelA, segsA, totA)}
        {renderRow(pad + rowH + 12, labelB, segsB, totB)}
        <g transform={`translate(${pad}, ${h - 40})`}>
          {legendItems.map((it, i) => (
            <g key={it.t} transform={`translate(${i * 112}, 0)`}>
              <rect width={10} height={10} rx={2} fill={it.c} y={0} />
              <text x={14} y={9} fontSize={10} fill="#4b5563">
                {it.t}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

type TonCompareSvgProps = {
  labelA: string;
  labelB: string;
  fireA: number;
  fireB: number;
  stockA: number;
  stockB: number;
};

/**
 * Fire ve stok tonajını yan yana çift bar ile gösteren SVG.
 */
export function TonFireStockCompareSvg({ labelA, labelB, fireA, fireB, stockA, stockB }: TonCompareSvgProps) {
  const w = 520;
  const h = 200;
  const pad = 28;
  const gW = (w - pad * 2) / 2;
  const chartH = 90;
  const baseY = pad + chartH;
  const maxT = Math.max(fireA, fireB, stockA, stockB, 0.001);
  const barPairW = 22;
  const gap = 8;
  const cx = (idx: number) => pad + gW * idx + gW / 2;

  const bar = (cx0: number, v: number, color: string, offset: number) => {
    const bh = (v / maxT) * chartH;
    return <rect x={cx0 - barPairW / 2 + offset} y={baseY - bh} width={barPairW} height={bh} rx={3} fill={color} />;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Tonaj: fire ve stok</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto max-h-[220px]" role="img" aria-label="Fire ve stok ton">
        <line x1={pad} y1={baseY} x2={w - pad} y2={baseY} stroke={RENK.eksen} strokeWidth={2} />
        {bar(cx(0), fireA, RENK.fire, -gap / 2)}
        {bar(cx(0), stockA, RENK.stokUretim, gap / 2)}
        {bar(cx(1), fireB, RENK.fire, -gap / 2)}
        {bar(cx(1), stockB, RENK.stokUretim, gap / 2)}
        <text x={cx(0)} y={baseY + 20} textAnchor="middle" fontSize={11} fill={RENK.metin}>
          {labelA.length > 12 ? `${labelA.slice(0, 10)}…` : labelA}
        </text>
        <text x={cx(1)} y={baseY + 20} textAnchor="middle" fontSize={11} fill={RENK.metin}>
          {labelB.length > 12 ? `${labelB.slice(0, 10)}…` : labelB}
        </text>
        <g transform={`translate(${pad}, ${12})`}>
          <rect x={0} y={0} width={10} height={10} rx={2} fill={RENK.fire} />
          <text x={14} y={9} fontSize={10} fill="#4b5563">
            Fire (t)
          </text>
          <rect x={88} y={0} width={10} height={10} rx={2} fill={RENK.stokUretim} />
          <text x={102} y={9} fontSize={10} fill="#4b5563">
            Stok (t)
          </text>
        </g>
      </svg>
    </div>
  );
}
