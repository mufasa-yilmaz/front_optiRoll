'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { addStockRoll, updateStockRoll, deleteStockRoll, getStockRolls, type StockRoll } from '@/lib/api';
import { DashboardPageHeader } from '@/components/dashboard';
import { StockFiltersBar, StockRollsTable, StockRollAddModal } from '@/components/dashboard/stocks';

/**
 * Stok/rulo yönetim sayfası: rulo bazlı liste, set kavramı yok.
 * "Yeni Rulo Ekle" butonu tablo toolbar'ında.
 */
export default function StocksPage() {
  const [rolls, setRolls] = useState<StockRoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRoll, setEditingRoll] = useState<StockRoll | null>(null);

  async function loadRolls() {
    try {
      setLoading(true);
      const data = await getStockRolls();
      setRolls(data.stockRolls || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Stok ruloları yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRolls();
  }, []);

  const filteredRolls = searchTerm.trim()
    ? rolls.filter((r) =>
        String(r.tonnage).toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rolls;

  async function handleSaveRoll(tonnage: number, rollId?: string) {
    try {
      if (rollId) {
        await updateStockRoll(rollId, tonnage);
        toast.success('Rulo güncellendi.');
      } else {
        await addStockRoll(tonnage);
        toast.success('Rulo eklendi.');
      }
      setEditingRoll(null);
      await loadRolls();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (rollId ? 'Rulo güncellenemedi' : 'Rulo eklenemedi'));
    }
  }

  function openAddModal() {
    setEditingRoll(null);
    setIsAddModalOpen(true);
  }

  function openEditModal(roll: StockRoll) {
    setEditingRoll(roll);
    setIsAddModalOpen(true);
  }

  function closeModal() {
    setIsAddModalOpen(false);
    setEditingRoll(null);
  }

  async function handleDeleteRoll(roll: StockRoll) {
    const ok = window.confirm(`${roll.tonnage} ton rulo silinsin mi?`);
    if (!ok) return;
    try {
      await deleteStockRoll(roll.id);
      toast.success('Rulo silindi.');
      await loadRolls();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Rulo silinemedi');
    }
  }

  const totalTon = rolls.reduce((sum, r) => sum + Number(r.tonnage), 0);

  return (
    <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto max-w-[1440px] flex flex-col gap-6">
        <DashboardPageHeader
          title="Stok ve Envanter"
          description="Rulo stoklarını yönetin. Optimizasyondan kalan rulolar otomatik eklenir."
        />
        <StockFiltersBar value={searchTerm} onChange={setSearchTerm} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">Toplam Rulo</p>
            <p className="text-2xl font-black text-slate-900">{rolls.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">Toplam Tonaj</p>
            <p className="text-2xl font-black text-primary">{totalTon.toFixed(1)} ton</p>
          </div>
        </div>

        <StockRollsTable
          rolls={filteredRolls}
          loading={loading}
          onAddRoll={openAddModal}
          onEditRoll={openEditModal}
          onDeleteRoll={handleDeleteRoll}
        />
      </div>

      <StockRollAddModal
        isOpen={isAddModalOpen}
        editingRoll={editingRoll}
        onClose={closeModal}
        onSave={handleSaveRoll}
      />
    </main>
  );
}
