'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DEMO_CREDENTIALS, validateCredentials } from '@/lib/auth';

/**
 * Giriş sayfası: split layout, sol panel görsel, sağ panel form.
 * Demo kimlik bilgileri ile giriş.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

/** useSearchParams için Suspense fallback - yüklenme durumu */
function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="animate-pulse text-gray-500">Yükleniyor...</div>
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateCredentials(email, password)) {
      setError('E-posta veya şifre hatalı. Demo: demo@optiroll.com / demo123');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError('Giriş yapılamadı. Lütfen tekrar deneyin.');
        setLoading(false);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  const IMAGE_URL =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCMsvIXFduJcYCHTNTdlR1CNvbjyEYjQQHCEQ_3TU8TVpBiyqwIYPrSnujVUFhaOtAiL-VW4ZDJMvSJatq9r7-HUVeReqjen3O9ESYMnslEyEehIYEZWeQuv_XnaX0Wa3h6eMEuhGokzJ1fHTQwB_Mvptj53g0k28oVPiKWIupOeRfEFM8LS8oKQQpHqNlx_KGRIjRAdt42tcitZcesRsJXcX2V6_V_8Z3ixb-M7dj_-BmgiGCz11aFePLLe1HVpHVbR0Ufd9MqBg';

  return (
    <div className="flex min-h-screen bg-white font-sans antialiased text-[#0f141a]">
      {/* Sol panel - görsel */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-3/5 items-center justify-center overflow-hidden">
        <Image
          alt="Endüstriyel Çelik Ruloları"
          className="object-cover"
          src={IMAGE_URL}
          fill
          priority
          sizes="(max-width: 1024px) 0vw, 50vw"
        />
        <div className="absolute inset-0 bg-primary/80 backdrop-blur-[2px]" />
        <div className="relative z-10 px-12 text-center">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <span className="material-symbols-outlined text-4xl text-white">
              cut
            </span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-display font-bold text-white mb-6">
            OptiRoll
          </h2>
          <p className="text-2xl xl:text-3xl font-light text-blue-100 italic">
            &ldquo;Optimize production, eliminate waste.&rdquo;
          </p>
          <div className="mt-12 h-1 w-24 bg-accent-green mx-auto rounded-full" />
        </div>
        <div className="absolute bottom-10 left-10 text-white/50 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">factory</span>
          <span>Endüstriyel Verimlilik Çözümleri</span>
        </div>
      </div>

      {/* Sağ panel - form */}
      <div className="flex w-full flex-col lg:w-1/2 xl:w-2/5 justify-center px-8 sm:px-16 lg:px-24 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined">cut</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-primary">
              OptiRoll
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-3 mb-10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined text-[20px]">
                cut
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">
              OptiRoll
            </span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900">Hoş Geldiniz</h1>
            <p className="mt-2 text-gray-500">
              Platforma erişmek için bilgilerinizi girin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" method="POST">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="email"
              >
                E-posta
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  mail
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ad@sirket.com"
                  required
                  className="block w-full rounded-lg border border-primary/20 pl-11 py-3 focus:border-primary focus:ring-primary text-gray-900 placeholder:text-gray-400 shadow-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="block text-sm font-semibold text-gray-700"
                  htmlFor="password"
                >
                  Şifre
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-primary hover:text-primary-dark hover:underline transition-all"
                >
                  Şifremi Unuttum
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  lock
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full rounded-lg border border-primary/20 pl-11 py-3 focus:border-primary focus:ring-primary text-gray-900 placeholder:text-gray-400 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                className="ml-2 block text-sm text-gray-600"
                htmlFor="remember-me"
              >
                Beni hatırla
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all disabled:opacity-60"
              >
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500 font-medium">
                  Demo bilgileri
                </span>
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-blue-50 border border-blue-100 p-4">
              <p className="text-sm text-blue-800 font-mono">
                E-posta: {DEMO_CREDENTIALS.email}
              </p>
              <p className="text-sm text-blue-800 font-mono mt-1">
                Şifre: {DEMO_CREDENTIALS.password}
              </p>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            Hesabınız yok mu?{' '}
            <Link
              href="/"
              className="font-bold text-primary hover:text-primary-dark transition-colors"
            >
              Ücretsiz Demo İsteyin
            </Link>
          </p>

          <footer className="mt-auto pt-8 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">© 2024 OptiRoll Inc.</span>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-xs text-gray-400 hover:text-primary transition-colors"
              >
                Destek
              </Link>
              <Link
                href="#"
                className="text-xs text-gray-400 hover:text-primary transition-colors"
              >
                Gizlilik
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
