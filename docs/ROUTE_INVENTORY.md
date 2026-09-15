# Route inventory

| Route                                                                                                | Purpose / component                                                   | Access                    |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------- |
| `/`                                                                                                  | Complete marketing homepage                                           | Public                    |
| `/about`, `/how-it-works`, `/goals`, `/mentorship`, `/learning`, `/become-a-mentor`, `/help`         | Domain content and working CTAs                                       | Public                    |
| `/pricing`                                                                                           | Configured plans, credits, FAQ, refund link                           | Public                    |
| `/success-stories`                                                                                   | Category filter and illustrative expandable story                     | Public                    |
| `/faq`                                                                                               | Search, topic filter, native accessible accordions                    | Public                    |
| `/contact`                                                                                           | Validated contact form; explicit demo submission                      | Public                    |
| `/login`, `/register`                                                                                | RHF/Zod credentials, password visibility                              | Public demo               |
| `/forgot-password`, `/reset-password`                                                                | Non-enumerating recovery; demo-reset token                            | Public demo               |
| `/verify-email`, `/verify-phone`                                                                     | Code entry, resend cooldown, contact change                           | Demo session              |
| `/onboarding`                                                                                        | Age, consent, profile, interests, preferences, membership, first goal | Verified demo session     |
| `/guardian/invitation/[token]`                                                                       | Valid, expired, used, invalid; guardian identity/contact/consent      | Token demonstration       |
| `/mentor/application`                                                                                | Thirteen steps, safe draft, references, files, review                 | Public demo               |
| `/privacy`, `/terms`, `/safeguarding`, `/mentor-code-of-conduct`, `/refund-policy`, `/accessibility` | Versioned policy templates; review notice                             | Public                    |
| `/privacy-centre`                                                                                    | Optional consent choices, privacy request link                        | Public                    |
| `/learning/library`                                                                                  | Searchable empty published-resource state                             | Public                    |
| `/dashboard`                                                                                         | Shared shell only, no Prompt 2 dashboards                             | Active demo session       |
| `/account-status`                                                                                    | Account state and continuation                                        | Demo                      |
| `/account-pending`, `/account-suspended`, `/mentor-pending`                                          | Explicit restricted status explanation                                | Public state presentation |
| `/setup-saved`                                                                                       | Resume setup                                                          | Public state presentation |
| `/offline`, `/maintenance`, `/unauthorized`                                                          | Recovery states                                                       | Public                    |
| unknown route                                                                                        | `not-found.tsx`                                                       | Public                    |
| `/manifest.webmanifest`, `/robots.txt`                                                               | PWA and crawler metadata                                              | Public                    |

Global and route-level error boundaries and a loading boundary are implemented. `/offline.html` is the service worker's static network-failure fallback.

`/mentor/application/status/[id]` displays draft, submitted, under-review, more-information-required, approved, rejected, suspended, loading, error, and missing-record states. `/mentor/application/status/latest` shows the current tab's submitted reference. Named fixtures use `demo-draft`, `demo-submitted`, `demo-under-review`, `demo-more-information-required`, `demo-approved`, `demo-rejected`, and `demo-suspended`.
