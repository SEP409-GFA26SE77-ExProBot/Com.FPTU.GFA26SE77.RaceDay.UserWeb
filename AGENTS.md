<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RaceDay Frontend Guidelines

## Tech Stack

Use the existing stack below. Versions and ranges come from `package.json`; `package-lock.json` records the resolved dependency versions.

| Area | Technology and project conventions |
| --- | --- |
| Framework | Next.js **16.3.3**, App Router under `src/app/`, Server/Client Components, Route Handlers, and `src/proxy.ts` |
| UI runtime | React and React DOM **19.2.8** |
| Language | TypeScript **5.x** with strict mode; `@/*` maps to `src/*` |
| Styling | Tailwind CSS **4.x**, `@tailwindcss/postcss`, CSS variables in `src/app/globals.css`, and `tw-animate-css` |
| UI components | shadcn CLI **4.x**, Radix UI **1.x**, `radix-nova` style; reusable primitives in `src/components/ui/` |
| Component variants | `class-variance-authority` and `cn` (also exported from `@/lib/utils`) |
| Icons and fonts | `lucide-react`; Inter and Roboto Mono through `next/font/google` with Vietnamese support |
| Client state | Zustand **5.x**; verified user state in `src/stores/auth-store.ts` |
| HTTP and API integration | Axios **1.x**, shared client in `src/config/axios.ts`, same-origin `/api/backend/` BFF, typed APIs and DTOs in `src/api/` and `src/dto/` |
| Validation | Zod **4.x**, shared input rules in `src/lib/input-rules.ts`, and feature-specific validation helpers |
| Notifications | React Toastify **11.x**, root `ToastProvider`, and shared toast helpers |
| Maps | Leaflet **1.9.x** and React Leaflet **5.x**; browser-only map canvases loaded dynamically |
| QR codes | `qrcode.react` **4.x** for rendering and `@yudiel/react-qr-scanner` **2.x** for scanning |
| Images | `next/image`, assets in `public/`, backend URL normalization through `src/lib/media-url.ts` |
| Tooling and tests | npm with `package-lock.json`, ESLint **9.x** with Next.js rules, and Node.js's built-in test runner for `tests/*.test.mjs` |

## UI/UX Design
- Use the ui-ux-pro-max skill when implementing or improving UI/UX.
- Follow the skill's design principles for layout, typography, spacing, colors, responsiveness, and accessibility.
- Maintain visual consistency across the RaceDay platform.

## Component Reusability
- ALWAYS inspect the existing codebase before creating UI.
- Prioritize reusing existing components, layouts, styles, design tokens, and UI resources.
- Prefer existing shadcn/ui components when appropriate.
- Reuse and extend existing components instead of duplicating them.
- Create new components only when existing ones cannot reasonably satisfy the requirements.
- Do not install additional UI libraries unless necessary and explicitly approved.
- Do not replace existing UI libraries or configurations.

## Implementation Rules
- Follow the existing Next.js project structure.
- Respect Server and Client Component boundaries.
- Preserve existing routing, API integrations, and business logic.
- Use Tailwind CSS for styling.
- Follow the project's established design conventions.
- Ensure responsive layouts and accessible interactions.
- Avoid unnecessary dependencies and code duplication.

## Workflow
1. Inspect relevant pages, components, and existing styles.
2. Identify reusable UI elements.
3. Apply ui-ux-pro-max design recommendations.
4. Implement using existing components whenever possible.
5. Verify responsiveness, accessibility, and functionality.

# RaceDay UI/UX maintenance

These instructions apply throughout this repository. Keep UI work within the requested scope and preserve working user journeys. The rules below describe maintenance expectations; existing inconsistencies are not patterns to copy automatically.

## Project context and starting points

- RaceDay is a Vietnamese running-event platform with public discovery, runner registration/payment/history, organizer event operations, results, photos, and complaints.
- The project uses the Next.js App Router, React, TypeScript, Tailwind CSS v4, shadcn/Radix primitives, Lucide icons, Zustand, and React Toastify. Check `package.json` for installed versions and available scripts. Use the existing npm lockfile and dependencies where practical.
- Before changing a screen, read its route, owning layout, shared components, and relevant API/DTO/helpers. Trace imports from an active route before copying a `*Prototype*` component or mock implementation.
- Preserve the generated Next.js instructions above. Consult the installed guides in `node_modules/next/dist/docs/01-app/01-getting-started/`, especially `03-layouts-and-pages.md`, `05-server-and-client-components.md`, `11-css.md`, and `12-images.md` when relevant.

