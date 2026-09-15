# Permissions matrix

This matrix is a contract for future server authorisation. The frontend demo guard is a UX boundary, not a security control. No production restricted data is served here.

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
