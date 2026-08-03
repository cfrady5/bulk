import { PageHeader } from '@/components/app-shell';
import { MonthlyProfitChart } from '@/components/monthly-profit-chart';
import { StatTile } from '@/components/stat-tile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { money, percent } from '@/lib/utils';

// NOTE: Sample figures for layout/design. Wired to live data in Phases 2–3.
const SAMPLE = {
  inventory: {
    totalCards: 342,
    costBasisCents: 1_284_500,
    valueAtAcqCents: 1_510_000,
    currentValueCents: 1_712_300,
    listed: 58,
    unlisted: 284,
    over30: 96,
    over90: 41,
  },
  sales: {
    grossCents: 842_100,
    netProceedsCents: 731_400,
    realizedProfitCents: 233_900,
    avgRoi: 0.47,
    avgDaysHeld: 38,
    soldThisMonth: 27,
  },
  breaks: {
    completed: 14,
    revenueCents: 1_930_000,
    profitCents: 412_000,
    avgMargin: 0.213,
    avgFill: 0.87,
  },
};

const MONTHLY = [
  { month: 'Jan', profitCents: 18_200 },
  { month: 'Feb', profitCents: 24_800 },
  { month: 'Mar', profitCents: 21_050 },
  { month: 'Apr', profitCents: 33_400 },
  { month: 'May', profitCents: 29_900 },
  { month: 'Jun', profitCents: 41_600 },
];

export default function DashboardPage() {
  const { inventory: inv, sales, breaks } = SAMPLE;
  const unrealizedCents = inv.currentValueCents - inv.costBasisCents;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Immediate financial overview across inventory, sales, and breaks."
      />

      <div className="mb-2 flex items-center gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning">
        Sample figures — live data lands in Phases 2–3.
      </div>

      {/* Inventory */}
      <section className="mt-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Inventory</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <StatTile label="Cards in inventory" value={inv.totalCards.toLocaleString()} />
          <StatTile label="Cost basis" value={money(inv.costBasisCents)} />
          <StatTile label="Value at acquisition" value={money(inv.valueAtAcqCents)} />
          <StatTile label="Current est. value" value={money(inv.currentValueCents)} />
          <StatTile
            label="Unrealized gain / loss"
            value={money(unrealizedCents)}
            sub={percent(unrealizedCents / inv.costBasisCents)}
            tone={unrealizedCents >= 0 ? 'positive' : 'negative'}
          />
          <StatTile label="Listed" value={String(inv.listed)} />
          <StatTile label="Aging > 30 days" value={String(inv.over30)} />
          <StatTile label="Aging > 90 days" value={String(inv.over90)} />
        </div>
      </section>

      {/* Sales */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Sales</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatTile label="Gross sales" value={money(sales.grossCents)} />
          <StatTile label="Net proceeds" value={money(sales.netProceedsCents)} />
          <StatTile
            label="Realized profit"
            value={money(sales.realizedProfitCents)}
            tone="positive"
          />
          <StatTile label="Avg ROI" value={percent(sales.avgRoi)} tone="positive" />
          <StatTile label="Avg days held" value={String(sales.avgDaysHeld)} />
          <StatTile label="Sold this month" value={String(sales.soldThisMonth)} />
        </div>
      </section>

      {/* Breaks */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Breaks</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <StatTile label="Breaks completed" value={String(breaks.completed)} />
          <StatTile label="Break revenue" value={money(breaks.revenueCents)} />
          <StatTile label="Break profit" value={money(breaks.profitCents)} tone="positive" />
          <StatTile label="Avg margin" value={percent(breaks.avgMargin)} />
          <StatTile label="Avg fill rate" value={percent(breaks.avgFill)} />
        </div>
      </section>

      {/* Trend + action items */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly profit trend</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyProfitChart data={MONTHLY} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Items requiring action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              '3 cards missing current value',
              '5 cards missing cost basis',
              '2 listings older than 60 days',
              '1 grading submission awaiting return',
              '1 active break with unsold spots',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2 text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
