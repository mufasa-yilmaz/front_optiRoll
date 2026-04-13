'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  addStockRoll,
  updateStockRoll,
  deleteStockRoll,
  getStockRolls,
  getOrders,
  type Order,
  type StockRoll,
} from '@/lib/api';
import { DashboardPageHeader } from '@/components/dashboard';
import { StockRollsTable, StockRollAddModal, StocksPageStatsCards } from '@/components/dashboard/stocks';

/**
 * Stok/rulo yönetim sayfası: rulo bazlı liste, set kavramı yok.
 * "Yeni Rulo Ekle" butonu tablo toolbar'ında.
 */
export default function StocksPage() {
  const [rolls, setRolls] = useState<StockRoll[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRoll, setEditingRoll] = useState<StockRoll | null>(null);

  /**
   * Rulo stoklarını ve sipariş listesini paralel yükler (stok kartlarında bekleme ton ihtiyacı için).
   */
  async function loadRolls() {
    try {
      setLoading(true);
      const [stockRes, ordersRes] = await Promise.all([getStockRolls(), getOrders()]);
      setRolls(stockRes.stockRolls || []);
      setOrders(ordersRes.orders || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Stok ruloları yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRolls();
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

  /**
   * İçe aktarılan ton listesiyle her değer için bir rulo oluşturur; kısmi hata durumunda kullanıcıya bilgi verir.
   */
  async function handleImportTonnages(tonnages: number[]) {
    let added = 0;
    try {
      for (const t of tonnages) {
        await addStockRoll(t);
        added += 1;
      }
      toast.success(`${added} rulo içe aktarıldı.`);
      await loadRolls();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Rulo eklenemedi';
      if (added > 0) {
        toast.warning(`${added} rulo eklendi; sonrasında hata: ${msg}`);
        await loadRolls();
      } else {
        toast.error(msg);
      }
    }
  }

  /** Seçili ruloları toplu siler. */
  async function handleDeleteRolls(selectedRolls: StockRoll[]) {
    if (selectedRolls.length === 0) return;
    const ok = window.confirm(`${selectedRolls.length} rulo silinecek. Emin misiniz?`);
    if (!ok) return;
    try {
      for (const roll of selectedRolls) {
        await deleteStockRoll(roll.id);
      }
      toast.success(`${selectedRolls.length} rulo silindi.`);
      await loadRolls();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Rulolar silinemedi');
    }
  }

  return (
    <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto max-w-[1440px] flex flex-col gap-6">
        <DashboardPageHeader
          title="Stok ve Envanter"
          description="Rulo stoklarını yönetin. Optimizasyondan kalan rulolar otomatik eklenir."
        />

        <StocksPageStatsCards rolls={rolls} orders={orders} />

        <StockRollsTable
          rolls={filteredRolls}
          loading={loading}
          onAddRoll={openAddModal}
          onEditRoll={openEditModal}
          onDeleteRoll={handleDeleteRoll}
          onDeleteRolls={handleDeleteRolls}
          onImportTonnages={handleImportTonnages}
        />

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-primary/10 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <span className="material-symbols-outlined text-[26px]">tune</span>
            </div>
            <div>
              <h3 className="font-bold text-primary">Sıradaki adım: Optimizasyon</h3>
              <p className="mt-1 text-sm text-slate-600">
                Sipariş ve stok verileriyle kesim planını hesaplamak için optimizasyon sayfasına geçin.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/configuration"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            <span>Optimizasyona git</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
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
