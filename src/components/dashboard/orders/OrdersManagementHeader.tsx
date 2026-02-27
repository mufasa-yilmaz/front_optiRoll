interface OrdersManagementHeaderProps {
  onCreateProjectClick: () => void;
}

/** Proje yönetimi başlık alanı ve aksiyon butonu. */
export function OrdersManagementHeader({
  onCreateProjectClick,
}: OrdersManagementHeaderProps) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-black leading-tight text-slate-900">Project Management</h1>
        <p className="mt-1 text-slate-500">
          Roll cutting workflow, tracking ve lojistik süreçlerini yönetin.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreateProjectClick}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
      >
        <span className="material-symbols-outlined">add_circle</span>
        <span>Create New Project</span>
      </button>
    </div>
  );
}
