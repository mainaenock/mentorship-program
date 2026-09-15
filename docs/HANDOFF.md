# Handoff — Prompt 1

## Starting point for Prompt 2

Read all nine shared documents, inspect git status, install with `pnpm install --frozen-lockfile`, and run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, and `pnpm check:compat`. Implement authenticated dashboards in dedicated domain routes/layouts; replace the explanatory shell in `domains/authentication/shell.tsx`. Reuse the existing visual tokens, responsive navigation, forms, service interfaces and cards. Do not recreate the public website.

## Completed surfaces

See ROUTE_INVENTORY for every route and INTERACTION_INVENTORY for control behaviour. `ui.tsx` contains basic components; `composites.tsx` contains metric/circular progress, radio/switch/combobox, confirmation, search, table, pagination, timeline, notification and toast components. Public/authenticated navigation is in domain-specific components. All domain data access currently uses demo interfaces.

## Mock adapters

`domains/shared/demo-services.ts`: auth, support, guardian, mentors. Known demo codes: verification `123456`; reset query token `demo-reset`; guardian token `demo-invitation`, plus `expired` and `used`. Use fictional data. All data is tab-local or in memory. No message or identity file is transmitted.

## Limitations and production prerequisites

- Production identity/session management, independent guardian checks, immutable consent audit and server authorisation remain backend work.
- Contact needs Turnstile and delivery. File selection needs signed private upload, MIME inspection, malware scanning and reviewer ACLs.
- Mentor review states and more-information requests are implemented as frontend fixtures. Reviewer-only production transitions require the backend workflow; demo approval never grants permissions.
- Policy content, company/contact information, pricing and real stories await approval. No social/newsletter provider is configured.
- Native date/datalist controls vary by browser. Full assistive-technology and cross-browser certification is not claimed.
- Optional Storybook deferred. See DECISIONS.
- Vinext is beta. Compatibility scan is positive for this app, but monitor upstream releases and repeat Worker runtime tests.

## Validation results

In progress; final command outcomes will be appended before handoff.

For production-runtime E2E checks on Windows, run `pnpm start --port 4173` in a separate terminal after building. In the test terminal set `$env:PLAYWRIGHT_BASE_URL='http://localhost:4173'` and, if using installed Chrome, `$env:PLAYWRIGHT_CHANNEL='chrome'`, then run `pnpm test:e2e`. Unset these variables to use the normal development-server/Playwright-Chromium configuration. Stop the built Worker before rebuilding to avoid a Windows file lock on `dist`.

## Baseline

Repository was empty apart from README. No existing tests or pre-existing failures. No commits, deployment, real account creation or outbound messages were performed.
