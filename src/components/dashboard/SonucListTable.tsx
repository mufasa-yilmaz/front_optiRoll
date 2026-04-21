'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { deleteRun, getRuns, type RunSummary } from '@/lib/api';
import {
  getRunSummaryOpenedRolls,
  getRunSummaryTotalCost,
  getRunSummaryTotalFire,
} from '@/lib/runSummaryFields';
import { formatTonDisplayTr } from '@/components/dashboard/orders/helpers';

const formatTL = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatDate = (s: string) => {
  try {
    const d = new Date(s);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

/** run_status değerine göre etiket (API snake_case döner). */
function getRunStatusLabel(run: RunSummary): string {
  const status = run.run_status ?? 'saved';
  if (status === 'processed') return 'İşlendi';
  if (status === 'cancelled') return 'İptal';
  return 'Beklemede / Test';
}

/** run_status değerine göre badge sınıfı. */
function getRunStatusBadgeClass(run: RunSummary): string {
  const status = run.run_status ?? 'saved';
  if (status === 'processed') return 'bg-green-100 text-green-800';
  if (status === 'cancelled') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

/** Durum filtresi seçenekleri */
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'saved', label: 'Beklemede / Test' },
  { value: 'processed', label: 'İşlendi' },
  { value: 'cancelled', label: 'İptal edilenler' },
] as const;

/**
 * Geçmiş optimizasyon çalıştırmaları tablosu.
 * İşlemde (beklemede), işlendi veya iptal edilenlere göre filtreleme yapılabilir.
 */
export function SonucListTable() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  /** Toplu silme için seçili çalışma file_id'leri */
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [searchId, setSearchId] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'date' | 'totalCost' | 'totalFire'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /**
   * Sonuç listesini API'den yükler.
   */
  const loadRuns = () => {
    setLoading(true);
    setError(null);
    getRuns()
      .then(({ runs: data }) => setRuns(data))
      .catch((e) => {
        const message = e instanceof Error ? e.message : 'Yüklenemedi';
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  };

  /**
   * Seçili sonucu siler ve tabloyu günceller.
   */
  const handleDeleteRun = async (fileId: string) => {
    const confirmed = window.confirm(`Çalıştırma #${fileId} silinsin mi? Bu işlem geri alınamaz.`);
    if (!confirmed) return;

    try {
      setDeletingFileId(fileId);
      await deleteRun(fileId);
      setRuns((prev) => prev.filter((r) => r.file_id !== fileId));
      setSelectedFileIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      toast.success('Sonuç kaydı silindi.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Silme işlemi başarısız';
      setError(message);
      toast.error(message);
    } finally {
      setDeletingFileId(null);
    }
  };

  /**
   * Tek satır seçimini aç/kapat.
   */
  const toggleSelection = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  /**
   * Bu sayfadaki tüm satırları seçer veya seçimi kaldırır.
   */
  const toggleSelectAllOnPage = () => {
    const idsOnPage = pagedRuns.map((r) => r.file_id);
    const allSelected = idsOnPage.every((id) => selectedFileIds.has(id));
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (allSelected) idsOnPage.forEach((id) => next.delete(id));
      else idsOnPage.forEach((id) => next.add(id));
      return next;
    });
  };

  /**
   * Seçilen tüm çalıştırmaları siler (teker teker API çağrısı).
   */
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedFileIds);
    if (ids.length === 0) return;
    const confirmed = window.confirm(
      `${ids.length} adet çalıştırma silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`
    );
    if (!confirmed) return;

    setBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;
    for (const fileId of ids) {
      try {
        await deleteRun(fileId);
        setRuns((prev) => prev.filter((r) => r.file_id !== fileId));
        successCount += 1;
      } catch {
        failCount += 1;
      }
    }
    setSelectedFileIds(new Set());
    setBulkDeleting(false);
    if (failCount === 0) toast.success(`${successCount} kayıt silindi.`);
    else toast.error(`${successCount} silindi, ${failCount} silinemedi.`);
  };

  useEffect(() => {
    loadRuns();
  }, []);

  /**
   * Filtrelenmiş ve sıralanmış sonuç listesini hesaplar.
   */
  const filteredAndSortedRuns = useMemo(() => {
    const text = searchId.trim().toLowerCase();

    let next = runs;
    if (text) {
      next = next.filter((r) => {
        const file = String(r.file_id ?? '').toLowerCase();
        const id = String(r.id ?? '').toLowerCase();
        return file.includes(text) || id.includes(text);
      });
    }

    if (statusFilter !== 'all') {
      next = next.filter((r) => (r.run_status ?? 'saved') === statusFilter);
    }

    const withSummary = [...next];
    withSummary.sort((a, b) => {
      const factor = sortDirection === 'asc' ? 1 : -1;
      if (sortKey === 'date') {
        const da = new Date(a.created_at ?? '').getTime() || 0;
        const db = new Date(b.created_at ?? '').getTime() || 0;
        return (da - db) * factor;
      }
      if (sortKey === 'totalCost') {
        const ca = getRunSummaryTotalCost(a);
        const cb = getRunSummaryTotalCost(b);
        return (ca - cb) * factor;
      }
      const fa = getRunSummaryTotalFire(a);
      const fb = getRunSummaryTotalFire(b);
      return (fa - fb) * factor;
    });

    return withSummary;
  }, [runs, searchId, statusFilter, sortKey, sortDirection]);

  /**
   * Sayfalama için aktif sayfa aralığını hesaplar.
   */
  const pagedRuns = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredAndSortedRuns.slice(start, end);
  }, [filteredAndSortedRuns, page, pageSize]);

  const totalCount = filteredAndSortedRuns.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize || 1));

  /**
   * Filtre değiştiğinde sayfa numarasını sıfırlar.
   */
  useEffect(() => {
    setPage(1);
  }, [searchId, statusFilter, sortKey, sortDirection, pageSize]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4 block">
          progress_activity
        </span>
        <p className="text-gray-500">Geçmiş yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4">
        <p className="font-medium text-amber-900">Geçmiş yüklenemedi</p>
        <p className="text-sm text-amber-800 mt-1">{error}</p>
        <p className="text-xs text-amber-700 mt-2">
          Supabase bağlantısını kontrol edin. Yeni çalıştırmalar Optimizasyon sayfasından yapılır.
        </p>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">
          history
        </span>
        <p className="text-gray-600 font-medium">Henüz kayıtlı sonuç yok</p>
        <p className="text-sm text-gray-500 mt-1">
          Optimizasyon sayfasından model çalıştırdığınızda sonuçlar burada listelenecek.
        </p>
        <Link
          href="/dashboard/configuration"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Optimizasyona Git
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-third/30 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary font-display">
            Geçmiş Sonuçlar
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Sonuç satırına tıklayarak detayları görüntüleyin
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {selectedFileIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedFileIds.size} seçili
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-[18px] ${bulkDeleting ? 'animate-spin' : ''}`}>
                  {bulkDeleting ? 'progress_activity' : 'delete'}
                </span>
                {bulkDeleting ? 'Siliniyor...' : 'Seçilenleri sil'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedFileIds(new Set())}
                disabled={bulkDeleting}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Seçimi kaldır
              </button>
            </div>
          )}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Çalışma ID ile filtrele"
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary min-w-[220px]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary bg-white min-w-[160px]"
            title="Durum filtresi"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as 'date' | 'totalCost' | 'totalFire')}
              className="px-2 py-2 rounded-lg border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary bg-white"
            >
              <option value="date">Tarihe göre</option>
              <option value="totalCost">Toplam Maliyet</option>
              <option value="totalFire">Fire (ton)</option>
            </select>
            {/* <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
              className="px-2 py-2 rounded-lg border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary bg-white"
            >
              <option value="desc">Azalan</option>
              <option value="asc">Artan</option>
            </select> */}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pagedRuns.length > 0 && pagedRuns.every((r) => selectedFileIds.has(r.file_id))}
                    onChange={toggleSelectAllOnPage}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Seç</span>
                </label>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Açıklama
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Toplam Maliyet
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Fire (ton)
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Açılan Rulo
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {pagedRuns.map((run) => (
              <tr
                key={run.id}
                className={`hover:bg-third/30 transition-colors group ${selectedFileIds.has(run.file_id) ? 'bg-primary/5' : ''}`}
              >
                <td className="px-4 py-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFileIds.has(run.file_id)}
                      onChange={() => toggleSelection(run.file_id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </label>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/sonuc/${run.file_id}`}
                    className="text-sm font-medium text-primary hover:text-secondary"
                    title={run.description ? `#${run.file_id}` : undefined}
                  >
                    {run.description?.trim() || `#${run.file_id}`}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getRunStatusBadgeClass(run)}`}>
                    {getRunStatusLabel(run)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(run.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right font-medium">
                  ₺{formatTL(getRunSummaryTotalCost(run))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right tabular-nums">
                  {formatTonDisplayTr(getRunSummaryTotalFire(run))} t
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                  {getRunSummaryOpenedRolls(run) ?? '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="inline-flex items-center gap-3">
                    <Link
                      href={`/dashboard/sonuc/${run.file_id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-secondary"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      Görüntüle
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteRun(run.file_id)}
                      disabled={deletingFileId === run.file_id}
                      className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${deletingFileId === run.file_id ? 'animate-spin' : ''}`}>
                        {deletingFileId === run.file_id ? 'progress_activity' : 'delete'}
                      </span>
                      {deletingFileId === run.file_id ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-gray-50">
        <div className="text-xs text-gray-500">
          {totalCount === 0 ? (
            'Kayıt bulunamadı'
          ) : (
            <>
              Gösterilen{' '}
              <span className="font-semibold text-gray-700">
                {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, totalCount)}
              </span>{' '}
              / <span className="font-semibold text-gray-700">{totalCount}</span> kayıt
            </>
          )}
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) || 10)}
            className="px-2 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary bg-white"
          >
            <option value={10}>10 / sayfa</option>
            <option value={25}>25 / sayfa</option>
            <option value={50}>50 / sayfa</option>
          </select>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1.5 rounded-l-lg border border-gray-300 bg-white text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-2 text-xs text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 py-1.5 rounded-r-lg border border-gray-300 bg-white text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
