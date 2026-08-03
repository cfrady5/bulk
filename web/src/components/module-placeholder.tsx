import { PageHeader } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';

/** Temporary placeholder for modules landing in later phases. */
export function ModulePlaceholder({
  title,
  description,
  phase,
  bullets,
}: {
  title: string;
  description: string;
  phase: string;
  bullets: string[];
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="p-6">
          <div className="mb-3 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs text-muted-foreground">
            {phase}
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-indigo" />
                {b}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
