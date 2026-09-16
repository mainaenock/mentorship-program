# Goal Achievement Platform — shared blueprint

## Scope and product journey

Prompt 1 provides the public website, accessible frontend foundation, authentication demonstrations, age-aware onboarding, guardian invitation and mentor application. Prompt 2 extends it with the authenticated member, mentor, guardian and administrator portals. Both phases use typed demonstration adapters; production backend integration belongs to later prompts. HANDOFF.md is the current Prompt 3 continuation contract.

The portal registry contains 106 routes. Domain modules now include goals, learning, payments, account, portal, administration and the mentorship/guardian portal adapters. Role shells share accessible components and the existing visual tokens. Local demonstration data is scoped by account; role stores do not synchronize. The backend must replace these stores with authoritative shared records and enforce the same permission boundaries server-side.

Discover → register → verify → age and consent → goal → plan → learn → action → evidence → mentorship → evaluate → adjust → achieve → next goal.

## Architecture

- `app/`: App Router entry points, metadata, boundaries, manifest, robots. The catch-all dispatches an explicit route allowlist and returns not-found for unknown paths.
- `domains/marketing/`: server-rendered homepage/content and interactive public features.
- `domains/authentication/`: form validation and demo authenticated shell.
- `domains/onboarding/`: resumable adult/minor wizard and initial SMART goal.
- `domains/guardian/`: independent invitation state and consent demonstration.
- `domains/mentorship/`: thirteen-step application and in-memory attachments.
- `domains/shared/`: semantic UI, component composites, configuration, service interfaces and demo implementations.
- `public/`: static icons and tightly scoped offline fallback.

Future domains: actions, evaluations, learning, credits, payments, administration, notifications, safeguarding, privacy, support. Add them when implementing their workflows rather than empty placeholder screens.

## Non-negotiable invariants

Passwords never enter browser persistence. Demo credentials are not authenticators. Demo sessions live in sessionStorage and cannot authorise production APIs. Guardians cannot be represented by a minor-controlled permission checkbox. Demo guardian consent never activates a minor. No prices, impact statistics, partners, or real testimonials are invented. No private or payment response enters the service worker cache.

## Backend replacement

Replace `demo-services.ts` with server-mediated implementations of the same interfaces. Validate input and permissions again on the server. Use HttpOnly/Secure/SameSite cookies, short-lived verification and invitation tokens, rate limits, Turnstile Siteverify, auditable consent, private object storage, and malware scanning. Never use client role flags as authority. No production database or authentication provider is connected in this phase.

## Delivery

Next.js 16 API surface on vinext/Workers, React 19, strict TypeScript, Tailwind 4, Radix, RHF/Zod, Lucide. Pnpm lockfile is authoritative. Use the current compatibility scan and Worker build before deployment. Vinext remains a beta dependency: passing its static compatibility report is not a production certification.

The final acceptance evidence is indexed in `COMPLETION_AUDIT.md`. Run browser checks against the built Worker as well as unit/component checks. Stop any running Worker that holds `dist` before a Windows rebuild. Keep hydration gating and the static offline asset rule when changing the shared shell.