| Concern | Existing source of truth |
| --- | --- |
| Root fonts, language, providers, metadata | `src/app/layout.tsx` |
| Theme tokens, global styles, shared animations | `src/app/globals.css` |
| Runner/public layout and navigation | `src/app/(main)/layout.tsx`, `src/components/header/page.tsx`, `src/components/footer/Footer.tsx` |
| Authentication layout and styles | `src/app/(auth)/layout.tsx`, `src/app/(auth)/auth.css` |
| Organizer workspace and navigation | `src/app/(organizer)/organizer/layout.tsx`, `src/components/organizer/OrganizerShell.tsx` |
| Runner content widths | `src/lib/page-shell.ts` |
| Reusable UI primitives | `src/components/ui/`, `components.json` |
| API contracts and requests | `src/dto/`, `src/api/`, `src/config/axios.ts` |
| Authentication behavior | `src/components/AuthProvider.tsx`, `src/stores/auth-store.ts`, `docs/authentication.md` |

## Visual language

- Preserve the RaceDay identity: Flag/Lucide branding, orange-to-red accents and gradients, warm `#f7f5f1` page backgrounds, white/light cards, dark readable text, subtle borders, and restrained shadows. Public hero and authentication screens intentionally use dark backgrounds; the organizer sidebar uses `#121827`.
- Use the existing Inter font for interface text and Roboto Mono where monospaced data is appropriate. Both are configured through `next/font` with Vietnamese support. Preserve `lang="vi"`, the RaceDay favicon, and the shared browser title unless the task changes them.
- Use semantic Tailwind tokens such as `bg-card`, `bg-background`, `border-border`, `text-foreground`, and `text-muted-foreground` for surfaces and text. Brand actions currently use explicit orange/red classes while the shared `primary` token is neutral; account for both when editing primitives.
- Match the surrounding screen's hierarchy: bold, tightly tracked headings; small muted supporting text; orange eyebrow labels; rounded cards (`rounded-xl`/`rounded-2xl`); and compact badges. Keep dense organizer screens practical for operational work.
- Give each action group a clear primary action, with quieter secondary actions and clearly labeled destructive actions. Keep hover, focus, active, disabled, selected, and busy states visually distinct.
- Prefer existing Lucide icons and public assets. Keep icon sizing consistent with adjacent controls and preserve readable contrast over banners and gradients.
- The main interface currently targets light surfaces with intentional dark sections. Treat a complete theme change as its own scope; the presence of `.dark` tokens alone does not establish a supported dark-mode experience.

## Layout and responsive behavior

- Reuse the owning layout instead of adding another header, footer, sidebar, or nested page shell. Root providers belong in the root layout.
- For runner page content, use `PAGE_SHELL` (1400px), `PAGE_SHELL_NARROW` (max-w-5xl), or `PAGE_SHELL_FORM` (1100px) from `src/lib/page-shell.ts` as appropriate. These share `px-4 sm:px-6 lg:px-8` gutters. Preserve intentional full-width hero sections and existing header/footer widths.
- Let `OrganizerShell` own its sidebar offsets, sticky header, event context, and content padding. Preserve desktop collapse, the mobile drawer, current-route highlighting, query-driven tabs, and event context on complaint routes.
- Use `src/components/organizer/EventProfileSectionHeader.tsx` on organizer profile sections. The event name belongs in the shell and the event status belongs in the submission hub; its deprecated `eventName` and `status` props must not be reintroduced into the rendered section header.
- Build from a usable narrow layout, then expand columns at existing breakpoints. Stack form fields and actions when needed, allow filter chips to wrap, and use `min-w-0`/appropriate wrapping for long Vietnamese names, email addresses, and file names.
- Keep horizontal scrolling inside a table or other intentionally wide region. Keep navigation, forms, cards, dialogs, and primary actions within the viewport. Allow tall dialogs and mobile menus to scroll without hiding their close/action controls.
- Check sticky elements and stacking together: the public header, organizer drawer/backdrop, Leaflet controls, dialogs, and toasts must remain usable. Review existing stacking contexts before increasing z-index.

