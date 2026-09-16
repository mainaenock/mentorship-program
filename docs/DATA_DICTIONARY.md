# Data dictionary

Prompt 2 domain types are now defined in `domains/goals/contracts.ts`, `domains/learning/contracts.ts`, `domains/payments/contracts.ts`, `domains/mentorship/portal-contracts.ts`, `domains/account/service.ts`, `domains/guardian/portal-service.ts`, and `domains/administration/contracts.ts`.

New records include weighted milestones, recurrence definitions and occurrence outcomes (including the exact applied contribution for undo), evidence metadata, immutable evaluation snapshots, intervention responses, learning records, payment states and ledger entries, scoped mentor notes/messages/sessions, guardian relationship/consent audit events, and versioned administrative records/audit events. Demo storage keys are namespaced by account ID. No new private data is added to Cache Storage. Goal evaluation reflections are private; guardian response projections exclude them and mentor notes entirely.

New financial contracts use explicit integer minor units with a currency code. Learning Credits use an integer balance and signed ledger deltas. Current sample prices and events are expressly labelled demonstration fixtures, not approved commercial offers or real platform statistics.

| Entity              | Fields                                                                                                                            | Storage / handling                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Config              | product name, country, currency, locale, timezone, adultAge, flags, categories, plans                                             | `config.ts`; administration replaces seed configuration          |
| Session             | id, email, role, status, expiresAt                                                                                                | Demo sessionStorage; production HttpOnly cookie + server record  |
| AccountStatus       | unverified, onboarding, guardian_pending, activation_pending, active, suspended, mentor_pending                                   | Server authoritative in production                               |
| Credentials         | email, password                                                                                                                   | Password only in form memory; never persisted                    |
| Profile             | firstName, lastName, phone, country, region?, language                                                                            | Tab-scoped demo draft; minimal retention in production           |
| Age                 | date of birth; derived integer age                                                                                                | Age checked against exact birthday; future dates rejected        |
| Consent             | policy, version, granted, recordedAt                                                                                              | Interface for immutable production audit record                  |
| Guardian invitation | token, state, verified guardian relationship                                                                                      | Demo tokens only; production high-entropy, expiring, single-use  |
| GoalDraft           | title, measure, targetDate, action                                                                                                | Tab demo storage; owner-scoped backend in later work             |
| Mentor application  | identity/contact, background, expertise, age groups, languages, availability, timezone, capacity, references, files, declarations | Safe draft excludes identity/contact/references; files in memory |
| MentorStatus        | draft, submitted, under_review, more_information_required, approved, rejected, suspended                                          | Only reviewers may advance approval states                       |
| Support request     | contact details, subject, message, consent                                                                                        | Demo response only; no network delivery                          |
| Privacy preferences | analytics, version, timestamp                                                                                                     | Device localStorage; optional analytics defaults off             |
| Theme               | light/dark                                                                                                                        | Device localStorage                                              |

Money is an integer configured amount, displayed with KSh and Kenyan number formatting. Future financial APIs should use explicit minor units and currency codes. Dates use ISO values and central locale/timezone formatting. Production IDs must be unguessable and checked for ownership on every request.

Additional fields: `additionalInterests` stores optional selected category names in the demo onboarding draft; `selectedPlan` resolves only configured plan IDs; `membershipActivationRequired` prevents the setup flow from self-activating when activation is required. `gap-mentor-status` contains only a demo application reference and status. Configured impact metrics require a source URL and partners/social links start empty. No synthetic impact figures are published.

## Prompt 2 persistence details

New-goal drafts use an account-scoped draft key; edit drafts additionally include the goal ID and original optimistic version. Onboarding drafts migrate into the new-goal draft without inventing progress. Evaluation snapshots preserve progress, completed/missed action context and reflections at submission. Occurrences retain applied contribution for exact undo and refresh Upcoming/Due/Missed status against UTC dates in the demo.

Guardian session summaries contain only title, date, duration, status and oversight information. They and mentor summaries are removed from responses without active mentorship consent. Administrative financial source records are immutable; reversals append a compensating signed amount. The explicit member demonstration fixture is the only automatic source of sample payment and ledger records.

Production dates require an agreed account timezone, money requires integer minor units plus currency, and every stored ID requires server-side scope checks. No production persistence is implemented yet.
