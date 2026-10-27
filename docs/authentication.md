# Authentication and authorization refactor

Implemented and verified locally on 23 October 2026.

## Previous vulnerabilities

Both Next.js apps stored JWTs and identity/role information in JavaScript-readable cookies. Route proxies trusted the role cookie or decoded unsigned JWT payloads. An absolute token expiration timestamp was treated as a duration. Logout only deleted readable cookies. The operations sidebar also persisted a selected role in localStorage/cookies.

## Architecture

Each Next.js app owns its host-only HttpOnly session cookie and acts as a same-origin Backend-for-Frontend (BFF). This supports the separate frontend/API origins and authenticated server rendering without a cross-site authentication cookie.

- User cookie: `raceday_user_session`; operations cookie: `raceday_ops_session`.
- Cookies: HttpOnly, SameSite=Lax, Path=/, Secure in production, expiry matching the backend-validated JWT's absolute `exp`. No Domain attribute.
- The browser posts the existing username/password payload through `/api/backend/api/v1/iam/auth/login`. Next.js calls the existing ASP.NET login endpoint, validates its token against `/api/v1/iam/me`, sets the cookie, and returns only `mustChangePassword`. The backend login contract remains compatible with existing bearer clients.
- Axios uses `/api/backend/`. Only Next.js attaches a Bearer token. Caller-supplied Authorization, role and user-ID headers/cookies are not forwarded as authority.
- The BFF has a fixed upstream, constrained API prefixes, no upstream redirect following, no-store responses, and no forwarding of upstream Set-Cookie headers.
- Mutating requests and logout require an exact same-origin Origin header and reject cross-site fetch metadata. SameSite cookies provide another CSRF defense. ASP.NET continues using bearer authentication, not automatic browser-cookie authentication.

## Frontend initialization and state

`stores/auth-store.ts` uses Zustand without persistence. It stores only the `/me` user and initialization/loading state, never a JWT. `AuthUser`/`MyProfileDto` include the actual backend role/profile fields and nullable data.

`AuthProvider` initializes through `/me`, deduplicates concurrent requests, and withholds protected UI until initialization completes. It revalidates on browser focus. Login initializes the store from `/me`; profile updates update the same store. Request generations prevent a delayed `/me` response from restoring state after logout. BroadcastChannel synchronizes sessions across tabs. Private browser caches are cleared, and identity changes remount the UI to discard component-level private state.

Former js-cookie checks, header cookie polling, role-cookie setters and role-storage dependencies were migrated to the in-memory verified user. The obsolete operations roleStorage file was removed. Existing JWT utilities have no authorization callers.

## Server-side authorization

`lib/route-permissions.ts` centralizes access rules. Existing user/organizer permissions and operations compact-URL rewrites are preserved. Unauthorized navigation preserves the requested destination for login or reaches the existing Forbidden page. Login rejects external redirect destinations.

Next.js proxies validate sessions through `/me` rather than cookie presence or unsigned claims. Organizer and operations role layouts independently validate `/me` before rendering. Navigation components remain client components behind those server checks.

ASP.NET validates the signing key, signature, issuer, audience and expiration, with zero clock skew. IAM's `OnTokenValidated` hook loads the current human account and role from the database, rejects locked/deleted/unverified accounts, and replaces stale JWT role claims. A role downgrade takes effect on the next request. Wearable tokens retain their existing scoped device flow.

Existing backend policies and business ownership checks remain authoritative. `/me` derives identity from the validated subject. No frontend userId selects an account. Legitimate runner-to-organizer purchase/creation workflows are preserved.

## Logout and migration

`POST /api/auth/logout` expires the session cookie with matching host/path/security settings. It does not depend on ASP.NET availability. The frontend clears Zustand/private caches, broadcasts the change, and preserves the redirect to `/`.

Legacy cookies (`jwt`, `accessToken`, `access_token`, `role`, `username`, `userId`, `user_id`, `avatar_url`, `raceday_role`) are cleared during login or invalid-session responses. Legacy JWT cookies are never promoted to sessions. Existing users must log in again.

