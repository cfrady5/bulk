import { ModulePlaceholder } from '@/components/module-placeholder';

export default function InventoryPage() {
  return (
    <ModulePlaceholder
      title="Inventory"
      description="Every physical card as a permanent record — cost basis, valuation, status."
      phase="Phase 2"
      bullets={[
        'TanStack data table: search, sort, saved views, pagination, CSV export',
        'Filters: sport, player, set, grade, cost/value range, status, days held, profitable/underwater',
        'Bulk actions: change status, assign storage, add to listing batch, update values, archive',
        'Mobile card view for quick inventory checks',
        'Inline editing and column selection',
      ]}
    />
  );
}
