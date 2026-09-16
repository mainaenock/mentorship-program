# Permissions matrix

This matrix is a contract for future server authorisation. The frontend demo guard is a UX boundary, not a security control. No production restricted data is served here.

Prompt 2 implements active-session/expiry checks in `domains/portal/permissions.ts`, permission-filtered navigation and route checks, plus adapter-level guards for every domain operation. Members access their own records, mentors only assigned mentees, and guardians only linked relationships with explicit feature consent. Guardian projections remove goal, mentor and session summaries when the relevant consent is absent; private journals/notes/full messages are never included.

Ordinary administrators do not inherit finance, staff governance, safeguarding or privacy-case authority. Content, finance, safeguarding and support roles receive distinct grants; only the super-administrator receives the full registry. Financial operations, exports, protected cases and staff role changes require their specific permission. Bulk transitions validate all selected records before changing any record. API endpoints must repeat these checks; client storage is not trusted authorization.

| Role                 | Intended scope                                     | Required gate                                                        |
| -------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| Visitor              | Public pages, registration, mentor application     | Public                                                               |
| Adult member         | Own goals, actions, evidence, learning, mentorship | Verified, policies accepted, activated                               |
| Minor member         | Own age-appropriate participation                  | Independent guardian consent and feature-level eligibility           |
| Guardian             | Linked child's consent/oversight                   | Verified identity, confirmed relationship; no unrelated child access |
| Mentor               | Assigned mentees and approved sessions             | Application approved; safeguarding eligibility                       |
| Content manager      | Approved content workflow                          | Explicit content permission                                          |
| Finance officer      | Financial operations and reconciliation            | Explicit finance permission; no blanket child-data access            |
| Safeguarding officer | Assigned concerns and protected case workflow      | Restricted case permission and audit                                 |
| Support              | Support cases and limited account assistance       | Least privilege and audit                                            |
| Administrator        | Operational configuration/users within scope       | Explicit administrative grants                                       |
| Super administrator  | Privileged configuration and access governance     | Strong authentication, least privilege, full audit                   |

Missing, expired, unverified, consent-pending, activation-pending, suspended, and unapproved accounts must not receive restricted API responses. Recheck permissions server-side for every action; UI navigation is never sufficient. Consent withdrawal must revoke affected access without waiting for a UI refresh.

The shared shell adds role-specific informational links through `domains/shared/navigation.ts`: guardian/minor safeguarding, mentor application status, and staff support. It does not expose invented administration or guardian dashboards. Reverification preserves existing pending/suspended state rather than resetting it to onboarding. Suspended/activation-pending/mentor-pending users are routed to their explicit explanation instead of an onboarding loop.
