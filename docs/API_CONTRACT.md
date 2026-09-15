# API contract — proposed production boundary

No production API is connected. Current typed interfaces live in `domains/shared/contracts.ts`; demo adapters never send messages or upload files. Backend work must implement these semantics without changing presentation components.

All production endpoints: HTTPS; JSON; server validation; request correlation ID; `Cache-Control: no-store` for identity/private data. Errors: `{ code, message, fieldErrors?, requestId }`. Mutations require CSRF protection where cookie-authenticated. Do not return stack traces or raw provider errors.

| Proposed endpoint                      | Input                                                           | Successful response / invariant                                    |
| -------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| POST `/api/auth/register`              | email, password, selectedPlan?                                  | opaque pending session; no credentials in response                 |
| POST `/api/auth/login`                 | email, password                                                 | secure cookie + session profile; rate limited                      |
| POST `/api/auth/logout`                | CSRF token                                                      | revoked session                                                    |
| POST `/api/auth/recover`               | email                                                           | identical generic response regardless of existence                 |
| POST `/api/auth/reset`                 | single-use token, password                                      | token consumed; session invalidation policy                        |
| POST `/api/auth/verify`                | channel, challengeId, code                                      | verified contact; server expiry and attempt limit                  |
| POST `/api/auth/resend`                | challengeId                                                     | generic acknowledgement; server cooldown                           |
| GET `/api/session`                     | cookie                                                          | id, roles, status, permissions; never private secrets              |
| PATCH `/api/onboarding`                | versioned step payload                                          | validated draft; age classification computed server-side           |
| POST `/api/guardian/invitations`       | minimal guardian contact, relationship                          | opaque reference; queued delivery                                  |
| GET `/api/guardian/invitations/:token` | unguessable token                                               | valid/expired/used/invalid; minimise disclosed child data          |
| POST `/api/guardian/consents`          | verified guardian identity, token, versioned specific choices   | audit event; guardian authorisation checked independently          |
| DELETE `/api/guardian/consents/:id`    | guardian session                                                | revoked scope; restricted access enforced immediately              |
| POST `/api/mentor/applications`        | validated application, private file references                  | id, submitted status; no self-approval                             |
| POST `/api/uploads/intents`            | kind, mime, size                                                | expiring private upload URL; verify content and scan before review |
| POST `/api/support`                    | name, email, phone?, subject, message, consent, Turnstile token | reference; real delivery only after backend acknowledgement        |
| GET `/api/public/config`               | locale                                                          | approved categories, plans, policies, verified content             |
| POST `/api/goals`                      | title, measure, targetDate, recurringAction                     | owner-scoped initial goal                                          |

Use idempotency keys for invitations, mentor submissions, consent changes and future payments. Use optimistic concurrency/versioning for saved drafts. Retain submitted evidence only under an approved schedule. Never place a database call inside a presentation component.

Mentor review continuation: `GET /api/mentor/applications/:id` returns `{ id, status, note }` only to the applicant or an authorised reviewer; `POST /api/mentor/applications/:id/information` accepts a validated response only while more information is requested. These map to `MentorService.status` and `provideInformation`. `GuardianService.withdraw` maps to the consent deletion endpoint above. UI tests use named demo fixture IDs, never production authority.