No refresh-token or logout/revocation endpoint exists in the inspected IAM code. None was invented. JWT lifetime remains eight hours. Logout removes the browser session; it does not revoke a separately copied stateless bearer token. Account lock/deletion and role changes are checked on subsequent authenticated requests. Network loss before a browser receives logout's response can require retrying logout.

## Environment and operation

Existing `NEXT_PUBLIC_API_URL` remains available for public media URLs and as the default server upstream. Optional additions in each frontend:

- `BACKEND_API_URL`: server-only API origin, for example the API service inside a container network. Defaults to NEXT_PUBLIC_API_URL, then http://localhost:5080.
- `AUTH_APP_ORIGIN`: canonical HTTPS frontend origin when a reverse proxy changes the observed origin. Configure the correct separate origin for each app; no wildcards.

Production requires HTTPS. No signing key is needed in the frontends. Do not put secrets in public environment variables.

From the WebAPI repository, build/start using:

```powershell
docker compose -f deploy/docker-compose.yml --profile api up -d --build
```

## Profile identity number

The existing nullable `iam.users.id_number` column and its migration are reused. The user profile now displays and edits Identity number as text, preserving leading zeroes. Both self-service and administrator profile APIs support normalization and validation: 9 or 12 digits for CCCD/CMND, or 6–12 alphanumeric characters starting with a letter for a passport. Omitted/null values preserve the current number; an explicit empty string clears it. No duplicate database column or migration was added.

## Validation

- Requested Docker API build/start: passed.
- Full `dotnet build RaceDay.slnx`: passed, zero errors; existing package/assembly warnings remain.
- Both frontend TypeScript checks and production builds: passed.
- IAM unit tests: 73 passed, including four new current-account tests and 16 profile identity-number cases. Stale lock/unlock test fixtures were repaired for the current authorization dependencies.
- Final auth suites: 21 reported passing tests in each run (20 checks/subtests plus the HTTP suite wrapper), with no skips. Live-service runs covered Runner, Organizer, Admin, Coordinator, Volunteer and Photographer.
- Automated coverage: concurrent initialization; stale requests after logout; failed initialization; logout failures; development/production cookie attributes; failed login; no token in login JSON (including case-insensitive backend paths); repeat `/me`; forged role/userId cookies; tampered JWT; properly signed expired JWT; backend 401/403; ignored caller Authorization; server redirects; CSRF; logout expiry.
- Browser checks: Organizer login; reload restoration; no readable token/role cookie; private profile; logout redirecting a second private tab; wrong-password feedback; Runner login; Runner-to-Organizer denial; Coordinator dashboard; Coordinator-to-Admin Forbidden; operations logout; Admin login and dashboard rendering.
- New auth modules and tests pass focused lint. Full-repository lint still reports 69 existing UserWeb errors and 10 existing operations errors. Edited-file baseline comparison: UserWeb 33 errors before/33 after; operations 2 before/1 after. Existing lint issues were not suppressed.
- Full existing .NET suite: nine Event-module tests still fail because their fixtures omit the required distance BIB configuration. Shared (1), Photo (12), IAM (73) and the other seven Event tests pass. The unrelated Event business tests were not changed.
- Identity-number API/database checks passed: normalized save/read, omitted-value preservation, invalid-value rejection, administrator update and explicit clearing. The test account's original value was restored.
- Runner mobile: all three existing Flutter tests passed. Runner watch: its one scaffold test passed; this provides limited functional coverage.
- PhotoDay: Python application syntax compilation and installed dependency consistency checks passed. Full OCR processing was not exercised.
- Existing dependency vulnerability warnings remain for separate follow-up.

## Re-running auth tests

Run `npm run test:auth` in either frontend. Store/config tests run without services. Live HTTP tests require:

- `AUTH_TEST_ORIGIN`: running frontend origin.
- `AUTH_TEST_USERNAME` / `AUTH_TEST_PASSWORD`: existing local test account.
- `AUTH_TEST_BACKEND`: optional API origin, default http://localhost:5080.
- `AUTH_TEST_SIGNING_KEY`: optional local test signing key for the signed-expired-token case; use only in a controlled test environment.

Tests never print credentials/tokens. Live tests sign in/out and make read-only queries; they do not change account roles or business data.

## Modified files

The following list is generated from the three repositories' working diffs.

### UserWeb

