import { ModulePlaceholder } from '@/components/module-placeholder';

export default function PurchasesPage() {
  return (
    <ModulePlaceholder
      title="Purchases"
      description="Record what you paid, then allocate landed cost across the cards."
      phase="Phase 2"
      bullets={[
        'Purchase types: single, lot, collection, sealed box, case, break, trade, consignment',
        'Landed cost = subtotal + tax + buyer premium + inbound shipping + travel + other',
        'Cost allocation: equal, manual, or value-weighted (validated to sum exactly)',
        'Receipt image upload and allocation audit history',
      ]}
    />
  );
}
