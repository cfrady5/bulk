import { ModulePlaceholder } from '@/components/module-placeholder';

export default function BreakHistoryPage() {
  return (
    <ModulePlaceholder
      title="Break History"
      description="Completed breaks with planned-vs-actual results feeding future recommendations."
      phase="Phase 5"
      bullets={[
        'Planned vs actual: product, supplies, fees, shipping, buyers, revenue, profit, margin',
        'Dollar and percentage variances (favorable / unfavorable)',
        'Result notes (filled quickly, needed discounts, repeat this format, avoid this product)',
        'Feeds break reporting and scenario recommendations',
      ]}
    />
  );
}
