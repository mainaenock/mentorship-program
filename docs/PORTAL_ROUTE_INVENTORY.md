# Prompt 2 portal routes

Generated from the explicit route registry. Dynamic record routes also implement missing-record states. Client permissions are UX boundaries; backend adapters must enforce the same scope.

| Route                                  | Page                     | Group        | Required permission |
| -------------------------------------- | ------------------------ | ------------ | ------------------- |
| /app                                   | Home                     | Your journey | member.self         |
| /app/goals                             | Goals                    | Your journey | member.self         |
| /app/goals/new                         | Create New Goal          | Your journey | member.self         |
| /app/goals/[goalId]                    | Goal Overview            | Your journey | member.self         |
| /app/goals/[goalId]/edit               | Edit Goal                | Your journey | member.self         |
| /app/goals/[goalId]/plan               | Action Plan              | Your journey | member.self         |
| /app/goals/[goalId]/actions            | Actions                  | Your journey | member.self         |
| /app/goals/[goalId]/check-ins          | Check-ins                | Your journey | member.self         |
| /app/goals/[goalId]/evaluations        | Evaluations              | Your journey | member.self         |
| /app/goals/[goalId]/evidence           | Evidence                 | Your journey | member.self         |
| /app/goals/[goalId]/interventions      | Interventions            | Your journey | member.self         |
| /app/history                           | Goal History             | Your journey | member.self         |
| /app/achievements                      | Achievements             | Your journey | member.self         |
| /app/learning                          | Learn                    | Your journey | member.self         |
| /app/learning/[materialId]             | Learning Material        | Your journey | member.self         |
| /app/learning/[materialId]/learn       | Learning Player          | Your journey | member.self         |
| /app/my-learning                       | My Learning              | Your journey | member.self         |
| /app/credits                           | Learning Credits         | Your journey | member.self         |
| /app/credits/history                   | Credit History           | Your journey | member.self         |
| /app/payments                          | Payments                 | Your journey | member.self         |
| /app/mentor                            | Mentor                   | Your journey | member.self         |
| /app/mentor/sessions                   | Mentor Sessions          | Your journey | member.self         |
| /app/mentor/sessions/[sessionId]       | Session Details          | Your journey | member.self         |
| /app/messages                          | Messages                 | Your journey | member.self         |
| /app/notifications                     | Notifications            | Your journey | member.self         |
| /app/profile                           | Profile                  | Your journey | member.self         |
| /app/settings                          | Settings                 | Your journey | member.self         |
| /app/settings/security                 | Security                 | Your journey | member.self         |
| /app/settings/notifications            | Notification Preferences | Your journey | member.self         |
| /app/settings/privacy                  | Privacy                  | Your journey | member.self         |
| /app/help                              | Help                     | Your journey | member.self         |
| /app/support                           | Support                  | Your journey | member.self         |
| /mentor                                | Home                     | Mentorship   | mentor.assigned     |
| /mentor/mentees                        | Mentees                  | Mentorship   | mentor.assigned     |
| /mentor/mentees/[memberId]             | Mentee Workspace         | Mentorship   | mentor.assigned     |
| /mentor/attention                      | Needs Attention          | Mentorship   | mentor.assigned     |
| /mentor/evaluations                    | Evaluations              | Mentorship   | mentor.assigned     |
| /mentor/interventions                  | Interventions            | Mentorship   | mentor.assigned     |
| /mentor/sessions                       | Sessions                 | Mentorship   | mentor.assigned     |
| /mentor/sessions/[sessionId]           | Session Details          | Mentorship   | mentor.assigned     |
| /mentor/messages                       | Messages                 | Mentorship   | mentor.assigned     |
| /mentor/notes                          | Private Mentor Notes     | Mentorship   | mentor.assigned     |
| /mentor/resources                      | Resources                | Mentorship   | mentor.assigned     |
| /mentor/availability                   | Availability             | Mentorship   | mentor.assigned     |
| /mentor/reports                        | Reports                  | Mentorship   | mentor.assigned     |
| /mentor/profile                        | Profile                  | Mentorship   | mentor.assigned     |
| /mentor/compliance                     | Compliance               | Mentorship   | mentor.assigned     |
| /guardian                              | Home                     | Family       | guardian.linked     |
| /guardian/children                     | Children                 | Family       | guardian.linked     |
| /guardian/children/[relationshipId]    | Child Overview           | Family       | guardian.linked     |
| /guardian/consents                     | Consents                 | Family       | guardian.linked     |
| /guardian/mentorship                   | Mentorship               | Family       | guardian.linked     |
| /guardian/sessions                     | Sessions                 | Family       | guardian.linked     |
| /guardian/safety                       | Safety                   | Family       | guardian.linked     |
| /guardian/notifications                | Notifications            | Family       | guardian.linked     |
| /guardian/privacy                      | Privacy                  | Family       | guardian.linked     |
| /guardian/profile                      | Profile                  | Family       | guardian.linked     |
| /guardian/settings                     | Settings                 | Family       | guardian.linked     |
| /admin                                 | Overview                 | Overview     | staff.workspace     |
| /admin/reports                         | Reports                  | Overview     | reports.read        |
| /admin/users                           | Users                    | Users        | users.read          |
| /admin/users/members                   | Members                  | Users        | users.read          |
| /admin/users/guardians                 | Guardians                | Users        | users.read          |
| /admin/users/mentors                   | Mentors                  | Users        | users.read          |
| /admin/users/[userId]                  | User Details             | Users        | users.read          |
| /admin/users/staff                     | Staff                    | Users        | staff.manage        |
| /admin/goals                           | Goals                    | Goals        | goals.review        |
| /admin/goals/at-risk                   | At-risk Goals            | Goals        | goals.review        |
| /admin/goals/categories                | Goal Categories          | Goals        | goals.review        |
| /admin/goals/statistics                | Goal Statistics          | Goals        | goals.review        |
| /admin/learning                        | Learning                 | Learning     | content.manage      |
| /admin/learning/materials              | Materials                | Learning     | content.manage      |
| /admin/learning/materials/new          | Create Material          | Learning     | content.manage      |
| /admin/learning/materials/[materialId] | Material Editor          | Learning     | content.manage      |
| /admin/learning/categories             | Learning Categories      | Learning     | content.manage      |
| /admin/learning/purchases              | Learning Purchases       | Learning     | content.manage      |
| /admin/learning/analytics              | Learning Analytics       | Learning     | content.manage      |
| /admin/mentorship/applications         | Applications             | Mentorship   | mentorship.manage   |
| /admin/mentorship/mentors              | Mentors                  | Mentorship   | mentorship.manage   |
| /admin/mentorship/assignments          | Assignments              | Mentorship   | mentorship.manage   |
| /admin/mentorship/sessions             | Sessions                 | Mentorship   | mentorship.manage   |
| /admin/mentorship/flags                | Mentorship Flags         | Mentorship   | mentorship.manage   |
| /admin/mentorship/reports              | Mentorship Reports       | Mentorship   | mentorship.manage   |
| /admin/finance/payments                | Payments                 | Finance      | finance.read        |
| /admin/finance/credits                 | Learning Credits         | Finance      | finance.read        |
| /admin/finance/ledger                  | Ledger                   | Finance      | finance.read        |
| /admin/finance/refunds                 | Refunds                  | Finance      | finance.read        |
| /admin/finance/reconciliation          | Reconciliation           | Finance      | finance.read        |
| /admin/finance/revenue                 | Revenue                  | Finance      | finance.read        |
| /admin/engagement/notifications        | Notifications            | Engagement   | engagement.manage   |
| /admin/engagement/email                | Email                    | Engagement   | engagement.manage   |
| /admin/engagement/sms                  | SMS                      | Engagement   | engagement.manage   |
| /admin/engagement/announcements        | Announcements            | Engagement   | engagement.manage   |
| /admin/compliance/consents             | Consents                 | Compliance   | privacy.manage      |
| /admin/compliance/privacy              | Privacy Requests         | Compliance   | privacy.manage      |
| /admin/compliance/retention            | Retention                | Compliance   | privacy.manage      |
| /admin/compliance/safety               | Safety Reports           | Compliance   | safety.manage       |
| /admin/compliance/audit                | Audit Trail              | Compliance   | audit.read          |
| /admin/support                         | Support                  | Support      | support.manage      |
| /admin/settings                        | Settings                 | Settings     | settings.manage     |
| /admin/settings/pricing                | Pricing                  | Settings     | settings.manage     |
| /admin/settings/categories             | Categories               | Settings     | settings.manage     |
| /admin/settings/goals                  | Goal Rules               | Settings     | settings.manage     |
| /admin/settings/achievements           | Achievements             | Settings     | settings.manage     |
| /admin/settings/features               | Features                 | Settings     | settings.manage     |
| /admin/settings/platform               | Platform                 | Settings     | settings.manage     |

Additional integration routes: /dashboard redirects to the role home; /demo exposes explicitly fictional role fixtures only while config.demo is enabled.
