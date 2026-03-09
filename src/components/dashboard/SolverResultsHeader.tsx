'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDisplayResult } from '@/contexts/ResultViewContext';
import {
  getReportDownloadUrl,
  processResult,
  cancelRun,
  deleteRun,
} from '@/lib/api';

/**
 * Çözücü sonuç sayfası başlığı: Optimizasyon Sonuçları, Excel indir, İşleme Al, İptal, Sil, Yeniden Çalıştır.
 * "Çözücüyü Yeniden Çalıştır" aynı ayarlarla manuel analiz sayfasına gider (veriler mevcut sipariş/stokla uyumlu olmayabilir).
 */
export function SolverResultsHeader() {
  const router = useRouter();
  const lastResult = useDisplayResult();
  const fileId = lastResult?.fileId;
  const runStatus = (lastResult as { runStatus?: string })?.runStatus;
  const processedAt = (lastResult as { processedAt?: string | null })?.processedAt;
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isProcessed = runStatus === 'processed' || !!processedAt;
  const isCancelled = runStatus === 'cancelled';

  const handleProcessResult = async () => {
    if (!fileId) return;
    try {
      setIsProcessing(true);
      setSaveError(null);
      await processResult(fileId);
      toast.success('Sonuç işleme alındı. Siparişler ve stoklar güncellendi.');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İşleme alınamadı';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!fileId) return;
    try {
      setIsCancelling(true);
      setSaveError(null);
      await cancelRun(fileId);
      toast.success('Sonuç iptal edildi.');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İptal edilemedi';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!fileId) return;
    if (!window.confirm('Bu sonuç kalıcı olarak silinsin mi?')) return;
    try {
      setIsDeleting(true);
      setSaveError(null);
      await deleteRun(fileId);
      toast.success('Sonuç silindi.');
      router.push('/dashboard/sonuc');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Silinemedi';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  /** Aynı ayarlarla yeniden çalıştırmak için manuel analiz sayfasına yönlendirir (runId ile form doldurulur). */
  const rerunHref = fileId
    ? `/dashboard/configuration/manual?runId=${encodeURIComponent(fileId)}`
    : '/dashboard/configuration/manual';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0f141a]">
            Optimizasyon Sonuçları
          </h1>
          <p className="text-gray-500 font-body text-sm mt-1">
            {fileId ? (
              <>
                Çalışma ID: #{fileId}
                {isProcessed && <span className="ml-2 text-green-600">• İşlendi</span>}
                {isCancelled && <span className="ml-2 text-amber-600">• İptal edildi</span>}
              </>
            ) : (
              'Henüz optimizasyon çalıştırılmadı'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {fileId && (
            <a
              href={lastResult?.reportUrl || getReportDownloadUrl(fileId)}
              download={!lastResult?.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Excel İndir
            </a>
          )}
          {fileId && (
            <>
              <button
                type="button"
                onClick={handleProcessResult}
                disabled={isProcessed || isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-[18px] ${isProcessing ? 'animate-spin' : ''}`}>
                  {isProcessing ? 'progress_activity' : 'check_circle'}
                </span>
                {isProcessed ? 'İşlendi' : 'İşleme Al'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-200 transition flex items-center gap-2 disabled:opacity-60"
              >
                <span className={`material-symbols-outlined text-[18px] ${isCancelling ? 'animate-spin' : ''}`}>
                  {isCancelling ? 'progress_activity' : 'cancel'}
                </span>
                İptal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center gap-2 disabled:opacity-60"
              >
                <span className={`material-symbols-outlined text-[18px] ${isDeleting ? 'animate-spin' : ''}`}>
                  {isDeleting ? 'progress_activity' : 'delete'}
                </span>
                Sil
              </button>
            </>
          )}
          <Link
            href={rerunHref}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span>
            Çözücüyü Yeniden Çalıştır
          </Link>
        </div>
      </div>
      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {saveError}
        </div>
      )}
    </div>
  );
}
