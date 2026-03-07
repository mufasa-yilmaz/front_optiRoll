'use client';

import { useState, useMemo } from 'react';
import { DashboardCard } from './DashboardCard';

/** Malzeme tipi sabitleri: önce Manuel, dropdown'da Alüminyum ve Galvaniz (id, etiket, varsayılan yoğunluk kg/m³) */
const MATERIAL_PRESETS = [
  { id: 'custom', label: 'Manuel', density: null as number | null },
  { id: 'aluminum', label: 'Alüminyum', density: 2700 },
  { id: 'galvanized', label: 'Galvaniz', density: 7850 },
] as const;

export type MaterialPresetId = (typeof MATERIAL_PRESETS)[number]['id'];

export interface MaterialPropertiesCardProps {
  thickness?: number | null;
  onThicknessChange?: (v: number) => void;
  density?: number | null;
  onDensityChange?: (v: number) => void;
  /** Kalınlık alanı eksik/hatali ise true olur (border yanıp söner) */
  hasThicknessError?: boolean;
  /** Yoğunluk alanı eksik/hatali ise true olur (border yanıp söner) */
  hasDensityError?: boolean;
  /** Doğrulama tekrar tetiklendiğinde animasyonu yeniden başlatmak için key */
  blinkValidationKey?: number;
}

/**
 * Malzeme özellikleri kartı: kalınlık, malzeme tipi seçimi (varsayılan Manuel) ve yoğunluk.
 */
export function MaterialPropertiesCard({
  thickness,
  onThicknessChange,
  density,
  onDensityChange,
  hasThicknessError,
  hasDensityError,
  blinkValidationKey,
}: MaterialPropertiesCardProps) {
  const controlled = onThicknessChange != null;

  /** İlk başta her zaman Manuel giriş seçili */
  const [materialPreset, setMaterialPreset] = useState<MaterialPresetId>('custom');

  const currentPreset = useMemo(
    () => MATERIAL_PRESETS.find((p) => p.id === materialPreset),
    [materialPreset],
  );

  /**
   * Malzeme tipi seçildiğinde: hazır ise varsayılan yoğunluğu uygula, manuel ise mevcut değeri koru.
   */
  const handleMaterialChange = (presetId: MaterialPresetId) => {
    setMaterialPreset(presetId);
    const preset = MATERIAL_PRESETS.find((p) => p.id === presetId);
    if (preset?.density != null && onDensityChange) {
      onDensityChange(preset.density);
    }
  };

  /**
   * Kullanıcı yoğunluk alanını elle değiştirdiğinde "Manuel" olarak işaretle.
   */
  const handleDensityChange = (value: number) => {
    setMaterialPreset('custom');
    onDensityChange?.(value);
  };

  return (
    <DashboardCard title="Malzeme Özellikleri" icon="layers" animationDelayMs={50}>
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>Kalınlık</span>
            <span
              className="material-symbols-outlined text-[14px] text-slate-400 cursor-help"
              title="Sac kalınlığı (mm) — ton hesabı ve fire oranını etkiler."
            >
              info
            </span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              key={hasThicknessError ? `thickness-${blinkValidationKey}` : 'thickness'}
              placeholder="0.00"
              type="number"
              value={controlled ? thickness ?? '' : undefined}
              step="0.01"
              onChange={
                onThicknessChange
                  ? (e) => onThicknessChange(parseFloat(e.target.value) || 0)
                  : undefined
              }
              data-error={hasThicknessError ? 'true' : 'false'}
              className={`block w-full rounded-lg border pl-4 pr-12 focus:border-secondary focus:ring-2 focus:ring-secondary/30 sm:text-sm py-3 transition-all duration-200 ${
                hasThicknessError ? 'border-accent-red animate-input-blink-error' : 'border-slate-300'
              }`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span className="text-slate-400 font-medium sm:text-sm">mm</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>Malzeme tipi</span>
            <span
              className="material-symbols-outlined text-[14px] text-slate-400 cursor-help"
              title="Yoğunluk hesabı için kullanılan malzeme türü (ör. Alüminyum, Galvaniz)."
            >
              info
            </span>
          </label>
          <select
            value={materialPreset}
            onChange={(e) => handleMaterialChange(e.target.value as MaterialPresetId)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-all duration-200"
          >
            {MATERIAL_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {p.density != null ? ` (${p.density} kg/m³)` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 p-4 bg-secondary/10 rounded-lg border border-secondary/20 transition-colors hover:border-secondary/30">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
            <span>Malzeme Yoğunluğu</span>
            <span
              className="material-symbols-outlined text-[14px] text-primary/70 cursor-help"
              title="Malzemenin yoğunluğu (kg/m³) — metre kareden ton hesabı için kullanılır."
            >
              info
            </span>
          </span>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">science</span>
            {onDensityChange ? (
              <input
                key={hasDensityError ? `density-${blinkValidationKey}` : 'density'}
                type="number"
                min={1}
                step="1"
                value={density ?? ''}
                onChange={(e) => handleDensityChange(parseFloat(e.target.value) || 0)}
                className={`text-lg font-bold text-primary font-display w-32 bg-transparent border-b focus:outline-none ${
                  hasDensityError
                    ? 'border-accent-red animate-input-blink-error'
                    : 'border-primary/30 focus:border-primary'
                }`}
              />
            ) : (
              <span className="text-lg font-bold text-primary font-display">
                {density} kg/m³
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600">
            kg/m³
            {currentPreset?.density != null && materialPreset !== 'custom'
              ? ` (${currentPreset.label}: ${currentPreset.density})`
              : ' (Manuel giriş)'}
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
