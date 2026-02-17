/**
 * Analitik sayfası üst başlık ve açıklama bölümü.
 */
export function AnalyticsHeader() {
  return (
    <div className="flex flex-col items-center text-center mb-10 animate-fade-in-up">
      <h1 className="text-gray-900 text-3xl md:text-4xl font-bold leading-tight tracking-tight pb-3">
        Optimizasyon Sonuçları
      </h1>
      <p className="text-gray-500 text-base md:text-lg font-normal max-w-2xl">
        Yapay zeka destekli rulo optimizasyonunun üretim maliyetleriniz ve malzeme
        verimliliğiniz üzerindeki anlık etkisini görselleştirin.
      </p>
    </div>
  );
}
