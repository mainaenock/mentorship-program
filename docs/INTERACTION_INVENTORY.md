# Interaction inventory

| Surface        | Action                                     | Result / failure                                                               |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| Header/footer  | Brand, navigation, CTA                     | Real route, no placeholder hash links                                          |
| Mobile menu    | Open, Escape, close, choose page           | Radix dialog traps focus and restores trigger focus                            |
| Theme          | Toggle                                     | Persists preference in localStorage                                            |
| FAQ            | Search/topic/expand                        | Matching answers or clear empty state                                          |
| Stories        | Filter/read/close                          | Explicit illustrative detail, or no published stories                          |
| Pricing        | Get started                                | Carries selected plan identifier into registration                             |
| Contact        | Submit                                     | Browser validation, loading, offline error, demo reference; no actual delivery |
| Registration   | Create account, show/hide, legal links     | RHF/Zod errors, demo session, verification                                     |
| Login/logout   | Authenticate demonstration / clear session | Onboarding / login; demo only                                                  |
| Recovery/reset | Submit                                     | Non-enumerating generic response; demo-reset link validation                   |
| Verification   | Verify/resend/change contact               | Wrong-code error, 30-second cooldown, onboarding                               |
| Adult setup    | Continue/back/save/first goal              | Required fields, tab draft, future target date, shell                          |
| Minor setup    | Invite guardian                            | Restricted pending state; no self-consent activation                           |
| Guardian       | Identify/verify/choose/decline/withdraw    | Demo consent outcome; no minor activation                                      |
| Mentor         | Continue/back/save/add/remove reference    | Thirteen steps; safe draft stored in tab                                       |
| Mentor files   | Select/remove                              | MIME/size/count checks, memory only                                            |
| Mentor         | Review/submit/withdraw/status              | Demo reference and submitted state                                             |
| Privacy        | Save preferences                           | Versioned device preference; no analytics provider yet                         |
| PWA            | Offline/update                             | Static fallback; update action, no private caching                             |

All submission adapters surface network-offline errors. Native required/type/pattern constraints supplement Zod credential validation. Legal links are real documents. Optional Google, newsletter, social accounts, commercial payment, and production verification are disabled/unconfigured and are not rendered as fake controls.

Reusable interaction foundations: Radix dialogs/drawers, tabs, tooltip, dropdown, confirmation, search palette, pagination, native date/file/phone inputs, datalist combobox, checkbox, radio, switch, notification, toast, responsive table, timeline, empty/loading/error states.

Additional verified flows: mentor status → requested information → resubmit → under review; saved privacy preferences restore after reload; guardian affirmative choice → withdraw through service; selected plan appears in onboarding; optional interests are selectable; step changes focus the new heading. Server-rendered forms cannot be submitted before hydration. The update button waits for service-worker controller replacement before reloading.
