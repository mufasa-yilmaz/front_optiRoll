import type { Metadata } from 'next';
import { Space_Grotesk, Noto_Sans } from 'next/font/google';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import { OptimizationProvider } from '@/contexts/OptimizationContext';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700'],
});

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'OptiRoll - Rulo Kesim Optimizasyonu',
  description: 'Yapay zeka destekli rulo kesim planlaması ile fireyi minimize edin.',
};

/**
 * Kök layout bileşeni. Font, Meta, Nav, Footer ve harici stilleri sağlar.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${spaceGrotesk.variable} ${notoSans.variable} light`}>
      <body className="min-h-screen antialiased font-sans bg-background-light dark:bg-background-dark text-[#101418] dark:text-gray-100">
        <OptimizationProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </OptimizationProvider>
      </body>
    </html>
  );
}
