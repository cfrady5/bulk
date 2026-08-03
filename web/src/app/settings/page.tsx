import { ModulePlaceholder } from '@/components/module-placeholder';

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Settings"
      description="Organization, members, pricing defaults, and integrations."
      phase="Phase 1+"
      bullets={[
        'Authentication + organization / members (Supabase Auth, RLS-scoped)',
        'Default rounding method and psychological pricing rules',
        'Platform fee presets (eBay, Whatnot, …)',
        'Storage locations and QR labels',
        'Future: pricing-service integrations for automated valuations',
      ]}
    />
  );
}