## Shared components and implementation boundaries

- Reuse `src/components/ui/` primitives for matching controls, tables, alerts, skeletons, and dialogs. Preserve Radix semantics, focus handling, component variants, and disabled behavior. Apply a screen-specific class or variant before changing a primitive used across the app.
- Use `cn` through `@/lib/utils` or the existing `cn` package consistently with the file being edited. Keep styling in Tailwind utilities; put genuinely shared tokens/base rules in `globals.css` and scope custom feature CSS. Authentication styles should remain scoped to the existing `auth-*`/OTP classes.
- Reuse feature components such as `EventCard`, `EventCardSkeleton`, `TicketPriceDisplay`, `EventProfileSectionHeader`, and complaint feedback components instead of duplicating their behavior. Update related skeleton geometry when changing the rendered component's layout.
- Keep server layouts and authorization checks on the server. Place `"use client"` at the interactive boundary needed for state, events, or browser APIs, and preserve existing server-page/client-component splits and Suspense boundaries.
- Keep API calls in `src/api/`, contracts in `src/dto/`, and reusable business/display logic in `src/lib/`. Use the existing Axios client and same-origin BFF rather than adding an independent authentication/request path to a screen.

## Interaction, feedback, and accessibility

- Provide distinct initial-loading, populated, empty/no-match, error/retry, and submitting states for data-driven screens. Use `PageLoading` for page loading and existing skeletons for content placeholders. Match the eventual layout to reduce visual jumps.
- Empty states should explain what happened and offer a relevant next action, such as clearing filters or creating a record. A failed request must remain distinguishable from a successful empty result.
- Preserve field values and useful page context after a failed save. Disable repeated submissions while requests are running, show a meaningful busy label, and display success only after the operation is confirmed.
- Use the root `ToastProvider` and `src/lib/toast.ts` for transient feedback; existing organizer hooks also use this provider. Keep validation errors beside their fields and blocking/load failures visible in the page. Avoid duplicate toasts and additional toast containers.
- Reuse `getApiErrorMessage` from `src/lib/error.ts` with a useful Vietnamese fallback. Give recoverable failures a working retry or return action.
- Keep search, filters, result counts, and pagination consistent. Reuse `Pagination` and `usePagedList` for existing client-paginated lists; preserve server pagination for API-paginated resources such as complaints. Reset/clamp pages when filters or result counts change and preserve supported URL filter/tab state.
- Use links for navigation and buttons for actions, with `type="button"` on non-submit form controls. Avoid nesting interactive controls inside a clickable event card.
- Give inputs visible associated labels, connect help/errors with `aria-describedby`, and mark invalid controls with `aria-invalid`. Placeholders supplement labels. Use accessible names for icon-only actions, `aria-expanded` for disclosure controls, and `aria-current` for current navigation/page items.
- Preserve keyboard access and visible focus indicators. Dialogs need a title, appropriate description, focus containment/restoration, and predictable dismissal; prefer the existing Radix dialog over a custom overlay. Keep status meaning available through text as well as color.
- Aim for at least 44px touch targets on primary mobile controls. Support zoom and readable Vietnamese text. Respect reduced-motion preferences when adding or changing decorative animation, and keep content available without animation.

## Forms, language, and data display

- Write user-facing labels, hints, errors, empty states, and confirmations in natural Vietnamese with full diacritics. Follow existing domain terms such as VĐV, BTC, cự ly, BIB, đăng ký, thanh toán, and khiếu nại; keep code/API identifiers unchanged.
- Reuse `src/lib/format.ts` for Vietnamese dates, VND prices, and relevant status labels. Keep missing values distinct from real zero values; a missing price must not become an offer of a free ticket.
- Reuse `src/lib/input-rules.ts`, registration helpers, and feature validation. Preserve backend constraints, required/optional distinctions, consent fields, and clear messages explaining how to fix invalid input.
- Keep phone numbers, identity documents, bank account numbers, BIBs, and identifiers as strings so leading zeroes survive. Use suitable input types, autocomplete, and input modes without preventing valid input or paste.
- Preserve date-only values as dates and UTC timestamps as instants. Reuse the local/UTC input conversion helpers in `src/app/(organizer)/organizer/events/[id]/profile/_shared.ts` for organizer datetime fields; verify boundary dates when changing registration windows.
- Use `mediaDisplayUrl` from `src/lib/media-url.ts` for backend media. Prefer `next/image` for event imagery with an explicit size/aspect ratio or sized `fill` parent, accurate `sizes`, meaningful alt text, and a stable missing-image fallback. Keep new remote hosts consistent with `next.config.ts`.

