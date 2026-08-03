# bulk — web app

Responsive web app for **sports-card inventory + break profitability**.
Next.js (App Router) · TypeScript · Tailwind · Supabase · Zod · React Hook Form ·
TanStack Table · Recharts.

## Develop

```bash
cd web
npm install --legacy-peer-deps
cp .env.example .env.local     # fill in Supabase values
npm run dev                    # http://localhost:3000
```

## Scripts
- `npm run dev` / `build` / `start`
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — Vitest (finance engine unit tests)

## Where things live
- `src/lib/finance/` — pure, tested calculation engine (money, allocation, sales, breaks, pricing, fill-rate, PYT, comparison). **Business math has no UI/DB coupling.**
- `src/lib/supabase/` — browser + server clients (anon key only; service-role stays server-side).
- `src/components/` — UI (shell, nav, tiles, charts, primitives).
- `src/app/` — routes: dashboard, inventory, purchases, sales, breaks (builder/active/history), reports, settings.
- DB schema: `../supabase/migrations/0001_core.sql` (cents-based, RLS-enabled).

See `../MIGRATION_PLAN.md` for the full rebuild plan and phases.
