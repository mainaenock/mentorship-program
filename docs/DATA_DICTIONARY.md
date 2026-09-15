# Data dictionary

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
