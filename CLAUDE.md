@AGENTS.md

# RaceDay UserWeb — Claude Code Notes

`AGENTS.md` (imported above) holds the full tech stack, UI/UX rules, accessibility and handoff checklist. This file adds the product context, repo map and commands. Read the Next.js guides in `node_modules/next/dist/docs/` before writing Next.js code — this version has breaking changes.

## What this app is

UserWeb is the public/runner-facing Next.js frontend of **RaceDay**, a Vietnamese running-event platform. It serves two kinds of users with one account system:

1. **Runners (VĐV)** — browse events, **join an event** (register → pay → confirmation), then manage registrations, tickets/QR, payments, wallet, certificates, results, photos and disputes.
2. **Organizers (BTC)** — **register/create a new event** (buy an event package, fill the event profile, submit for approval), open registration, then operate it (staff, supplies, map/course, results, payouts, complaints, dashboard, race simulation).

A runner can become an organizer by buying a package and creating an event; organizer routes are gated by login plus API-side ownership, not by a pre-existing ORGANIZER role (see `src/lib/route-permissions.ts`). The backend is a separate ASP.NET API (not in this repo); Staff/Admin tooling lives in the separate AdminWeb app.

## Key user journeys (and where they live)

| Journey | Routes under `src/app/` |
| --- | --- |
| Discover events | `(main)/page.tsx`, `(main)/events`, `(main)/events/[id]` |
| Join an event (runner) | `events/[id]/register` → `payment` → `pending` → `confirmation`; resume via `payments/[id]/continue`, `my-registrations/[id]/resubmit` |
| My activity | `(main)/(user)/`: `my-registrations`, `registered-events`, `payments`, `wallet`, `certificates`, `profile`, `race-day`, `scan-qr`, `disputes` |
| Results / photos | `(main)/results`, `(main)/photos` |
| Create a new event (organizer) | `events/create`, `events/create/package-return`, then `(organizer)/organizer/events/[id]/profile/{basic,distances,content,documents,bib,supplies,overview,open-registration}` |
| Run an event (organizer) | `(organizer)/organizer`, `.../events/[id]/{staff,setup-map,results,race-simulation,wallet,payout-history}`, `organizer/disputes` |
| Auth | `(auth)/{login,register,verify-email,forgot-password,reset-password}` |
| BFF | `app/api/backend/[...path]/route.ts` (proxy to ASP.NET), `app/api/auth/{logout,hub-token}` |

Registration, payment and approval are separate state machines — keep event, registration, payment, payout, refund and complaint statuses distinct and use the existing helpers (`src/lib/event-lifecycle.ts`, `race-status.ts`, `registration-display.ts`, `ticket-pricing.ts`). Payment success must be confirmed by the backend, never inferred from a return URL.

## Code map

- `src/api/` typed API calls (Axios, `@/config/axios`), `src/dto/` contracts, `src/lib/` business/format helpers, `src/hooks/`, `src/stores/auth-store.ts` (Zustand, no persisted tokens), `src/components/` (`ui/` shadcn primitives + feature folders), `src/proxy.ts` (route gating).
- Auth is cookie-based through the BFF (HttpOnly session cookie, tokens never in JS). See `docs/authentication.md`. Organizer dashboard: `docs/dashboard.md`.
- Real-time features use SignalR (`src/hooks/useSimulationHub.ts`, `usePositionAlerts.ts`); `/api/auth/hub-token` supplies the hub token.

## Commands

```bash
npm run dev          # dev server on http://localhost:3000
npm run build        # production build (run for routing / server-client / CSS changes)
npm run lint         # ESLint
npx tsc --noEmit     # type check
npm run test:auth    # auth store + HTTP tests
node --test tests/<name>.test.mjs   # complaints, course-undo, dashboard, event-lifecycle, race-status, certificates, ...
npx playwright test  # tests/*.spec.ts (needs dev server; chromium/firefox/webkit)
```

## Environment

`BACKEND_API_URL` (server-side upstream for the BFF), `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STORAGE_PUBLIC_BASE_URL` (also feed `next.config.ts` image hosts), `AUTH_APP_ORIGIN`, and mock toggles `NEXT_PUBLIC_FINANCE_USE_MOCK` / `NEXT_PUBLIC_RACE_MAP_USE_MOCK`. A Dockerfile (Node 22, multi-stage) exists for deployment. Do not commit `.env*` files.

## Working conventions

- User-facing text is Vietnamese with full diacritics; code, identifiers and API fields stay as-is.
- Keep changes scoped; reuse existing components (`EventCard`, `FilterChip`, `RunnerPageHeader`, `Pagination`, `OrganizerShell`) rather than adding new ones. Use `*.mock.ts` files only as a reference, not as production paths.
- Keep sessions/tokens out of localStorage and readable cookies; navigation visibility is not authorization.
- Report only checks you actually ran; no browser/backend may be available, so say so when visual or live checks were skipped.
