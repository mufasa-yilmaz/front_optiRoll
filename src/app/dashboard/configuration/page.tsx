import type { Metadata } from 'next';
import { ConfigurationForm } from './ConfigurationForm';

export const metadata: Metadata = {
  title: 'Konfigürasyon | OptiRoll',
  description:
    'Optimizasyon modeli giriş parametreleri: malzeme özellikleri, senaryo seçimi, maliyet parametreleri ve sipariş özeti.',
};

/**
 * Dashboard konfigürasyon sayfası: giriş parametreleri paneli.
 */
export default function ConfigurationPage() {
  return (
    <div className="flex flex-col min-h-0 bg-background-light">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <h2 className="text-lg font-bold text-primary font-display">
          Giriş Parametreleri
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Malzeme özellikleri, senaryo ve maliyet parametrelerini yapılandırın.
        </p>
      </div>
      <main className="flex-grow container mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
        <ConfigurationForm />
      </main>
    </div>
  );
}
