'use client';

import { useState } from 'react';

/**
 * Demo sol paneli: malzeme kalınlığı, planlama senaryosu ve hesapla butonu.
 */
const SCENARIOS = [
  { value: 'max-efficiency', label: 'Maksimum Verimlilik' },
  { value: 'min-waste', label: 'Minimum Fire' },
  { value: 'urgent', label: 'Acil Teslimat' },
] as const;

type ScenarioValue = (typeof SCENARIOS)[number]['value'];

export function DemoSidebar() {
  const [thickness, setThickness] = useState('0.5');
  const [scenario, setScenario] = useState<ScenarioValue>(SCENARIOS[0].value);

  return (
    <div className="w-full md:w-[320px] bg-third border-r border-gray-200 p-6 flex flex-col gap-6 shrink-0">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-200 animate-fade-in">
        <span className="material-symbols-outlined text-primary">tune</span>
        <h3 className="font-bold text-primary text-lg">Giriş Parametreleri</h3>
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="thickness"
          className="text-gray-700 text-sm font-medium"
        >
          Malzeme Kalınlığı (mm)
        </label>
        <input
          id="thickness"
          type="number"
          value={thickness}
          onChange={(e) => setThickness(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 h-12 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="scenario" className="text-gray-700 text-sm font-medium">
          Planlama Senaryosu
        </label>
        <div className="relative">
          <select
            id="scenario"
            value={scenario}
            onChange={(e) =>
              setScenario(e.target.value as ScenarioValue)
            }
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white text-gray-900 h-12 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
          >
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <span className="material-symbols-outlined">expand_more</span>
          </div>
        </div>
      </div>
      <div className="grow" />
      <button
        type="button"
        className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-lg font-bold text-sm shadow-md shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">play_arrow</span>
        Hesapla
      </button>
    </div>
  );
}
