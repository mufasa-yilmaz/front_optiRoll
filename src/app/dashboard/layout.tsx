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
    <div className="flex h-screen w-full bg-background-light overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-pt-[5.5rem]">
          {children}
        </div>
      </main>
    </div>
  );
}
