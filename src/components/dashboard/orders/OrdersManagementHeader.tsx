import { DashboardPageHeader } from '../DashboardPageHeader';

interface OrdersManagementHeaderProps {
  onCreateProjectClick: () => void;
}

/** Proje yönetimi başlık alanı ve aksiyon butonu. DashboardPageHeader ile aynı stili kullanır. */
export function OrdersManagementHeader({
  onCreateProjectClick,
}: OrdersManagementHeaderProps) {
  return (
    <DashboardPageHeader
      title="Proje Yönetimi"
      description="Rulo kesim akışı, takip ve lojistik süreçlerini yönetin."
      action={
        <button
          type="button"
          onClick={onCreateProjectClick}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>Yeni Proje Oluştur</span>
        </button>
      }
    />
  );
}
