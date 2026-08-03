import { ModulePlaceholder } from '@/components/module-placeholder';

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Reports"
      description="Inventory, sales, and break performance with date filters and CSV export."
      phase="Phase 6"
      bullets={[
        'Inventory: cost, current value, unrealized gains, aging, value by sport/player/source, turnover',
        'Sales: gross, net, realized profit, ROI, profit by platform/sport/player, days held, trends',
        'Breaks: profit by product/format, avg fill, avg spot price, buyers, shipping, planned vs actual',
        'Date filters and CSV export throughout',
      ]}
    />
  );
}
