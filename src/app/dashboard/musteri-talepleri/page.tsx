'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  convertCustomerRequestToOrder,
  deleteCustomerRequest,
  getCustomerRequests,
  patchCustomerRequest,
  type CustomerRequest,
} from '@/lib/api';
import { OrderCreateModal, type OrderFormData } from '@/components/dashboard/orders';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';

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
 * Talep durum kodunu arayüzde gösterilecek Türkçe metne çevirir.
 */
function statusLabelTr(status: string): string {
  const map: Record<string, string> = {
    submitted: 'Yeni',
    reviewing: 'İnceleniyor',
    rejected: 'Reddedildi',
    converted: 'Siparişe aktarıldı',
  };
  return map[status] ?? status;
}

/**
 * ISO veya YYYY-MM-DD tarih dizesini Türkçe okunaklı tarih metnine çevirir.
 */
function formatTalepTarihi(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '—';
  const raw = String(value).slice(0, 10);
  const d = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Tek talep satırı için detay modalı: açıklama ve istenen teslim tarihi dahil.
 */
function CustomerRequestDetailModal({
  request,
  onClose,
  onDeleteRejected,
}: {
  request: CustomerRequest;
  onClose: () => void;
  /** Reddedilmiş talep için kalıcı silme (onay üst bileşende sorulur). */
  onDeleteRejected?: (req: CustomerRequest) => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#1a2233] px-6 py-4">
          <h3 className="text-lg font-bold tracking-tight text-white">Talep detayı</h3>
          <button type="button" onClick={onClose} className="text-slate-300 hover:text-white" aria-label="Kapat">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-6 text-sm text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Durum</div>
              <p className="mt-0.5 font-semibold text-slate-900">{statusLabelTr(request.status)}</p>
            </div>
            {request.created_at ? (
              <div className="text-right text-xs text-slate-500">
                Kayıt: {new Date(request.created_at).toLocaleString('tr-TR')}
              </div>
            ) : null}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Firma</div>
            <p className="mt-0.5 font-medium text-slate-900">{request.firma_adi}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Yetkili</div>
              <p className="mt-0.5">{request.yetkili_adi}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">E-posta</div>
              <p className="mt-0.5 break-all">{request.email}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Telefon</div>
              <p className="mt-0.5">{request.telefon ?? '—'}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">İl</div>
              <p className="mt-0.5">{request.il?.trim() ? request.il : '—'}</p>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">İstenen teslim / bitiş tarihi</div>
            <p className="mt-0.5 text-base font-semibold text-slate-900">{formatTalepTarihi(request.bitis_tarihi)}</p>
            <p className="mt-1 text-xs text-slate-500">Müşterinin formda belirttiği talep tarihi.</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Açıklama</div>
            <p className="mt-0.5 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-800">
              {request.musteri_notu?.trim() ? request.musteri_notu : '—'}
            </p>
          </div>
          <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">m²</div>
              <p className="mt-0.5 tabular-nums font-medium">{Number(request.m2)}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Panel (m)</div>
              <p className="mt-0.5 tabular-nums font-medium">
                {Number(request.panel_width)} × {Number(request.panel_length ?? 1)}
              </p>
            </div>
          </div>
          {(request.tahmini_teklif?.trim() || request.admin_notu?.trim()) && (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              {request.tahmini_teklif?.trim() ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tahmini teklif notu</div>
                  <p className="mt-0.5 whitespace-pre-wrap text-slate-700">{request.tahmini_teklif}</p>
                </div>
              ) : null}
              {request.admin_notu?.trim() ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">İç not</div>
                  <p className="mt-0.5 whitespace-pre-wrap text-slate-600">{request.admin_notu}</p>
                </div>
              ) : null}
            </div>
          )}
          <div className="text-xs text-slate-400">
            Talep no: <span className="font-mono text-slate-600">{request.id}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          {request.status === 'rejected' && onDeleteRejected ? (
            <button
              type="button"
              onClick={() => onDeleteRejected(request)}
              className="mr-auto rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Sil
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Firma adını sipariş kimliğinde güvenli kısa bir parçaya dönüştürür (boşluk → tire, özel karakterleri atar).
 */
function firmaParcaSiparisId(firma: string, maxLen: number): string {
  const raw = (firma || 'Firma').trim().replace(/\s+/g, '-');
  const cleaned = raw.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇİıAa.-]+/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const slice = cleaned.slice(0, maxLen).replace(/-+$/g, '');
  return slice.length > 0 ? slice : 'Firma';
}

/**
 * Müşteri talebini sipariş oluşturma formuna ön doldurma verisi olarak dönüştürür.
 * Sipariş adı: TALEP-{talep_uuid_ön_ek}-{firma}.
 */
function customerRequestToOrderForm(req: CustomerRequest): OrderFormData {
  const talepIdKisa = req.id.replace(/-/g, '').slice(0, 8).toUpperCase();
  const firmaParca = firmaParcaSiparisId(req.firma_adi, 48);
  const lines = [req.musteri_notu, `İletişim: ${req.yetkili_adi} <${req.email}>`, req.telefon ? `Tel: ${req.telefon}` : ''].filter(
    Boolean,
  );
  return {
    order_id: `TALEP-${talepIdKisa}-${firmaParca}`,
    m2: Number(req.m2),
    panel_width: Number(req.panel_width),
    panel_length: Number(req.panel_length ?? 1) || 1,
    il: req.il || '',
    bitis_tarihi: req.bitis_tarihi ? String(req.bitis_tarihi).slice(0, 10) : '',
    aciklama: lines.join('\n'),
  };
}

/**
 * Admin müşteri talepleri listesi: inceleme, red ve siparişe dönüşüm.
 */
export default function MusteriTalepleriPage() {
  const [rows, setRows] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailRequest, setDetailRequest] = useState<CustomerRequest | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingRequestId, setConvertingRequestId] = useState<string | null>(null);
  const [form, setForm] = useState<OrderFormData>(emptyForm);

  /**
   * Talep listesini API'den yeniden yükler.
   */
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomerRequests();
      setRows(data.customerRequests || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Talepler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  /**
   * Siparişe aktarma modalını talep için açar.
   */
  function openConvertModal(req: CustomerRequest) {
    setConvertingRequestId(req.id);
    setForm(customerRequestToOrderForm(req));
    setConvertModalOpen(true);
  }

  /**
   * Siparişe aktarma modalını kapatır ve durumu sıfırlar.
   */
  function closeConvertModal() {
    setConvertModalOpen(false);
    setConvertingRequestId(null);
    setForm(emptyForm);
  }

  /**
   * Modal kaydı: talebi siparişe dönüştürür.
   */
  async function handleConvertSave() {
    const id = convertingRequestId;
    if (!id) return;
    const name = form.order_id.trim();
    if (!name) {
      toast.error('Sipariş adı zorunludur');
      return;
    }
    if (form.m2 <= 0 || form.panel_width <= 0 || form.panel_length <= 0) {
      toast.error('m² ve panel ölçüleri geçerli olmalıdır');
      return;
    }
    try {
      await convertCustomerRequestToOrder(id, {
        order_id: name,
        m2: form.m2,
        panel_width: form.panel_width,
        panel_length: form.panel_length,
        il: form.il || undefined,
        bitis_tarihi: form.bitis_tarihi || undefined,
        aciklama: form.aciklama || undefined,
        status: 'Pending',
      });
      toast.success('Sipariş oluşturuldu.');
      closeConvertModal();
      await loadRequests();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Dönüşüm başarısız');
    }
  }

  /**
   * Talebi reddeder.
   */
  async function handleReject(req: CustomerRequest) {
    const ok = window.confirm(`"${req.firma_adi}" talebini reddetmek istiyor musunuz?`);
    if (!ok) return;
    try {
      await patchCustomerRequest(req.id, { status: 'rejected' });
      toast.success('Talep reddedildi.');
      await loadRequests();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Red işlemi başarısız');
    }
  }

  /**
   * Reddedilmiş talebi kalıcı olarak siler.
   */
  async function handleDeleteRejected(req: CustomerRequest) {
    const ok = window.confirm(
      `"${req.firma_adi}" reddedilmiş talebini kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.`,
    );
    if (!ok) return;
    try {
      await deleteCustomerRequest(req.id);
      if (detailRequest?.id === req.id) setDetailRequest(null);
      toast.success('Talep silindi.');
      await loadRequests();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Silme başarısız');
    }
  }

  return (
    <main className="flex h-full flex-col py-8 px-4 md:px-6 bg-background-light">
      <div className="container mx-auto flex max-w-[1280px] min-h-0 min-w-0 flex-1 flex-col">
        <DashboardPageHeader
          title="Müşteri talepleri"
          description="Web formundan gelen teklif taleplerini inceleyin; onayladığınızda sipariş yönetimine aktarın."
          action={
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-[20px]">list_alt</span>
              Sipariş yönetimi
            </Link>
          }
        />

        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-slate-500">Yükleniyor…</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-slate-500">Henüz talep yok.</p>
          ) : (
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Firma</th>
                  <th className="px-4 py-3">İletişim</th>
                  <th className="px-4 py-3">m²</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const canAct = r.status !== 'converted' && r.status !== 'rejected';
                  const created = r.created_at ? new Date(r.created_at).toLocaleString('tr-TR') : '—';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{created}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{r.firma_adi}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{r.yetkili_adi}</div>
                        <div className="text-xs text-slate-500">{r.email}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{Number(r.m2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            r.status === 'converted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {statusLabelTr(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailRequest(r)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Detayları gör
                          </button>
                          {canAct ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleReject(r)}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                              >
                                Reddet
                              </button>
                              <button
                                type="button"
                                onClick={() => openConvertModal(r)}
                                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
                              >
                                Siparişe aktar
                              </button>
                            </>
                          ) : r.status === 'converted' && r.converted_order_id ? (
                            <Link
                              href="/dashboard/orders"
                              className="inline-flex items-center rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
                            >
                              Siparişe bak
                            </Link>
                          ) : r.status === 'rejected' ? (
                            <button
                              type="button"
                              onClick={() => void handleDeleteRejected(r)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-800"
                            >
                              Sil
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {detailRequest ? (
        <CustomerRequestDetailModal
          request={detailRequest}
          onClose={() => setDetailRequest(null)}
          onDeleteRejected={(req) => void handleDeleteRejected(req)}
        />
      ) : null}

      <OrderCreateModal
        isOpen={convertModalOpen}
        isEdit={false}
        initial={null}
        form={form}
        onFormChange={setForm}
        onClose={closeConvertModal}
        onSave={() => void handleConvertSave()}
        titleOverride="Talebi siparişe dönüştür"
        submitLabel="Sipariş oluştur"
      />
    </main>
  );
}
