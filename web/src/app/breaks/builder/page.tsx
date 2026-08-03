import { ModulePlaceholder } from '@/components/module-placeholder';

export default function BreakBuilderPage() {
  return (
    <ModulePlaceholder
      title="Break Builder"
      description="Enter a break's full cost structure and compare selling formats before publishing."
      phase="Phase 4 — calculation engine already built & tested"
      bullets={[
        'Product + operating costs (fixed and variable per buyer/spot/shipment/card)',
        'Formats: Pick Your Team, Random Team, Two Random, divisions, tiers, and more',
        'Pricing calculator: break-even, target profit, target markup, target margin',
        'Fill-rate modeling (100/90/80/70/60%) with break-even fill + risk rating',
        'Pick Your Team weighted pricing with "rebalance remaining"',
        'Scenario comparison with a plain-language recommendation',
      ]}
    />
  );
}
