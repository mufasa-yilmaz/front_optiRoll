import { DashboardPageHeader } from '../DashboardPageHeader';

/** Sipariş yönetimi sayfa başlığı. "Yeni Sipariş Ekle" butonu tablo toolbar'ında (StockRollsTable ile aynı tasarım). */
export function OrdersManagementHeader() {
  return (
    <DashboardPageHeader
      title="Sipariş Yönetimi"
      description="Siparişleri ekleyin, düzenleyin ve optimizasyona hazırlayın."
    />
  );
}
