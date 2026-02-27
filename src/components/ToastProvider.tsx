'use client';

import { Toaster } from 'sonner';

/**
 * Uygulama genelinde sağ üst toast bildirimlerini render eder.
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: 'font-sans',
      }}
    />
  );
}
