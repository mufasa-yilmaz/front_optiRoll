import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Giriş Yap | OptiRoll',
  description: 'OptiRoll demo hesabı ile giriş yapın.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