- `package-lock.json`
- `package.json`
- `src/api/auth.ts`
- `src/api/race-map.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/(main)/(user)/certificates/page.tsx`
- `src/app/(main)/(user)/disputes/page.tsx`
- `src/app/(main)/(user)/my-events/MyEventsClient.tsx`
- `src/app/(main)/(user)/my-registrations/[id]/resubmit/page.tsx`
- `src/app/(main)/(user)/my-registrations/page.tsx`
- `src/app/(main)/(user)/payments/page.tsx`
- `src/app/(main)/(user)/profile/edit/page.tsx`
- `src/app/(main)/(user)/profile/page.tsx`
- `src/app/(main)/(user)/race-day/page.tsx`
- `src/app/(main)/(user)/registered-events/RegisteredEventsClient.tsx`
- `src/app/(main)/(user)/wallet/page.tsx`
- `src/app/(main)/events/[id]/page.tsx`
- `src/app/(main)/events/[id]/register/page.tsx`
- `src/app/(main)/page.tsx`
- `src/app/(main)/photos/page.tsx`
- `src/app/(main)/results/page.tsx`
- `src/app/(organizer)/organizer/events/[id]/page.tsx`
- `src/app/(organizer)/organizer/layout.tsx`
- `src/app/layout.tsx`
- `src/components/header/page.tsx`
- `src/components/organizer/EventPackageCheckout.tsx`
- `src/components/organizer/OrganizerShell.tsx`
- `src/components/results/EventLeaderboard.tsx`
- `src/config/axios.ts`
- `src/dto/auth.dto.ts`
- `src/lib/input-rules.ts`
- `src/proxy.ts`
- `docs/authentication.md`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/backend/[...path]/route.ts`
- `src/components/AuthProvider.tsx`
- `src/lib/require-server-user.ts`
- `src/lib/route-permissions.ts`
- `src/lib/server-auth.ts`
- `src/stores/auth-store.ts`
- `tests/auth-http.test.mjs`
- `tests/auth-store.test.mjs`

### admin-fe

- `package-lock.json`
- `package.json`
- `src/api/auth.ts`
- `src/app/(auth)/change-password/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/admin/layout.tsx`
- `src/app/coordinator/layout.tsx`
- `src/app/layout.tsx`
- `src/app/photographer/layout.tsx`
- `src/app/volunteer/layout.tsx`
- `src/components/OpsShell.tsx`
- `src/components/sections/Sidebar.tsx`
- `src/config/axios.ts`
- `src/dto/auth.dto.ts`
- `src/lib/roleStorage.ts`
- `src/proxy.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/backend/[...path]/route.ts`
- `src/components/AuthProvider.tsx`
- `src/components/RoleWorkspace.tsx`
- `src/lib/require-server-user.ts`
- `src/lib/route-permissions.ts`
- `src/lib/server-auth.ts`
- `src/stores/auth-store.ts`
- `tests/auth-http.test.mjs`
- `tests/auth-store.test.mjs`

### Com.FPTU.GFA26SE77.RaceDay.WebAPI

- `src/Modules/Iam/RaceDay.Modules.Iam.Api/IamModule.cs`
- `src/Modules/Iam/RaceDay.Modules.Iam.Api/RaceDay.Modules.Iam.Api.csproj`
- `src/Modules/Iam/RaceDay.Modules.Iam.Application/Users/UpdateMe/UpdateMyProfileCommand.cs`
- `src/Modules/Iam/RaceDay.Modules.Iam.Application/Users/UpdateUser/UpdateUserCommand.cs`
- `src/Shared/RaceDay.Shared.Web/DependencyInjection.cs`
- `tests/RaceDay.Modules.Iam.UnitTests/Application/LockUnlockUserCommandHandlerTests.cs`
- `tests/RaceDay.Modules.Iam.UnitTests/RaceDay.Modules.Iam.UnitTests.csproj`
- `src/Modules/Iam/RaceDay.Modules.Iam.Api/CurrentAccountValidation.cs`
- `tests/RaceDay.Modules.Iam.UnitTests/Application/CurrentAccountValidationTests.cs`
- `tests/RaceDay.Modules.Iam.UnitTests/Application/ProfileIdentityNumberTests.cs`
