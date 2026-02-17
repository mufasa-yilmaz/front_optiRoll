'use client';

/**
 * Fire mekanizması karşılaştırma bölümünün başlık alanı.
 * Rozet, ana başlık ve açıklama metnini gösterir.
 */
export function ScrapComparisonHeader() {
  return (
    <section className="pt-16 pb-8 md:pt-24 md:pb-12 text-center px-4 animate-fade-in-up opacity-0 [animation-fill-mode:forwards]">
      <div className="container mx-auto max-w-[960px]">
        <span className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
          Mekanizma Analizi
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-[#0f141a] sm:text-4xl md:text-5xl mb-4">
          Fire Oluşumunun Karşılaştırması
        </h2>
        <p className="mx-auto max-w-[700px] text-gray-500 text-lg md:text-xl font-normal">
          Atık üretiminden varlık optimizasyonuna geçişi anlamak.
        </p>
      </div>
    </section>
  );
}
