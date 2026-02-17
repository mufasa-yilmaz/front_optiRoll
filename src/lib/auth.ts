/**
 * Demo kimlik doğrulama sabitleri.
 * Demo giriş bilgileri ve cookie adı.
 */

export const AUTH_COOKIE = 'optiroll-auth';

export const DEMO_CREDENTIALS = {
  email: 'demo@optiroll.com',
  password: 'demo123',
} as const;

/**
 * Giriş bilgilerinin geçerliliğini kontrol eder.
 */
export function validateCredentials(
  email: string,
  password: string
): boolean {
  return (
    email === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  );
}
