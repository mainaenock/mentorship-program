# Prompt 3 handoff

Prompt 2 implements the authenticated frontend on top of the existing Prompt 1 public website. Continue this repository; do not rebuild the public site or replace the role portals. Read the user's Prompt 3 before choosing backend infrastructure or expanding scope.

## What is implemented

- 106 registered portal routes across member, mentor, guardian and administration, with granular staff grants. See PORTAL_ROUTE_INVENTORY.md.
- Member dashboard, eleven-step SMART goal wizard, isolated new/edit drafts, weighted milestones, recurring actions and occurrence history, evidence metadata, evaluations with immutable snapshots, interventions, achievements and goal history.
- Learning catalog/detail/player, ten content types, authored demonstration lessons and quizzes, bookmarks, eligible purchases and certificates; Learning Credits, ledger, nine payment states, receipt and refund-request interfaces.
- Member mentorship, assigned-mentee mentor workspace, private notes, recommendations, evaluations, sessions, messaging, availability and compliance.
- Guardian linked-child projections, separate consent scopes, withdrawal history, permitted mentor/session summaries and concerns.
- Domain administration with permission checks, review commands, search/filter/sort/pagination, saved views, atomic bulk decisions, exports, audit trails, compensating credit adjustments, settings, reports, 18 overview metrics and an 11-stage funnel.
- Account/profile/security/preferences/privacy/support interfaces. Existing age-aware onboarding, invitation and mentor application flows are preserved.

## Start and review

Use `pnpm install --frozen-lockfile` when dependencies need installation. Run `pnpm dev`, then open `/demo` to select a fictional role. The login screen also links to this demonstration chooser. Normal registration starts with zero credits. Only the explicit member demo seeds all nine payment outcomes and a 150-credit balance; the 100-credit mini-course leaves 50 credits. Checkout never settles from a URL parameter.

Verification code: `123456`; reset token: `demo-reset`; guardian invitation: `demo-invitation` with expired/used fixtures also available. Data is scoped to the account in this browser tab. No real identity, payment, message or upload is processed.

## Adapter boundaries to preserve

Read API_CONTRACT.md and DATA_DICTIONARY.md, then replace typed adapters rather than moving domain rules into components. Main contracts live in goals/contracts.ts, learning/contracts.ts, payments/contracts.ts, mentorship/portal-contracts.ts, guardian/portal-service.ts, account/service.ts and administration/contracts.ts under domains/.

1. Implement server identity, secure sessions, expiry/revocation, role grants and owner/assigned-mentee/linked-child checks for every read and write. Frontend checks are demonstration UX only.
2. Persist goals with optimistic versions, idempotent occurrence transitions, immutable evaluations and auditable history. Preserve original draft versions to detect stale edits. Move recurrence calculations to an agreed account timezone; the demo uses UTC calendar dates.
3. Verify guardian identity and relationship independently. Store versioned consent history and enforce withdrawal immediately. Exclude journals, private mentor notes and full message bodies from guardian projections.
4. Implement Paystack through server-created intents, signature-verified webhooks and server reconciliation. Amounts use integer minor units. Grant credits/entitlements exactly once from verified settlement. Use append-only ledgers and compensating refunds/reversals; never trust redirect success.
5. Add approved content publication, eligibility rules, private media delivery, real upload validation/scanning, and certificate issuance. Demo downloads are plain-text artifacts; video/audio/PDF sources remain unconfigured and show explicit empty states.
6. Connect approved scheduling, safe messaging, notification delivery, moderation, support, protected casework, data requests and retention. Demo role stores are isolated and do not synchronize between accounts.
7. Replace fictional analytics cohorts with authoritative event queries. Recovery and learning engagement display unavailable states without an eligible denominator. Settings currently persist demonstration records and do not alter production infrastructure.

Disable demonstration entry/authentication before a production launch. Keep private data out of service-worker caches. Do not deploy automatically.

## Verification and runtime

See COMPLETION_AUDIT.md for current results and coverage limits. Commands: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test --maxWorkers=1`, `pnpm check:compat`, `pnpm build`.

For production E2E on Windows, start `pnpm start --port 4173` after building. Set `$env:PLAYWRIGHT_BASE_URL='http://localhost:4173'` and `$env:PLAYWRIGHT_CHANNEL='chrome'`, then run `pnpm test:e2e --workers=2`. Stop the built Worker before rebuilding to avoid Windows locks on dist. Browser startup can be slow; inspect existing sessions before restarting.

Regenerate route/control documentation with `node scripts/document-portal-inventory.mjs` after source formatting. The inventory records declaration/template coverage, not a separate browser assertion for every dynamic control instance.

No commits, deployment or outbound messages were made for Prompt 2.
