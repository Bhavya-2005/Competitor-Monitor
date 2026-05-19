# Competitor Monitor

An AI-powered competitor monitoring dashboard that tracks rivals' websites daily — detecting pricing changes, new features, blog posts, and job listings — and delivers a morning Slack digest.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/competitor-monitor run dev` — run the frontend (port 25318)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind (dark cockpit theme)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — competitors, checks, digests, settings tables
- `artifacts/api-server/src/routes/` — competitors, checks, digests, dashboard, settings
- `artifacts/api-server/src/lib/scraper.ts` — AI-powered web scraping (OpenRouter/OpenAI)
- `artifacts/api-server/src/lib/slack.ts` — Slack webhook integration
- `artifacts/api-server/src/lib/scheduler.ts` — hourly cron for daily checks
- `artifacts/competitor-monitor/src/` — React frontend with wouter routing

## Architecture decisions

- OpenAPI-first: all types generated via Orval from `lib/api-spec/openapi.yaml`
- Scraping uses fetch + AI analysis (OpenRouter gpt-4o-mini) for intelligent change detection
- Falls back to simulated checks when no OPENAI_API_KEY/OPENROUTER_API_KEY is set
- Slack digests use incoming webhooks — no OAuth required, just a webhook URL
- Scheduler runs every hour, fires checks at the configured digest time (UTC)

## Product

- **Dashboard** — Command Center with live stats, change distribution breakdown, recent intelligence feed
- **Competitors** — Add/edit/delete tracked websites, configure which categories to monitor per competitor
- **All Checks** — Full timeline feed of every check run across all competitors
- **Digests** — History of Slack digests with content previews, manual send button
- **Settings** — Slack webhook URL, digest schedule (daily/weekly), time, timezone

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Set `OPENAI_API_KEY` or `OPENROUTER_API_KEY` for real AI-powered analysis; without it, checks simulate results
- Slack digests show as "skipped" until a webhook URL is configured in Settings and digest is enabled
- Google Fonts @import must be the FIRST line in `index.css` — before `@import "tailwindcss"`
- Always run `pnpm run typecheck:libs` after adding new schema files before typechecking api-server

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
