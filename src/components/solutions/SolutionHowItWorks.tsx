'use client';

/**
 * "Nasıl Çalışır" bölümü: 4 adımlı yatay zaman çizelgesi.
 * primary arka plan, adım ikonları hover animasyonlu.
 */
const STEPS = [
  {
    icon: 'search',
    title: 'Analiz',
    description: 'Veri alımı ve kısıt kontrolü',
  },
  {
    icon: 'merge',
    title: 'Birleştir',
    description: 'Akıllı sipariş gruplama',
  },
  {
    icon: 'calculate',
    title: 'Hesapla',
    description: 'Algoritma işleme',
  },
  {
    icon: 'pie_chart',
    title: 'Optimize Et',
    description: 'Nihai çıktı üretimi',
  },
] as const;

export function SolutionHowItWorks() {
  return (
    <section className="bg-primary relative py-20 px-4 md:px-6 lg:px-16 overflow-hidden">
      <div
        className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-white/5 to-transparent pointer-events-none"
        aria-hidden
      />
      <div className="relative max-w-[960px] mx-auto flex flex-col items-center">
        <div className="mb-16 text-center animate-fade-in-up">
          <h2 className="text-white text-[28px] md:text-[32px] font-bold leading-tight tracking-tight mb-4">
            Nasıl Çalışır
          </h2>
          <p className="text-secondary/90 text-lg max-w-lg mx-auto">
            Otomatik algoritmamız ham sipariş verinizi saniyeler içinde verimli
            kesim planlarına dönüştürür.
          </p>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div
            className="hidden md:block absolute top-[24px] left-[12%] right-[12%] h-[2px] bg-secondary/40 z-0"
            aria-hidden
          />
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col items-center text-center relative z-10 group cursor-default animate-fade-in-up"
              style={{
                animationDelay: `${i * 80}ms`,
                animationFillMode: 'backwards',
              }}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg mb-4 transition-all duration-300 ${
                  i === 0
                    ? 'bg-white text-primary group-hover:scale-110'
                    : 'bg-primary border border-secondary/50 text-white group-hover:bg-white group-hover:text-primary group-hover:scale-110'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  aria-hidden
                >
                  {step.icon}
                </span>
              </div>
              <h3 className="text-white text-lg font-bold mb-1">{step.title}</h3>
              <p className="text-secondary/80 text-sm leading-snug">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
