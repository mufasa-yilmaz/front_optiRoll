'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { deleteOrderSet, getOrderSets, saveOrderSet, type SavedOrderSet } from '@/lib/api';
import {
  OrdersFiltersBar,
  OrdersManagementHeader,
  OrdersStatsCards,
  ProjectCreateModal,
  ProjectsTable,
  fromApiOrderRow,
  toApiOrderRow,
  type NewOrderForm,
  type OrderPipelineRow,
} from '@/components/dashboard/orders';

/**
 * Sipariş yönetim sayfası: manuel sipariş girişi + kayıtlı sipariş setleri.
 */
export default function OrdersPage() {
  const [rows, setRows] = useState<OrderPipelineRow[]>([]);
  const [newOrder, setNewOrder] = useState<NewOrderForm>({
    id: '',
    widthMm: 1250,
    lengthM: 6,
    panelLengthM: 1,
    weightTon: 2.5,
    priority: 'Medium',
  });
  const [setName, setSetName] = useState('');
  const [orderSets, setOrderSets] = useState<SavedOrderSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingOrderIndex, setEditingOrderIndex] = useState<number | null>(null);
  const [projectCode, setProjectCode] = useState('');
  const [projectDepartment, setProjectDepartment] = useState('Engineering');
  const [projectDescription, setProjectDescription] = useState('');

  /**
   * Sipariş setlerini API'den yükler.
   */
  async function loadOrderSets() {
    try {
      setLoading(true);
      const data = await getOrderSets();
      setOrderSets(data.orderSets || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sipariş setleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrderSets();
  }, []);

  /**
   * Form alanlarını sıfırlar.
   */
  function resetNewOrderForm() {
    setNewOrder({
      id: '',
      widthMm: 1250,
      lengthM: 6,
      panelLengthM: 1,
      weightTon: 2.5,
      priority: 'Medium',
    });
  }

  /**
   * Kayıtlı API sipariş satırlarını modal/pipeline satırlarına dönüştürür.
   */
  function mapSetOrdersToRows(setItem: SavedOrderSet): OrderPipelineRow[] {
    return (setItem.orders || []).map((order, index) => fromApiOrderRow(order, index));
  }

  /**
   * Modal içindeki siparişi ekler veya düzenleme modunda günceller.
   */
  function handleUpsertOrderInDraft() {
    const widthMm = Math.max(1, Number(newOrder.widthMm) || 1);
    const lengthM = Math.max(0.1, Number(newOrder.lengthM) || 0.1);
    const weightTon = Math.max(0.01, Number(newOrder.weightTon) || 0.01);
    const fallbackId = `ORD-${new Date().getFullYear()}-${String(rows.length + 1).padStart(3, '0')}`;
    const id = newOrder.id.trim() || fallbackId;
    const panelLengthM = Math.max(0.01, Number(newOrder.panelLengthM) || 1);
    const candidate: OrderPipelineRow = {
      id,
      widthMm,
      lengthM,
      panelLengthM,
      weightTon,
      priority: newOrder.priority,
      status: 'Pending',
    };
    if (editingOrderIndex != null) {
      setRows((prev) => prev.map((item, index) => (index === editingOrderIndex ? candidate : item)));
      toast.success(`"${id}" siparişi güncellendi.`);
    } else {
      setRows((prev) => [candidate, ...prev]);
      toast.success(`"${id}" siparişi eklendi.`);
    }
    setEditingOrderIndex(null);
    resetNewOrderForm();
  }

  /**
   * Modal/pipeline içindeki geçici siparişi siler.
   */
  function handleDeleteRowFromDraft(orderId: string) {
    setRows((prev) => prev.filter((r) => r.id !== orderId));
    setEditingOrderIndex(null);
  }

  /**
   * Girilen manuel siparişleri yeni set olarak kaydeder.
   */
  async function handleSaveSet() {
    const validOrders = rows
      .filter((r) => r.widthMm > 0 && r.lengthM > 0)
      .map(toApiOrderRow);
    if (!setName.trim()) {
      toast.error('Set adı zorunlu');
      return;
    }
    if (validOrders.length === 0) {
      toast.error('Kaydetmek için en az bir geçerli sipariş girin');
      return;
    }
    try {
      const projectName = setName.trim();
      await saveOrderSet(projectName, validOrders, editingProjectId || undefined);
      setSetName('');
      setProjectCode('');
      setProjectDescription('');
      setProjectDepartment('Engineering');
      setActiveProjectName(projectName);
      setEditingProjectId(null);
      setEditingOrderIndex(null);
      setRows([]);
      setIsProjectModalOpen(false);
      toast.success(editingProjectId ? 'Sipariş seti güncellendi.' : 'Sipariş seti kaydedildi.');
      await loadOrderSets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sipariş seti kaydedilemedi');
    }
  }

  /**
   * Kayıtlı seti tabloya uygular.
   */
  function handleApplySet(setItem: SavedOrderSet) {
    const mapped = mapSetOrdersToRows(setItem);
    setRows(mapped);
    setActiveProjectName(setItem.name);
    toast.success(`"${setItem.name}" sete yüklendi.`);
  }

  /**
   * Kayıtlı seti siler.
   */
  async function handleDeleteSet(setItem: SavedOrderSet) {
    const ok = window.confirm(`"${setItem.name}" sipariş seti silinsin mi?`);
    if (!ok) return;
    try {
      await deleteOrderSet(setItem.id);
      toast.success('Sipariş seti silindi.');
      await loadOrderSets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sipariş seti silinemedi');
    }
  }

  /** Proje listesini arama girdisine göre filtreler. */
  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLocaleLowerCase('tr-TR');
    if (!query) return orderSets;
    return orderSets.filter((setItem) => {
      const id = setItem.id.toLocaleLowerCase('tr-TR');
      const name = (setItem.name || '').toLocaleLowerCase('tr-TR');
      const date = (setItem.created_at || '').toLocaleLowerCase('tr-TR');
      return id.includes(query) || name.includes(query) || date.includes(query);
    });
  }, [orderSets, projectSearch]);

  /** Üstteki proje oluşturma aksiyonunda modalı açar. */
  function handleCreateProjectClick() {
    setSetName('');
    setProjectCode('');
    setProjectDescription('');
    setProjectDepartment('Engineering');
    setRows([]);
    setEditingProjectId(null);
    setEditingOrderIndex(null);
    resetNewOrderForm();
    setIsProjectModalOpen(true);
  }

  /** Proje oluşturma modalını kapatır. */
  function handleCloseProjectModal() {
    setEditingOrderIndex(null);
    setIsProjectModalOpen(false);
  }

  /** Proje satırının genişletme durumunu değiştirir. */
  function handleToggleProjectExpanded(setId: string) {
    setExpandedProjectId((prev) => (prev === setId ? null : setId));
  }

  /**
   * Var olan proje için sipariş ekleme modunu açar.
   */
  function handleAddOrderToProject(setItem: SavedOrderSet) {
    setSetName(setItem.name);
    setRows(mapSetOrdersToRows(setItem));
    setEditingProjectId(setItem.id);
    setEditingOrderIndex(null);
    resetNewOrderForm();
    setIsProjectModalOpen(true);
  }

  /**
   * Var olan proje siparişini modalda düzenleme modunda açar.
   */
  function handleEditProjectOrder(setItem: SavedOrderSet, orderIndex: number) {
    const mappedRows = mapSetOrdersToRows(setItem);
    const target = mappedRows[orderIndex];
    if (!target) return;
    setSetName(setItem.name);
    setRows(mappedRows);
    setEditingProjectId(setItem.id);
    setEditingOrderIndex(orderIndex);
    setNewOrder({
      id: target.id,
      widthMm: target.widthMm,
      lengthM: target.lengthM,
      panelLengthM: target.panelLengthM ?? 1,
      weightTon: target.weightTon,
      priority: target.priority,
    });
    setIsProjectModalOpen(true);
  }

  /**
   * Proje açılır tablosundaki siparişi kalıcı olarak siler ve seti günceller.
   */
  async function handleDeleteProjectOrder(setItem: SavedOrderSet, orderIndex: number) {
    const ok = window.confirm(`"${setItem.name}" içindeki sipariş silinsin mi?`);
    if (!ok) return;
    const nextOrders = (setItem.orders || []).filter((_, index) => index !== orderIndex);
    if (nextOrders.length === 0) {
      toast.error('Projede en az bir sipariş kalmalı. Gerekirse proje setini tamamen silin.');
      return;
    }
    try {
      await saveOrderSet(setItem.name, nextOrders, setItem.id);
      if (activeProjectName === setItem.name) {
        setRows(nextOrders.map((order, index) => fromApiOrderRow(order, index)));
      }
      toast.success('Proje siparişi silindi.');
      await loadOrderSets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Proje siparişi silinemedi');
    }
  }

  /**
   * Modal içindeki satırı düzenleme moduna alır.
   */
  function handleStartEditOrderInModal(orderIndex: number) {
    const target = rows[orderIndex];
    if (!target) return;
    setEditingOrderIndex(orderIndex);
    setNewOrder({
      id: target.id,
      widthMm: target.widthMm,
      lengthM: target.lengthM,
      panelLengthM: target.panelLengthM ?? 1,
      weightTon: target.weightTon,
      priority: target.priority,
    });
  }
  /** Durum bazlı sayaçlar */
  const pendingCount = rows.filter((r) => r.status === 'Pending').length;
  const optimizedCount = rows.filter((r) => r.status === 'Optimized').length;
  const productionCount = rows.filter((r) => r.status === 'In Production').length;
  const efficiencyRate = rows.length === 0 ? 0 : ((optimizedCount + productionCount) / rows.length) * 100;
  const remainingStockKg = Math.max(0, Math.round(4120 - rows.reduce((sum, row) => sum + row.weightTon * 120, 0)));

  return (
    <main className="flex-1 py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto max-w-[1280px]">
        <OrdersManagementHeader onCreateProjectClick={handleCreateProjectClick} />
        <OrdersFiltersBar value={projectSearch} onChange={setProjectSearch} />

        <div className="flex gap-4 overflow-x-auto pb-2">
          <div className="bg-white p-4 rounded-xl border border-slate-200 min-w-[140px] shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</span>
            <p className="text-2xl font-black text-slate-900">{pendingCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 min-w-[140px] shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Optimized</span>
            <p className="text-2xl font-black text-primary">{optimizedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 min-w-[140px] shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Production</span>
            <p className="text-2xl font-black text-emerald-600">{productionCount}</p>
          </div>
        </div>

        <ProjectsTable
          loading={loading}
          sets={filteredProjects}
          expandedSetId={expandedProjectId}
          onToggleExpanded={handleToggleProjectExpanded}
          onApplySet={handleApplySet}
          onDeleteSet={handleDeleteSet}
          onAddOrderToProject={handleAddOrderToProject}
          onEditProjectOrder={handleEditProjectOrder}
          onDeleteProjectOrder={handleDeleteProjectOrder}
        />

        <div className="mt-8 bg-primary/5 border border-primary/10 rounded-xl p-6 flex items-center gap-4">
          <div className="bg-primary text-white p-3 rounded-full">
            <span className="material-symbols-outlined block">insights</span>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-primary">System Suggestion</h4>
            <p className="text-sm text-slate-600">
              Benzer malzeme gerektiren siparişleri set olarak kaydedip tek adımda konfigürasyona yükleyebilirsiniz.
            </p>
          </div>
          <Link href="/dashboard/configuration" className="text-primary font-bold text-sm whitespace-nowrap hover:underline underline-offset-4">
            Run Optimization
          </Link>
        </div>

        <OrdersStatsCards
          activeOrders={pendingCount}
          efficiencyRate={efficiencyRate}
          remainingStockKg={remainingStockKg}
        />
      </div>

      <ProjectCreateModal
        isOpen={isProjectModalOpen}
        isEditMode={editingProjectId != null}
        setName={setName}
        projectCode={projectCode}
        department={projectDepartment}
        description={projectDescription}
        newOrder={newOrder}
        rows={rows}
        editingOrderIndex={editingOrderIndex}
        onSetNameChange={setSetName}
        onProjectCodeChange={setProjectCode}
        onDepartmentChange={setProjectDepartment}
        onDescriptionChange={setProjectDescription}
        onNewOrderChange={(updater) => setNewOrder((prev) => updater(prev))}
        onAddOrder={handleUpsertOrderInDraft}
        onStartEditOrder={handleStartEditOrderInModal}
        onDeleteRow={handleDeleteRowFromDraft}
        onClose={handleCloseProjectModal}
        onSaveProject={handleSaveSet}
      />
    </main>
  );
}
