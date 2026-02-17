'use client';

/**
 * Fire karşılaştırması sayfasının altındaki CTA / mesaj kutusu.
 * Ana mesaj ve kısa açıklama ile vurgu yapar.
 */
export function ScrapCtaBox() {
  return (
    <section className="py-10 px-4 animate-fade-in-up opacity-0 [animation-fill-mode:forwards]"
      style={{ animationDelay: '0.35s' }}
    >
      <div className="container mx-auto max-w-[1100px]">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 md:px-16 md:py-16 text-center shadow-2xl">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <span className="material-symbols-outlined text-5xl text-secondary mb-2">
              lightbulb
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight max-w-4xl">
              &ldquo;Fireyi azaltmak için stok bir yük değil, karar değişkenidir.&rdquo;
            </h2>
            <div className="h-1 w-24 bg-secondary rounded-full mt-2" />
            <p className="text-blue-100 mt-2 max-w-2xl">
              Stok yönetimini pasif bir depolama süreci olmaktan çıkarıp, aktif
              bir optimizasyon aracına dönüştürün.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
