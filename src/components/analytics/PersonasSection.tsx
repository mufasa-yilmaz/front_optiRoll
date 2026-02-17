/**
 * Hedef kitle bölümü: Kimler İçin?
 * Persona kartlarını grid olarak listeler.
 */
import { PersonaCard } from './PersonaCard';

const personas = [
  {
    title: 'Üretim Planlama Mühendisi',
    subtitle: 'Production Planning Engineer',
    description:
      'Saniyeler içinde optimize kesim planları oluşturun; çizelge çakışmalarını azaltın ve ham malzeme firelerini kolayca minimize edin.',
    icon: 'calendar_month',
    iconBg: 'primary' as const,
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCD3W5sKroCUsYlaNICQK8QtFLQTyJbg-vp0y2512R7Vi3c9_UQ7aUQaoHdZFDwtYyiY_ubspF5fVQqOB6NFdRojdGsjzrYeyE-VLA-LFUsmai7khN4R4bHiPfRW9T1_4Kpx1HvwgOOcx3572IJ_hDIc7tdqUzKmQLdgAqd26gG8mU-Q_QdYGcNjTMN0Zb_EHfSyJp3THtKxHwU_iCTFrZRztPHY0KyhmBe6kmtk4LoH_hLy1oOtzl8dqifwdXEephIZTNsmo974g',
    imageAlt: 'Üretim Planlama Mühendisi portresi',
  },
  {
    title: 'Fabrika Müdürü',
    subtitle: 'Factory Manager',
    description:
      'Operasyonel maliyetlere tam görünürlük kazanın; kapsamlı analitik panel ve raporlarla yatırım getirisini doğrulayın.',
    icon: 'analytics',
    iconBg: 'tertiary' as const,
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAyqPZCbJgM7BHZzKMnEEydM4_j-RA0IoTW48_i7JBHxY8hB6O3J3nhYXOcqMycsHoFJs7YMh4AtbHF14yUtQubQLpTsbs15GuQanjtN79E_c67NmdoEsbfkpfWZeUvXI3Pik5tksHV8ddMi2l2XVc7osbN38FFxzoj7Mw0NYTNwpJZ2LdFRAdvo1jJkE9dHfcl01Va7Gn0Lf--f90IrW1LkjGvikPT6YLlkH5-JG86aeGTK9I1GNxqRW6WTuRmA7YOgIbXKVVoDQ',
    imageAlt: 'Fabrika Müdürü portresi',
  },
  {
    title: 'Endüstri Mühendisi',
    subtitle: 'Industrial Engineer',
    description:
      'İş akışı darboğazlarını analiz edin; her kesim için detaylı verilerle stok kullanım stratejilerini optimize edin.',
    icon: 'precision_manufacturing',
    iconBg: 'secondary' as const,
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBeMWeYP1TXi9oBvgPtv6m01qU34VpSPGQNBQ0xHbrwtiPYWTArmK6rTl3R9RHAbaMG_ZKuitNdmZOKLT2BqimenujbMn38swzGaiKuDLsTTw9wDdB-0yxOM-SpN1ggU0t8UwBYxiPsexMKWCRqflZqGgGTI2CeWx1wkexNOhlee9iOpWU44XmLToFRPOQNpEpP1ThbqoQU6Ys1NAq3IV9bDHZOTlp0tQLIX5lJBpZkECfu1UO6B2sg4juWiAI5mYk4E_xcrjMYiQ',
    imageAlt: 'Endüstri Mühendisi portresi',
  },
];

export function PersonasSection() {
  return (
    <section className="w-full bg-third/30 border-t border-gray-100 py-16 px-4 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-gray-900 text-3xl font-bold mb-4 tracking-tight">
            Kimler İçin?
          </h2>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {personas.map((p, i) => (
            <PersonaCard
              key={p.title}
              title={p.title}
              subtitle={p.subtitle}
              description={p.description}
              icon={p.icon}
              iconBg={p.iconBg}
              imageSrc={p.imageSrc}
              imageAlt={p.imageAlt}
              animationDelay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
