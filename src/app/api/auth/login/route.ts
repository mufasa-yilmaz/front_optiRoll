import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateCredentials, AUTH_COOKIE } from '@/lib/auth';

/**
 * Demo giriş API route.
 * Geçerli kimlik bilgilerinde auth cookie set eder.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gerekli' },
        { status: 400 }
      );
    }

    if (!validateCredentials(email, password)) {
      return NextResponse.json(
        { error: 'Geçersiz kimlik bilgileri' },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, 'demo', {
      path: '/',
      maxAge: 60 * 60 * 24, // 24 saat
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
