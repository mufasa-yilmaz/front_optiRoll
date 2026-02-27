'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDisplayResult } from '@/contexts/ResultViewContext';
import { getReportDownloadUrl, saveRunConfiguration } from '@/lib/api';

/**
 * Çözücü sonuç sayfası başlığı: Optimizasyon Sonuçları, Run ID, Excel indir, Yeniden Çalıştır.
 */
export function SolverResultsHeader() {
  const lastResult = useDisplayResult();
  const fileId = lastResult?.fileId;
  const [configurationId, setConfigurationId] = useState<string | null>(lastResult?.configurationId ?? null);
  const [isSavingConfiguration, setIsSavingConfiguration] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveInfo, setSaveInfo] = useState<string | null>(null);

  /**
   * Sonuç verisi değiştiğinde iliştirilmiş konfigürasyon bilgisini senkronlar.
   */
  useEffect(() => {
    setConfigurationId(lastResult?.configurationId ?? null);
  }, [lastResult?.configurationId]);

  /**
   * Sonuç girdilerinden konfigürasyon kaydı üretir/günceller.
   */
  const handleSaveConfiguration = async () => {
    if (!fileId) return;
    try {
      setIsSavingConfiguration(true);
      setSaveError(null);
      setSaveInfo(null);
      const res = await saveRunConfiguration(fileId);
      setConfigurationId(res.configurationId);
      setSaveInfo('Konfigürasyon kaydedildi. Yeniden çalıştırırken otomatik yüklenecek.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Konfigürasyon kaydedilemedi';
      setSaveError(msg);
    } finally {
      setIsSavingConfiguration(false);
    }
  };

  const rerunHref = configurationId
    ? `/dashboard/configuration?configurationId=${encodeURIComponent(configurationId)}`
    : '/dashboard/configuration';

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
                Çalışma ID: #{fileId} • Yapılandırma: Standart Rulo Kesim
              </>
            ) : (
              'Henüz optimizasyon çalıştırılmadı'
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <button
            type="button"
            onClick={handleSaveConfiguration}
            disabled={!fileId || isSavingConfiguration}
            className="px-4 py-2 bg-white border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined text-[18px] ${isSavingConfiguration ? 'animate-spin' : ''}`}>
              {isSavingConfiguration ? 'progress_activity' : 'save'}
            </span>
            {isSavingConfiguration ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
          <Link
            href={rerunHref}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span>
            Çözücüyü Yeniden Çalıştır
          </Link>
        </div>
      </div>
      {saveInfo && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
          {saveInfo}
        </div>
      )}
      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {saveError}
        </div>
      )}
    </div>
  );
}
