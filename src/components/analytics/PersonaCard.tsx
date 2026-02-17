import Image from 'next/image';

/**
 * Hedef kitle kartı.
 * Persona bilgilerini (başlık, rol, açıklama) ve ikon ile gösterir.
 */
interface PersonaCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  iconBg: 'primary' | 'secondary' | 'tertiary';
  imageSrc: string;
  imageAlt: string;
  /** Animasyon gecikmesi (saniye). Stagger efekt için kullanılır. */
  animationDelay?: number;
}

export function PersonaCard({
  title,
  subtitle,
  description,
  icon,
  iconBg,
  imageSrc,
  imageAlt,
  animationDelay = 0,
}: PersonaCardProps) {
  const iconBgClass = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
  }[iconBg];

  return (
    <div
      className="group bg-third/50 p-6 rounded-2xl border border-transparent hover:border-gray-200 transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center animate-scale-in hover:-translate-y-1"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div className="relative mb-4">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
          <Image
            alt={imageAlt}
            className="object-cover"
            src={imageSrc}
            fill
            sizes="96px"
          />
        </div>
        <div
          className={`absolute bottom-0 right-0 ${iconBgClass} text-white p-1.5 rounded-full shadow-sm`}
        >
          <span className="material-symbols-outlined text-sm">{icon}</span>
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-4">
        {subtitle}
      </p>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
