import { ModulePlaceholder } from '@/components/module-placeholder';

export default function ActiveBreaksPage() {
  return (
    <ModulePlaceholder
      title="Active Breaks"
      description="Convert a planned scenario into a live break and track fill in real time."
      phase="Phase 5"
      bullets={[
        'Spot list with customer, payment status, amount paid, discount, team assignment',
        'Statuses: Draft, Open, Filling, Full, Scheduled, Completed, Shipping, Closed',
        'Live: spots sold/remaining, fill %, revenue collected, current projected profit',
        'Minimum additional spots needed to break even',
      ]}
    />
  );
}
