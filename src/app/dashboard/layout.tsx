import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

/**
 * Dashboard alanı layout: sol sidebar (navigasyon) + sağda içerik.
 * Nav ve Footer LayoutWrapper'da dashboard için gizlenir.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background-light">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        {children}
      </main>
    </div>
  );
}
