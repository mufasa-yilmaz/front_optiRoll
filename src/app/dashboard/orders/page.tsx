'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { deleteOrder, getOrders, saveOrder, type Order } from '@/lib/api';
import {
  OrdersManagementHeader,
  OrdersTable,
  OrderCreateModal,
  OrdersStatsCards,
} from '@/components/dashboard/orders';
import type { OrderFormData } from '@/components/dashboard/orders';

const emptyForm: OrderFormData = {
  order_id: '',
  m2: 0,
  panel_width: 0,
  panel_length: 1,
  il: '',
  bitis_tarihi: '',
  aciklama: '',
};

/**
 * Sipariş yönetim sayfası: doğrudan sipariş listesi, proje kavramı yok.
 */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<OrderFormData>(emptyForm);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data.orders || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Siparişler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function openCreateModal() {
    setEditingOrder(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(order: Order) {
    setEditingOrder(order);
    setForm({
      order_id: order.order_id || '',
      m2: Number(order.m2),
      panel_width: Number(order.panel_width),
      panel_length: Number(order.panel_length ?? 1),
      il: order.il || '',
      bitis_tarihi: order.bitis_tarihi ? order.bitis_tarihi.slice(0, 10) : '',
      aciklama: order.aciklama || '',
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingOrder(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    const name = form.order_id.trim();
    if (!name) {
      toast.error('Sipariş adı zorunludur.');
      return;
    }
    if (form.m2 <= 0 || form.panel_width <= 0 || form.panel_length <= 0) {
      toast.error('Talep (m²), genişlik ve kesim uzunluğu 0\'dan büyük olmalıdır.');
      return;
    }
    try {
      await saveOrder({
        id: editingOrder?.id,
        order_id: name,
        m2: form.m2,
        panel_width: form.panel_width,
        panel_length: form.panel_length,
        il: form.il.trim() || undefined,
        bitis_tarihi: form.bitis_tarihi || undefined,
        aciklama: form.aciklama.trim() || undefined,
        status: editingOrder?.status ?? 'Pending',
      });
      toast.success(editingOrder ? 'Sipariş güncellendi.' : 'Sipariş eklendi.');
      closeModal();
      await loadOrders();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sipariş kaydedilemedi');
    }
  }

  async function handleDelete(order: Order) {
    const ok = window.confirm(`"${order.order_id || order.id}" siparişi silinsin mi?`);
    if (!ok) return;
    try {
      await deleteOrder(order.id);
      toast.success('Sipariş silindi.');
      await loadOrders();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sipariş silinemedi');
    }
  }

  /** Seçili siparişleri toplu siler. */
  async function handleDeleteOrders(selectedOrders: Order[]) {
    if (selectedOrders.length === 0) return;
    const ok = window.confirm(`${selectedOrders.length} sipariş silinecek. Emin misiniz?`);
    if (!ok) return;
    try {
      for (const order of selectedOrders) {
        await deleteOrder(order.id);
      }
      toast.success(`${selectedOrders.length} sipariş silindi.`);
      await loadOrders();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Siparişler silinemedi');
    }
  }

  /**
   * Tablo üzerinden sipariş durumu değiştirildiğinde çağrılır; API ile günceller ve listeyi yeniler.
   */
  async function handleStatusChange(order: Order, newStatus: string) {
    try {
      await saveOrder({
        id: order.id,
        order_id: order.order_id ?? undefined,
        m2: Number(order.m2),
        panel_width: Number(order.panel_width),
        panel_length: Number(order.panel_length ?? 1),
        il: order.il ?? undefined,
        bitis_tarihi: order.bitis_tarihi ?? undefined,
        aciklama: order.aciklama ?? undefined,
        status: newStatus,
      });
      toast.success('Sipariş durumu güncellendi.');
      await loadOrders();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Durum güncellenemedi');
      throw e;
    }
  }

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const productionCount = orders.filter((o) => o.status === 'In Production').length;
  const efficiencyRate = orders.length === 0 ? 0 : (productionCount / orders.length) * 100;

  return (
    <main className="flex h-full flex-col py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto flex max-w-[1280px] flex-1 min-h-0 flex-col">
        <OrdersManagementHeader />

        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <OrdersTable
            orders={orders}
            loading={loading}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onAddOrder={openCreateModal}
            onDeleteOrders={handleDeleteOrders}
          />
        </div>

        <div className="mt-6 shrink-0 bg-primary/5 border border-primary/10 rounded-xl p-6 flex items-center gap-4">
          <div className="bg-primary text-white p-3 rounded-full">
            <span className="material-symbols-outlined block">insights</span>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-primary">Optimizasyon</h4>
            <p className="text-sm text-slate-600">
              Bekleyen siparişleri seçip optimizasyon sayfasından çalıştırabilirsiniz.
            </p>
          </div>
          <Link
            href="/dashboard/configuration"
            className="text-primary font-bold text-sm whitespace-nowrap hover:underline underline-offset-4"
          >
            Optimizasyonu Çalıştır
          </Link>
        </div>

        <div className="mt-6 shrink-0">
          <OrdersStatsCards
            activeOrders={pendingCount}
            efficiencyRate={efficiencyRate}
            remainingStockKg={0}
          />
        </div>
      </div>

      <OrderCreateModal
        isOpen={isModalOpen}
        isEdit={editingOrder != null}
        initial={editingOrder}
        form={form}
        onFormChange={setForm}
        onClose={closeModal}
        onSave={handleSave}
      />
    </main>
  );
}