## Preserve domain behavior during UI changes

- Event, registration, payment, payout, refund, and complaint statuses are separate concepts. Reuse their existing label/color helpers and DTO values. Public and organizer event labels intentionally differ; preserve their audience-specific wording.
- Use `src/lib/event-lifecycle.ts` for public availability and date-window behavior, `src/lib/ticket-pricing.ts` for ticket pricing, and organizer profile `_shared.ts` helpers for editing/submission/opening eligibility. Preserve the catalog's visibility filters and status-dependent card destinations.
- Keep registration, approval, payment, confirmation, resubmission, and continued-payment routes connected through their existing event/registration/payment identifiers. Preserve retry/resume paths and backend confirmation of payment; a checkout callback or return URL alone does not prove payment succeeded.
- Read identity and role through the existing auth store/provider. Preserve initialization gates, login return paths, server authorization, and ownership checks. Navigation visibility is a presentation rule, not authorization. Keep sessions/tokens out of UI-managed localStorage and readable cookies.
- For map changes, preserve client-only Leaflet loading, an explicitly sized map container, distance-specific courses, checkpoint colors from `src/lib/race-map/map-colors.ts`, save/undo behavior, and cleanup of listeners/timers. Check the map after sidebar collapse and viewport resizing. Preserve public maps' availability handling.
- For QR/check-in changes, preserve scanner permission/error handling and the distinction between offline queued work and confirmed server check-in. Reuse `src/lib/check-in-offline.ts` instead of inventing another queue.

## Validation and handoff

- For UI changes, inspect the affected route and a neighboring route that shares changed components. Check a narrow phone viewport (about 375px), a tablet viewport (about 768px), and desktop (1280px or wider), plus keyboard navigation and long/missing content.
- Exercise affected loading, empty, error, disabled, and success states. Check relevant runner/organizer and signed-out access paths. Inspect mobile navigation, dialog scrolling, filter/pagination behavior, and sticky elements when touched.
- Run checks appropriate to the change from the repository root: `npx tsc --noEmit`, `npm run lint` (or focused ESLint on edited files), and `npm run build` for application changes. Production builds matter for routing, server/client boundaries, and CSS order. Documentation-only edits need a diff/reference review rather than an application build.
- Run `npm run test:auth` when changing authentication/navigation access behavior; consult `docs/authentication.md` for live-test prerequisites and report any skipped coverage. Run `node --test tests/complaints.test.mjs` for complaint logic and `node --test tests/course-undo.test.mjs` for course-editor behavior when relevant.
- Add focused behavioral coverage when business logic changes. Keep verification proportional for presentation-only changes. The repository has no configured browser-test script; describe actual visual checks and any unavailable browser/backend access accurately.
- Report changed behavior, the checks actually performed, and remaining limitations. Identify unrelated existing failures separately; keep fixes scoped and preserve meaningful checks. Update this file when shared UI conventions or their source locations change.

## Public and runner UI resources

- Use `src/components/runner/RunnerPageHeader.tsx` for the profile, ticket list, registered-event list, payment history, and certificate list headings and account section navigation. Render it inside the page's existing `PAGE_SHELL` container and authenticated content boundary.
- Use `src/components/events/FilterChip.tsx` for public discovery and runner registration filters. It extends the existing shadcn Button with a wrapping label, a 44px minimum target, and `aria-pressed` selection state.
- Shared `Pagination` shows previous/next controls and the current page on phones, with numbered page controls from the `sm` breakpoint. Keep pagination state and API pagination in the owning feature.
- Certificate previews use `src/components/certificates/ParticipationCertificate.tsx` with artwork in `src/lib/certificate-canvas.ts`. Export only that canvas through `src/lib/certificate-pdf.ts`; do not use `window.print()` or capture the site layout for certificate downloads. Keep participation certificates distinct from official race results.
