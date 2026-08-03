import { ModulePlaceholder } from '@/components/module-placeholder';

export default function SalesPage() {
  return (
    <ModulePlaceholder
      title="Sales"
      description="Register sales from a card and see true net profit after every fee."
      phase="Phase 3"
      bullets={[
        'Net proceeds = gross + buyer-paid shipping − all sale expenses',
        'Net profit and ROI (dollar + percentage) after fees, shipping, refunds',
        'Platforms: eBay, Whatnot, Instagram, Facebook, card show, consignment, trade',
        'On sale: card status → Sold; record preserved in history; days held recorded',
        'Partial-quantity sales for multi-quantity records',
      ]}
    />
  );
}
