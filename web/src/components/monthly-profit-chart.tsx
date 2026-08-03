'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { money } from '@/lib/utils';

export interface MonthlyPoint {
  month: string;
  profitCents: number;
}

/** Monthly profit trend (spec §4). Sample data until sales are wired (Phase 3). */
export function MonthlyProfitChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5C5DF0" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#1E47E6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2E36" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${Math.round((v as number) / 100)}`}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: '#16181D',
              border: '1px solid #2A2E36',
              borderRadius: 10,
              color: '#F4F6F8',
            }}
            formatter={(v) => [money(v as number), 'Profit']}
          />
          <Area
            type="monotone"
            dataKey="profitCents"
            stroke="#8E73F5"
            strokeWidth={2}
            fill="url(#profitFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
