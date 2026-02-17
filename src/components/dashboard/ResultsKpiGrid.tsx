'use client';

/**
 * Toplam maliyet KPI kartı: Fire + Stok + Setup Toplamı, geleneksel yönteme karşı karşılaştırma.
 */
function TotalCostKpiCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all lg:col-span-1">
      <div className="z-10 relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">
              attach_money
            </span>
          </div>
          <h3 className="text-primary font-bold text-sm uppercase tracking-wider">
            Fire + Stok + Setup Toplamı
          </h3>
        </div>
        <div className="mt-4">
          <span className="text-4xl lg:text-5xl font-bold text-primary tracking-tight block">
            ₺42.590
          </span>
          <p className="text-sm text-gray-400 font-medium mt-1">
            Toplam operasyonel maliyet
          </p>
        </div>
        <div className="mt-6 flex items-center gap-2 text-sm">
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            <span className="material-symbols-outlined text-[14px] mr-1">
              trending_down
            </span>
            12,5%
          </span>
          <span className="text-gray-400">geleneksel yönteme göre</span>
        </div>
      </div>
      <div className="absolute -right-4 -top-4 opacity-[0.03] text-primary pointer-events-none">
        <span className="material-symbols-outlined text-[180px]">paid</span>
      </div>
    </div>
  );
}

/**
 * Toplam fire KPI kartı: tonaj ve ilerleme çubuğu.
 */
function ScrapKpiCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-6">
        <h3 className="text-primary font-bold text-lg">Toplam Fire</h3>
        <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-accent-orange shadow-sm">
          <span className="material-symbols-outlined text-[22px]">
            delete_outline
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1 mt-auto">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">2,4</span>
          <span className="text-sm text-gray-500 font-medium font-body">ton</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className="bg-accent-orange h-1.5 rounded-full"
            style={{ width: '15%' }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Kabul edilebilir limitler içinde (&lt; %3)
        </p>
      </div>
    </div>
  );
}

/**
 * Toplam stok KPI kartı: tonaj ve ilerleme çubuğu.
 */
function StockKpiCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-6">
        <h3 className="text-primary font-bold text-lg">Toplam Stok</h3>
        <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-accent-green shadow-sm">
          <span className="material-symbols-outlined text-[22px]">
            inventory_2
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1 mt-auto">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">15,8</span>
          <span className="text-sm text-gray-500 font-medium font-body">ton</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className="bg-accent-green h-1.5 rounded-full"
            style={{ width: '65%' }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Yeniden kullanılabilir malzeme envanteri
        </p>
      </div>
    </div>
  );
}

/**
 * Açılan rulo sayısı KPI kartı.
 */
function RollsOpenedKpiCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-primary font-bold text-lg">Açılan Rulolar</h3>
        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-primary shadow-sm">
          <span className="material-symbols-outlined text-[22px]">album</span>
        </div>
      </div>
      <div className="mt-auto">
        <span className="text-4xl font-bold text-primary block mb-1">32</span>
        <p className="text-sm text-gray-400 font-body">
          İşlenen ana rulo sayısı
        </p>
      </div>
      <div className="absolute right-0 bottom-0 p-4 opacity-[0.03]">
        <span className="material-symbols-outlined text-8xl text-primary">
          album
        </span>
      </div>
    </div>
  );
}

/**
 * Ortalama kullanım oranı KPI kartı: dairesel gösterge.
 */
function UtilizationKpiCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all lg:col-span-2">
      <div className="flex flex-col justify-center h-full">
        <h3 className="text-primary font-bold text-lg mb-2">
          Ortalama Kullanım Oranı
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-primary">%94,2</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="flex h-2 w-2 rounded-full bg-accent-green" />
          <p className="text-sm text-gray-500 font-medium">
            Yüksek Verimlilik Değerlendirmesi
          </p>
        </div>
      </div>
      <div
        className="relative h-28 w-28 flex items-center justify-center rounded-full mr-4 shrink-0"
        style={{
          background:
            'conic-gradient(#1F3A5F 94.2%, #e2e8f0 0)',
        }}
      >
        <div className="absolute inset-[10px] bg-white rounded-full flex items-center justify-center shadow-sm">
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-primary text-3xl">
              percent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard sonuç KPI kartları grid: toplam maliyet, fire, stok, rulo sayısı, kullanım oranı.
 */
export function ResultsKpiGrid() {
  return (
    <div className="container mx-auto max-w-[1100px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TotalCostKpiCard />
        <ScrapKpiCard />
        <StockKpiCard />
        <RollsOpenedKpiCard />
        <UtilizationKpiCard />
      </div>
    </div>
  );
}
