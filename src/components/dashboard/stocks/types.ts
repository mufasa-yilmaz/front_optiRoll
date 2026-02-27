import type { SavedStockSet } from '@/lib/api';

/** Ledger tablosunda gösterilecek stok satır modeli. */
export interface StockLedgerRow {
  id: string;
  setId: string;
  setName: string;
  rollCount: number;
  totalTon: number;
  usedTon: number;
  remainingTon: number;
  usageRate: number;
  status: 'Stokta' | 'Kritik' | 'Tukendi';
  createdAtText: string;
  usageLabel: string;
}

/** Stok ekranı özet KPI modeli. */
export interface StockSummaryMetrics {
  totalSets: number;
  totalRolls: number;
  totalTon: number;
  lowStockCount: number;
  efficiencyIndex: number;
}

/** Stok setlerinden türetilen sayfa modeli. */
export interface StockPageViewModel {
  rows: StockLedgerRow[];
  metrics: StockSummaryMetrics;
}

/** Dış API modeli için kısa alias. */
export type StockSetEntity = SavedStockSet;
