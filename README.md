# Goal Achievement Platform

Prompt 1 frontend foundation for a goal achievement and mentorship platform. Next.js 16 App Router APIs, React, strict TypeScript, Tailwind, Radix and vinext on Cloudflare Workers.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm check:compat
```

Open http://localhost:3000. Install the Playwright browser with `pnpm exec playwright install chromium` if required. `pnpm start` runs the built Worker locally; `pnpm deploy` publishes it only after production readiness review and explicit deployment intent.

**The current services are explicit development demonstrations.** No real account is created, verification sent, payment collected, consent granted, application delivered, or file uploaded. Use fictional details. Verification code: `123456`; reset token: `demo-reset`; invitation: `/guardian/invitation/demo-invitation`.

Start continuation work at [docs/HANDOFF.md](docs/HANDOFF.md). Product configuration is in `domains/shared/config.ts`; contracts and demo services are adjacent. The `/dashboard` route is a shared shell for Prompt 2, not a completed dashboard.
