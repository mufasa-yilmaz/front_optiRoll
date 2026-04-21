'use client';

import { useMemo, useState } from 'react';
import { useDisplayResult } from '@/contexts/ResultViewContext';
import { formatTonDisplayTr } from '@/components/dashboard/orders/helpers';

const ORDER_COLORS = [
  '#153b6a',
  '#2563eb',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#f97316',
  '#8b5cf6',
  '#ec4899',
];

const PAGE_SIZE = 6;

type ViewMode = 'roll' | 'order';

interface RollSegmentRow {
  rollId: number;
  totalTonnage: number;
  used: number;
  fire: number;
  stock: number;
  segments: { orderId: number; tonnage: number }[];
}

interface OrderAnalyticsRow {
  orderId: number;
  requiredM2: number;
  assignedRollIds: number[];
  wastePct: number;
  stockPct: number;
}

interface AssignedRollHoverInfo {
  rollId: number;
  orderId: number;
  assignedTon: number;
  utilizationPct: number;
  stockTon: number;
  fireTon: number;
}

/**
 * Sayısal değeri yerel formatta gösterir.
 */
function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Roll bazlı segment verisini sonuçtan üretir.
 */
function buildRollRows(
  rollStatus: { rollId: number; totalTonnage: number; used: number; fire: number; stock: number }[],
  cuttingPlan: { rollId: number; orderId: number; tonnage: number }[],
): RollSegmentRow[] {
  return rollStatus.map((roll) => {
    const segments = cuttingPlan
      .filter((item) => item.rollId === roll.rollId)
      .map((item) => ({ orderId: item.orderId, tonnage: item.tonnage }));
    return {
      rollId: roll.rollId,
      totalTonnage: roll.totalTonnage,
      used: roll.used,
      fire: roll.fire,
      stock: roll.stock,
      segments,
    };
  });
}

/**
 * Sipariş bazlı analitik satırları sonuçtan hesaplar.
 */
function buildOrderRows(
  rollRows: RollSegmentRow[],
  cuttingPlan: { orderId: number; rollId: number; m2: number; tonnage: number }[],
): OrderAnalyticsRow[] {
  const byOrder = new Map<number, { requiredM2: number; usedTon: number; wasteTon: number; stockTon: number; rolls: Set<number> }>();

  cuttingPlan.forEach((item) => {
    const entry = byOrder.get(item.orderId) || {
      requiredM2: 0,
      usedTon: 0,
      wasteTon: 0,
      stockTon: 0,
      rolls: new Set<number>(),
    };
    entry.requiredM2 += item.m2;
    entry.usedTon += item.tonnage;
    entry.rolls.add(item.rollId);
    byOrder.set(item.orderId, entry);
  });

  rollRows.forEach((roll) => {
    const totalAssigned = roll.segments.reduce((sum, item) => sum + item.tonnage, 0);
    if (totalAssigned <= 0) return;
    roll.segments.forEach((segment) => {
      const entry = byOrder.get(segment.orderId);
      if (!entry) return;
      if (roll.fire > 0) {
        entry.wasteTon += roll.fire * (segment.tonnage / totalAssigned);
      }
      if (roll.stock > 0) {
        // Aynı roll üzerindeki segment oranına göre stok payı dağıtımı.
        entry.stockTon += roll.stock * (segment.tonnage / totalAssigned);
      }
    });
  });

  return Array.from(byOrder.entries())
    .map(([orderId, entry]) => ({
      orderId,
      requiredM2: entry.requiredM2,
      assignedRollIds: Array.from(entry.rolls).sort((a, b) => a - b),
      wastePct: entry.usedTon > 0 ? (entry.wasteTon / entry.usedTon) * 100 : 0,
      stockPct: entry.usedTon > 0 ? (entry.stockTon / entry.usedTon) * 100 : 0,
    }))
    .sort((a, b) => a.orderId - b.orderId);
}

