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
import type { OrderImportRow } from '@/lib/orderImport';
import { DEFAULT_ORDER_TABLE_MATERIAL, sumOrdersEstimatedDemandTon } from '@/components/dashboard/orders/helpers';
import { validateOrderAreaDivisibility } from '@/components/dashboard/orders/helpers';

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
    const divisibility = validateOrderAreaDivisibility(form.m2, form.panel_width, form.panel_length);
    if (!divisibility.isValid) {
      toast.error(
        `Talep m² değeri panel alanına tam bölünmelidir. Bu ölçülerle en yakın değerler: ${divisibility.floorM2} m² veya ${divisibility.ceilM2} m².`,
      );
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

  /**
   * İçe aktarılan sipariş satırlarını sırayla kaydeder (varsayılan durum: beklemede).
   */
  async function handleImportOrders(rows: OrderImportRow[]) {
    let added = 0;
    try {
      for (const r of rows) {
        const divisibility = validateOrderAreaDivisibility(r.m2, r.panel_width, r.panel_length);
        if (!divisibility.isValid) {
          throw new Error(
            `İçe aktarılan "${r.order_id}" siparişinde m² panel alanına tam bölünmüyor. En yakın değerler: ${divisibility.floorM2} m² / ${divisibility.ceilM2} m².`,
          );
        }
        await saveOrder({
          order_id: r.order_id,
          m2: r.m2,
          panel_width: r.panel_width,
          panel_length: r.panel_length,
          il: r.il,
          bitis_tarihi: r.bitis_tarihi,
          aciklama: r.aciklama,
          status: 'Pending',
        });
        added += 1;
      }
      toast.success(`${added} sipariş içe aktarıldı.`);
      await loadOrders();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sipariş kaydedilemedi';
      if (added > 0) {
        toast.warning(`${added} sipariş eklendi; sonrasında hata: ${msg}`);
        await loadOrders();
      } else {
        toast.error(msg);
      }
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

  /** İstatistikte “aktif” sayılan siparişler: beklemede veya üretimde. */
  const activeOrderCount = orders.filter((o) => o.status === 'Pending' || o.status === 'In Production').length;
  const totalM2 = orders.reduce((sum, o) => sum + Number(o.m2 || 0), 0);
  const totalEstimatedTon = sumOrdersEstimatedDemandTon(
    orders,
    DEFAULT_ORDER_TABLE_MATERIAL.thicknessMm,
    DEFAULT_ORDER_TABLE_MATERIAL.densityKgM3,
  );

  return (
    <main className="flex h-full flex-col py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto flex max-w-[1280px] min-h-0 min-w-0 flex-1 flex-col">
        <OrdersManagementHeader />

        <div className="mt-6 flex min-h-0 min-w-0 flex-1 flex-col">
          <OrdersTable
            orders={orders}
            loading={loading}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onAddOrder={openCreateModal}
            onDeleteOrders={handleDeleteOrders}
            onImportOrders={handleImportOrders}
          />
        </div>

        <div className="mt-6 shrink-0">
          <OrdersStatsCards
            activeOrderCount={activeOrderCount}
            totalM2={totalM2}
            totalEstimatedTon={totalEstimatedTon}
          />
        </div>

        <div className="mt-6 shrink-0 flex flex-col gap-3 rounded-xl border border-primary/10 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <span className="material-symbols-outlined text-[26px]">inventory_2</span>
            </div>
            <div>
              <h3 className="font-bold text-primary">Sıradaki adım: Stok yönetimi</h3>
              <p className="mt-1 text-sm text-slate-600">
                Rulo stoklarını görüntüleyip düzenlemek için stok yönetimi sayfasına geçin.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/stocks"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            <span>Stok yönetimine git</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
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
