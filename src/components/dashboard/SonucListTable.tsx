'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { deleteRun, getRuns, type RunSummary } from '@/lib/api';

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

/**
 * Geçmiş optimizasyon çalıştırmaları tablosu.
 */
export function SonucListTable() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

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
      toast.success('Sonuç kaydı silindi.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Silme işlemi başarısız';
      setError(message);
      toast.error(message);
    } finally {
      setDeletingFileId(null);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

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
          Supabase bağlantısını kontrol edin. Yeni çalıştırmalar Konfigürasyon sayfasından yapılır.
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
          Konfigürasyon sayfasından optimizasyon çalıştırdığınızda sonuçlar burada listelenecek.
        </p>
        <Link
          href="/dashboard/configuration"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Konfigürasyona Git
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-third/30">
        <h2 className="text-lg font-bold text-primary font-display">
          Geçmiş Sonuçlar
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Sonuç satırına tıklayarak detayları görüntüleyin
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Çalışma ID
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
            {runs.map((run) => (
              <tr
                key={run.id}
                className="hover:bg-third/30 transition-colors group"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/dashboard/sonuc/${run.file_id}`}
                    className="text-sm font-medium text-primary hover:text-secondary font-mono"
                  >
                    #{run.file_id}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(run.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-right font-medium">
                  ₺{formatTL(run.summary?.totalCost ?? 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                  {formatTL(run.summary?.totalFire ?? 0)} ton
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                  {run.summary?.openedRolls ?? '-'}
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
    </div>
  );
}