/**
 * Atık oranına göre durum etiketi döndürür.
 */
function resolveOrderStatus(wastePct: number): { label: string; className: string } {
  if (wastePct <= 2) return { label: 'Optimize Edildi', className: 'bg-emerald-100 text-emerald-700' };
  if (wastePct <= 5) return { label: 'İnceleme', className: 'bg-amber-100 text-amber-700' };
  return { label: 'Dikkat', className: 'bg-rose-100 text-rose-700' };
}

/**
 * Sonuç ekranında roll/order bazlı sekmeli kırılım görünümü.
 */
export function SolverBreakdownTabs() {
  const result = useDisplayResult();
  const [viewMode, setViewMode] = useState<ViewMode>('roll');
  const [orderSearch, setOrderSearch] = useState('');
  const [page, setPage] = useState(1);

  const rollRows = useMemo(
    () => buildRollRows(result?.rollStatus || [], result?.cuttingPlan || []),
    [result?.rollStatus, result?.cuttingPlan],
  );
  const orderRows = useMemo(
    () => buildOrderRows(rollRows, result?.cuttingPlan || []),
    [rollRows, result?.cuttingPlan],
  );

  const maxTon = Math.max(1, ...rollRows.map((item) => item.totalTonnage));
  const totalWeightTon = rollRows.reduce((sum, item) => sum + item.totalTonnage, 0);
  const totalUsedTon = rollRows.reduce((sum, item) => sum + item.used, 0);
  const totalFireTon = rollRows.reduce((sum, item) => sum + item.fire, 0);
  const efficiencyPct = totalWeightTon > 0 ? (totalUsedTon / totalWeightTon) * 100 : 0;
  const scrapRatePct = totalWeightTon > 0 ? (totalFireTon / totalWeightTon) * 100 : 0;
  const totalRolls = rollRows.length;
  const filteredOrders = orderRows.filter((item) =>
    `ord-${item.orderId}`.toLowerCase().includes(orderSearch.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /**
   * Order-based rozetlerde gösterilecek roll tooltip verisini üretir.
   */
  function getAssignedRollHoverInfo(
    rollId: number,
    orderId: number,
  ): AssignedRollHoverInfo | null {
    const roll = rollRows.find((item) => item.rollId === rollId);
    if (!roll) return null;
    const segment = roll.segments.find((item) => item.orderId === orderId);
    const assignedTon = segment?.tonnage || 0;
    const utilizationPct = roll.totalTonnage > 0 ? (assignedTon / roll.totalTonnage) * 100 : 0;
    return {
      rollId,
      orderId,
      assignedTon,
      utilizationPct,
      stockTon: roll.stock,
      fireTon: roll.fire,
    };
  }

  if (!result) return null;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Toplam Ağırlık</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-800">
              {formatNumber(totalWeightTon * 1000, 0)} kg
            </h3>
          </div>
          <span className="material-symbols-outlined rounded-lg bg-blue-50 p-2 text-primary">weight</span>
        </div>
        <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Malzeme Kullanımı</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-800">%{formatNumber(efficiencyPct, 1)}</h3>
          </div>
          <span className="material-symbols-outlined rounded-lg bg-green-50 p-2 text-green-600">trending_up</span>
        </div>
        <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fire Oranı</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-800">%{formatNumber(scrapRatePct, 1)}</h3>
          </div>
          <span className="material-symbols-outlined rounded-lg bg-red-50 p-2 text-red-500">warning</span>
        </div>
        <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Toplam Rulo</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-800">{totalRolls}</h3>
          </div>
          <span className="material-symbols-outlined rounded-lg bg-purple-50 p-2 text-purple-500">album</span>
        </div>
      </section>

      {/* <section className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-1 rounded-lg bg-slate-200/60 p-1">
            <button
              type="button"
              onClick={() => setViewMode('roll')}
              className={`rounded-md px-6 py-1.5 text-sm font-bold ${
                viewMode === 'roll' ? 'bg-white text-primary shadow-sm' : 'text-slate-600'
              }`}
            >
              Rulo Bazlı Sonuçlar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('order')}
              className={`rounded-md px-6 py-1.5 text-sm font-bold ${
                viewMode === 'order' ? 'bg-white text-primary shadow-sm' : 'text-slate-600'
              }`}
            >
              Sipariş Bazlı Sonuçlar
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Siparişler</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Stok</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Fire</div>
          </div>
        </div>

        <div className="relative">
          <div
            className={`space-y-6 p-8 transition-all duration-300 ease-out ${
              viewMode === 'roll'
                ? 'relative z-10 translate-y-0 opacity-100'
                : 'pointer-events-none absolute inset-0 z-0 translate-y-2 opacity-0'
            }`}
          >
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <span className="material-symbols-outlined text-primary">texture</span>
              Ana Rulo Dağılım Görselleştirmesi
            </h4>
            <div className="space-y-4">
              {rollRows.map((roll) => (
                <div key={roll.rollId} className="flex items-start gap-4">
                  <div className="w-28 shrink-0 pt-1 text-sm font-medium text-gray-700">
                    Rulo #{roll.rollId}
                    <div className="mt-1 text-xs font-medium text-slate-400">
                      {formatTonDisplayTr(roll.totalTonnage)} ton kapasite
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex h-10 w-full overflow-visible rounded-lg border border-slate-200 shadow-inner">
                      {roll.segments.map((segment, index) => (
                        <div
                          key={`${roll.rollId}-${segment.orderId}-${index}`}
                          className="group/segment relative flex h-full items-center justify-center border-r border-white/20 text-[10px] font-bold text-white"
                          style={{
                            width: `${(segment.tonnage / roll.totalTonnage) * 100}%`,
                            backgroundColor: ORDER_COLORS[(segment.orderId - 1) % ORDER_COLORS.length],
                          }}
                        >
                          ORD-{segment.orderId}
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 translate-y-1 scale-95 rounded-lg bg-slate-800 p-3 text-xs text-white opacity-0 shadow-xl transition-all duration-300 ease-out group-hover/segment:translate-y-0 group-hover/segment:scale-100 group-hover/segment:opacity-100">
                            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                            <div className="space-y-1.5">
                              <div className="flex justify-between border-b border-white/10 pb-1">
                                <span className="text-slate-300">Rulo No:</span>
                                <span className="font-mono">R-{roll.rollId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-300">Sipariş No:</span>
                                <span className="font-medium">#ORD-{segment.orderId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-300">Atanan:</span>
                                <span>{formatTonDisplayTr(segment.tonnage)} ton</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-300">Kullanım:</span>
                                <span>%{formatNumber((segment.tonnage / roll.totalTonnage) * 100, 1)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {roll.stock > 0 && (
                        <div
                          className="h-full bg-slate-300"
                          style={{ width: `${(roll.stock / roll.totalTonnage) * 100}%` }}
                        />
                      )}
                      {roll.fire > 0 && (
                        <div
                          className="h-full bg-red-400"
                          style={{ width: `${(roll.fire / roll.totalTonnage) * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Kullanılan: {formatTonDisplayTr(roll.used)} ton · Stok: {formatTonDisplayTr(roll.stock)} ton · Fire:{' '}
                        {formatTonDisplayTr(roll.fire)} ton
                      </span>
                      <span className="font-bold uppercase text-slate-500">
                        %{formatNumber(roll.totalTonnage > 0 ? (roll.used / roll.totalTonnage) * 100 : 0, 1)} kullanıldı
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
              Ölçek referansı: en büyük rulo {formatTonDisplayTr(maxTon)} ton
            </div>
          </div>
          <div
            className={`p-8 transition-all duration-300 ease-out ${
              viewMode === 'order'
                ? 'relative z-10 translate-y-0 opacity-100'
                : 'pointer-events-none absolute inset-0 z-0 translate-y-2 opacity-0'
            }`}
          >
            <div className="mb-6 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-base font-bold text-slate-800">
                <span className="material-symbols-outlined text-primary">format_list_bulleted</span>
                Sipariş Bazlı Karşılama Analitiği
              </h4>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
                <input
                  value={orderSearch}
                  onChange={(event) => {
                    setOrderSearch(event.target.value);
                    setPage(1);
                  }}
                  className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-primary focus:ring-primary"
                  placeholder="Sipariş no ile filtrele..."
                  type="text"
                />
              </div>
            </div>
            <div className="overflow-visible rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Sipariş No</th>
                    <th className="px-6 py-4">Müşteri Adı</th>
                    <th className="px-6 py-4 text-center">Miktar (m²)</th>
                    <th className="px-6 py-4 text-center">Atanan Rulolar</th>
                    <th className="px-6 py-4 text-right">Fire Oranı</th>
                    <th className="px-6 py-4 text-right">Stok Oranı</th>
                    <th className="px-6 py-4 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {pagedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        Eşleşen sipariş bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    pagedOrders.map((order) => {
                      const status = resolveOrderStatus(order.wastePct);
                      return (
                        <tr key={order.orderId} className="transition-colors hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-900">#ORD-{String(order.orderId).padStart(3, '0')}</td>
                          <td className="px-6 py-4 text-slate-600">Müşteri #{order.orderId}</td>
                          <td className="px-6 py-4 text-center font-medium">{formatNumber(order.requiredM2)} m²</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center -space-x-2">
                              {order.assignedRollIds.slice(0, 2).map((rollId, index) => (
                                <div
                                  key={`${order.orderId}-${rollId}`}
                                  className="group/roll relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white shadow-sm"
                                  style={{
                                    backgroundColor: index === 0 ? '#153b6a' : '#4a90e2',
                                  }}
                                >
                                  R{rollId}
                                  {(() => {
                                    const hoverInfo = getAssignedRollHoverInfo(rollId, order.orderId);
                                    if (!hoverInfo) return null;
                                    return (
                                      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 translate-y-1 scale-95 rounded-lg bg-slate-800 p-3 text-left text-xs text-white opacity-0 shadow-xl transition-all duration-300 ease-out group-hover/roll:translate-y-0 group-hover/roll:scale-100 group-hover/roll:opacity-100">
                                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between border-b border-white/10 pb-1">
                                            <span className="text-slate-300">Rulo No:</span>
                                            <span className="font-mono">R-{hoverInfo.rollId}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-300">Sipariş No:</span>
                                            <span className="font-medium">#ORD-{hoverInfo.orderId}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-300">Atanan:</span>
                                            <span>{formatTonDisplayTr(hoverInfo.assignedTon)} ton</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-300">Kullanım:</span>
                                            <span>%{formatNumber(hoverInfo.utilizationPct, 1)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-slate-300">Stok / Fire:</span>
                                            <span>
                                              {formatTonDisplayTr(hoverInfo.stockTon)} / {formatTonDisplayTr(hoverInfo.fireTon)} ton
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ))}
                              {order.assignedRollIds.length > 2 && (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary/70 text-[8px] font-bold text-white shadow-sm">
                                  +{order.assignedRollIds.length - 2}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-right font-bold ${order.wastePct <= 2 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {formatNumber(order.wastePct, 1)}%
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-blue-600">
                            {formatNumber(order.stockPct, 1)}%
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-4 text-xs font-bold uppercase tracking-tight text-slate-500">
                <p>
                  {(safePage - 1) * PAGE_SIZE + (pagedOrders.length ? 1 : 0)}–{(safePage - 1) * PAGE_SIZE + pagedOrders.length} / {filteredOrders.length} sipariş gösteriliyor
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={safePage <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button type="button" className="flex h-8 w-8 items-center justify-center rounded border border-primary bg-primary text-white">
                    {safePage}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safePage >= totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
}
