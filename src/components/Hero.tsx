import Link from 'next/link';
import { HeroVisual } from './HeroVisual';
import { HeroFeatureCards } from './HeroFeatureCards';

/**
 * Hero bölümü: rozet, başlık, açıklama, CTA butonları ve HeroVisual.
 * Kullanıcının verdiği metinlere göre tasarlanmış landing hero.
 */
export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-background-light dark:bg-background-dark pt-12 pb-16 lg:pt-24 lg:pb-32">
      <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[120%] bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-start">
          <div className="flex flex-col gap-6 text-center lg:text-left max-w-2xl mx-auto lg:mx-0 pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider self-center lg:self-start border border-accent/20">
              <span className="material-symbols-outlined text-[16px]">
                auto_awesome
              </span>
              Yapay Zeka Destekli
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary dark:text-white leading-[1.1] tracking-tight">
              Rulo Kesme Süreçlerinde{' '}
              <span className="text-accent">Fireyi Minimize Eden</span> Akıllı
              Üretim Planlama Modeli
            </h2>
            <h3 className="text-xl sm:text-2xl font-medium text-primary/80 dark:text-gray-200">
              Tonaj bazlı artan yönetimi ile daha az fire, daha yüksek verim
            </h3>
            <div className="bg-white/50 dark:bg-surface-dark/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed font-normal">
                Geleneksel manuel sipariş-bobin eşleştirmesinin yarattığı
                verimsizlik ve stok görünmezliği sorunlarını geride bırakın.
                Modelimiz, siparişlerinizi ve mevcut bobin envanterinizi saniyeler
                içinde analiz ederek, artan tonajı yeniden değerlendiren ve
                fireyi en aza indiren optimum kesim planını oluşturur.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-2 items-center">
              <Link
                href="/teklif-talebi"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-[#1a2e4d] text-white h-12 px-6 rounded-lg text-base font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
              >
                Teklif al
              </Link>
              <button
                type="button"
                className="flex items-center justify-center gap-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-primary dark:text-white h-12 px-6 rounded-lg text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                Modeli Keşfet
              </button>
              <Link
                href="#"
                className="flex items-center gap-1 text-accent hover:text-primary dark:hover:text-white font-semibold text-sm px-2 transition-colors group"
              >
                Demo Sonuçlar
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_right_alt
                </span>
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <HeroVisual />
            <HeroFeatureCards />
          </div>
        </div>
      </div>
    </section>
  );
}
