'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { deleteStockSet, getStockSets, saveStockSet, type SavedStockSet } from '@/lib/api';
import { DashboardPageHeader } from '@/components/dashboard';
import {
  StockFiltersBar,
  StockInsightsPanel,
  StockLedgerTable,
  StockSetSaveBar,
  StockSummaryTiles,
  buildStockPageViewModel,
} from '@/components/dashboard/stocks';
import { RollSettingsCard } from '@/components/dashboard/RollSettingsCard';

/**
 * Stok/rulo seti yönetim sayfası: manuel rulo girişi, kaydetme ve kayıtlı setleri yükleme/silme.
 */
export default function StocksPage() {
  const [rolls, setRolls] = useState<number[]>([]);
  const [setName, setSetName] = useState('');
  const [stockSets, setStockSets] = useState<SavedStockSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateSetModalOpen, setIsCreateSetModalOpen] = useState(false);
  const [editingStockSetId, setEditingStockSetId] = useState<string | null>(null);

  /**
   * Stok setlerini API'den yükler.
   */
  async function loadStockSets() {
    try {
      setLoading(true);
      const data = await getStockSets();
      setStockSets(data.stockSets || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Stok setleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStockSets();
  }, []);

  /**
   * Mevcut rulo listesini set olarak kaydeder.
   */
  async function handleSaveSet() {
    const validRolls = rolls.filter((r) => r > 0);
    if (!setName.trim()) {
      toast.error('Set adı zorunlu');
      return;
    }
    if (validRolls.length === 0) {
      toast.error('Kaydetmek için en az bir geçerli rulo girin');
      return;
    }
    try {
      await saveStockSet(setName.trim(), validRolls, editingStockSetId || undefined);
      setSetName('');
      setRolls([]);
      setEditingStockSetId(null);
      setIsCreateSetModalOpen(false);
      toast.success(editingStockSetId ? 'Stok seti güncellendi.' : 'Stok seti kaydedildi.');
      await loadStockSets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Stok seti kaydedilemedi');
    }
  }

  /**
   * Kayıtlı stok setini forma uygular.
   */
  function handleApplySet(setItem: SavedStockSet) {
    const mapped = (setItem.rolls || []).map((r) => Number(r)).filter((r) => r > 0);
    setRolls(mapped.length > 0 ? mapped : []);
    toast.success(`"${setItem.name}" seti yüklendi.`);
  }

  /**
   * Kayıtlı stok setini siler.
   */
  async function handleDeleteSet(setItem: SavedStockSet) {
    const ok = window.confirm(`"${setItem.name}" stok seti silinsin mi?`);
    if (!ok) return;
    try {
      await deleteStockSet(setItem.id);
      toast.success('Stok seti silindi.');
      await loadStockSets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Stok seti silinemedi');
    }
  }

  /**
   * Kayıtlı stok setini düzenleme için modal içine taşır.
   */
  function handlePrepareUpdateSet(setItem: SavedStockSet) {
    const mapped = (setItem.rolls || []).map((item) => Number(item)).filter((item) => item > 0);
    setEditingStockSetId(setItem.id);
    setSetName(setItem.name || '');
    setRolls(mapped.length > 0 ? mapped : []);
    setIsCreateSetModalOpen(true);
  }

  /**
   * Verilen set id bilgisine gore stok setini forma uygular.
   */
  function handleApplySetById(setId: string) {
    const target = stockSets.find((item) => item.id === setId);
    if (!target) return;
    handleApplySet(target);
  }

  /**
   * Verilen set id bilgisine gore stok setini kalici olarak siler.
   */
  async function handleDeleteSetById(setId: string) {
    const target = stockSets.find((item) => item.id === setId);
    if (!target) return;
    await handleDeleteSet(target);
  }

  /**
   * Verilen set id bilgisine göre düzenleme modalını açar.
   */
  function handleUpdateSetById(setId: string) {
    const target = stockSets.find((item) => item.id === setId);
    if (!target) return;
    handlePrepareUpdateSet(target);
  }

  /**
   * Kayitli stok setlerini arama metnine gore filtreler.
   */
  const filteredStockSets = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('tr-TR');
    if (!query) return stockSets;
    return stockSets.filter((item) => {
      const name = (item.name || '').toLocaleLowerCase('tr-TR');
      const id = item.id.toLocaleLowerCase('tr-TR');
      return name.includes(query) || id.includes(query);
    });
  }, [searchTerm, stockSets]);

  /**
   * Ekranda kullanilan satirlar ve KPI degerlerini hesaplar.
   */
  const viewModel = useMemo(() => buildStockPageViewModel(filteredStockSets), [filteredStockSets]);

  /** Yeni set giris modalini acan islem. */
  function handleOpenCreateSetModal() {
    setEditingStockSetId(null);
    setSetName('');
    setRolls([]);
    setIsCreateSetModalOpen(true);
  }

  /** Yeni set giris modalini kapatan islem. */
  function handleCloseCreateSetModal() {
    setEditingStockSetId(null);
    setIsCreateSetModalOpen(false);
  }

  return (
    <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto max-w-[1440px] flex flex-col gap-6">
        <DashboardPageHeader
          title="Stok ve Envanter"
          description="Rulo stok setlerini yönetin, yeni set ekleyin veya mevcut setleri düzenleyin."
          action={
            <button
              type="button"
              onClick={handleOpenCreateSetModal}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span>Yeni Set Gir</span>
            </button>
          }
        />
        <StockFiltersBar value={searchTerm} onChange={setSearchTerm} />
        <StockSummaryTiles metrics={viewModel.metrics} />
        <StockLedgerTable
          rows={viewModel.rows}
          loading={loading}
          onApplySet={handleApplySetById}
          onUpdateSet={handleUpdateSetById}
          onDeleteSet={handleDeleteSetById}
        />
        <StockInsightsPanel rows={viewModel.rows} />
      </div>

      {isCreateSetModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/40 px-4 py-10 md:py-16"
          onClick={handleCloseCreateSetModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-primary">Yeni Stok Seti Gir</h2>
                <p className="text-xs text-slate-500">
                  Set adı ve rulo tonajlarını girip kaydettiğinizde listeye eklenecek.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCreateSetModal}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Kapat
              </button>
            </div>

            <div className="space-y-4">
              <StockSetSaveBar
                setName={setName}
                onSetNameChange={setSetName}
              />
              <RollSettingsCard rolls={rolls} onRollsChange={setRolls} />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSet}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  {editingStockSetId ? 'Stok Setini Güncelle' : 'Bu Stoku Set Olarak Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
