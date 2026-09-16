import type { AdminField, AdminSchema, AdminTransition } from './contracts';
import type { Permission } from '../portal/permissions';
const text = (key: string, label: string, required = true): AdminField => ({
  key,
  label,
  kind: 'text',
  required,
});
const note: AdminField = { key: 'description', label: 'Description', kind: 'textarea', required: true };
const choice = (key: string, label: string, options: string[]): AdminField => ({
  key,
  label,
  kind: 'select',
  options,
  required: true,
});
const transition = (
  command: AdminTransition['command'],
  from: string[],
  to: string,
  permission: Permission,
  consequence: string,
  fields?: AdminField[],
): AdminTransition => ({ command, from, to, permission, consequence, fields });
const contentTransitions: AdminTransition[] = [
  transition(
    'Publish',
    ['Draft', 'Unpublished'],
    'Published',
    'content.manage',
    'The material becomes available in the publication workflow. Production publication must validate media access and commercial terms.',
  ),
  transition(
    'Unpublish',
    ['Published'],
    'Unpublished',
    'content.manage',
    'The material is removed from new discovery. Existing purchase rights must be preserved.',
  ),
  transition(
    'Archive',
    ['Draft', 'Unpublished'],
    'Archived',
    'content.manage',
    'This record becomes read-only and remains in the audit history.',
  ),
];
const cases = (permission: Permission): AdminTransition[] => [
  transition(
    'Escalate',
    ['Open'],
    'Escalated',
    permission,
    'The case is escalated for specialist review. No external communication is sent by the demo.',
  ),
  transition(
    'Resolve',
    ['Open', 'Escalated'],
    'Resolved',
    permission,
    'Record the resolution and retain the case history.',
  ),
];
export const adminSchemas: Record<string, AdminSchema> = {
  users: {
    id: 'users',
    title: 'Users',
    permission: 'users.read',
    editPermission: 'users.manage',
    fields: [
      text('title', 'Display name'),
      text('email', 'Email'),
      choice('role', 'Role', ['member', 'minor', 'guardian', 'mentor']),
      note,
    ],
    initialStatus: 'Active',
    canCreate: true,
    transitions: [
      transition(
        'Suspend',
        ['Active'],
        'Suspended',
        'users.manage',
        'Restricted access is suspended. Production APIs must revoke active permissions and sessions.',
      ),
      transition(
        'Reactivate',
        ['Suspended'],
        'Active',
        'users.manage',
        'Restore access only after eligibility and review requirements are met.',
      ),
    ],
  },
  staff: {
    id: 'staff',
    title: 'Staff',
    permission: 'staff.manage',
    editPermission: 'staff.manage',
    fields: [
      text('title', 'Staff name'),
      text('email', 'Email'),
      choice('role', 'Staff role', [
        'content_manager',
        'finance_officer',
        'safeguarding_officer',
        'support',
        'administrator',
      ]),
      note,
    ],
    initialStatus: 'Active',
    canCreate: true,
    transitions: [
      transition(
        'Suspend',
        ['Active'],
        'Suspended',
        'staff.manage',
        'Suspend this staff account and its grants.',
      ),
      transition(
        'Reactivate',
        ['Suspended'],
        'Active',
        'staff.manage',
        'Restore only the assigned staff role; no super administrator grant is created.',
      ),
    ],
  },
  goals: {
    id: 'goals',
    title: 'Goals',
    permission: 'goals.review',
    editPermission: 'goals.review',
    fields: [
      text('title', 'Goal title'),
      text('owner', 'Member reference'),
      choice('risk', 'Risk level', ['On Track', 'Needs Attention', 'At Risk']),
      { key: 'progress', label: 'Progress percentage', kind: 'number', required: true },
      note,
    ],
    initialStatus: 'Active',
    canCreate: false,
    transitions: [
      transition(
        'Escalate',
        ['Active'],
        'Review requested',
        'goals.review',
        'Request a mentor or specialist review; do not overwrite the member’s plan.',
      ),
    ],
  },
  categories: {
    id: 'categories',
    title: 'Goal Categories',
    permission: 'goals.review',
    editPermission: 'goals.review',
    fields: [text('title', 'Category name'), note],
    initialStatus: 'Active',
    canCreate: true,
    transitions: [
      transition(
        'Archive',
        ['Active'],
        'Archived',
        'goals.review',
        'Stop offering this category for new goals. Existing goals retain their category history.',
      ),
    ],
  },
  materials: {
    id: 'materials',
    title: 'Learning Materials',
    permission: 'content.manage',
    editPermission: 'content.manage',
    fields: [
      text('title', 'Material title'),
      note,
      text('author', 'Author'),
      choice('type', 'Material type', [
        'Article',
        'PDF',
        'Video',
        'Audio',
        'Worksheet',
        'Template',
        'Quiz',
        'Mini-course',
        'Assessment',
        'External resource',
      ]),
      text('category', 'Category'),
      text('sourceUrl', 'Approved source URL', false),
      { key: 'priceMinor', label: 'Price in minor currency units', kind: 'number', required: true },
      { key: 'downloadAllowed', label: 'Allow download', kind: 'boolean' },
    ],
    initialStatus: 'Draft',
    canCreate: true,
    transitions: contentTransitions,
  },
  learningCategories: {
    id: 'learningCategories',
    title: 'Learning Categories',
    permission: 'content.manage',
    editPermission: 'content.manage',
    fields: [text('title', 'Category name'), note],
    initialStatus: 'Draft',
    canCreate: true,
    transitions: contentTransitions,
  },
  applications: {
    id: 'applications',
    title: 'Mentor Applications',
    permission: 'mentorship.manage',
    editPermission: 'mentorship.manage',
    fields: [text('title', 'Applicant name'), text('expertise', 'Expertise'), note],
    initialStatus: 'Submitted',
    canCreate: false,
    transitions: [
      transition(
        'Approve',
        ['Submitted', 'More information requested'],
        'Approved',
        'mentorship.manage',
        'Record approval after safeguarding checks. Production role activation is a separate server-controlled decision.',
      ),
      transition(
        'Reject',
        ['Submitted', 'More information requested'],
        'Rejected',
        'mentorship.manage',
        'Record the review reason and preserve the application history.',
      ),
      transition(
        'Request More Information',
        ['Submitted'],
        'More information requested',
        'mentorship.manage',
        'Record the specific additional information required.',
      ),
    ],
  },
  mentors: {
    id: 'mentors',
    title: 'Mentors',
    permission: 'mentorship.manage',
    editPermission: 'mentorship.manage',
    fields: [
      text('title', 'Mentor name'),
      text('expertise', 'Expertise'),
      { key: 'capacity', label: 'Mentee capacity', kind: 'number', required: true },
      note,
    ],
    initialStatus: 'Active',
    canCreate: false,
    transitions: [
      transition(
        'Suspend',
        ['Active'],
        'Suspended',
        'mentorship.manage',
        'Suspend mentoring and route existing assignments for review.',
      ),
      transition(
        'Reactivate',
        ['Suspended'],
        'Active',
        'mentorship.manage',
        'Restore eligibility after compliance review.',
      ),
    ],
  },
  assignments: {
    id: 'assignments',
    title: 'Assignments',
    permission: 'mentorship.manage',
    editPermission: 'mentorship.manage',
    fields: [
      text('title', 'Assignment title'),
      text('memberId', 'Member reference'),
      text('mentorId', 'Mentor reference', false),
      note,
    ],
    initialStatus: 'Unassigned',
    canCreate: true,
    transitions: [
      transition(
        'Assign Mentor',
        ['Unassigned'],
        'Assigned',
        'mentorship.manage',
        'Assign the selected eligible mentor. Production capacity, conflict and minor-consent checks must pass.',
        [text('mentorId', 'Mentor reference')],
      ),
      transition(
        'Reassign Mentor',
        ['Assigned'],
        'Assigned',
        'mentorship.manage',
        'Replace the assignment while retaining the prior assignment audit.',
        [text('mentorId', 'New mentor reference')],
      ),
    ],
  },
  sessions: {
    id: 'sessions',
    title: 'Sessions',
    permission: 'mentorship.manage',
    editPermission: 'mentorship.manage',
    fields: [
      text('title', 'Session title'),
      text('memberId', 'Member reference'),
      text('mentorId', 'Mentor reference'),
      { key: 'date', label: 'Session date', kind: 'date', required: true },
      note,
    ],
    initialStatus: 'Scheduled',
    canCreate: true,
    transitions: [
      transition(
        'Escalate',
        ['Scheduled'],
        'Review requested',
        'mentorship.manage',
        'Request an operational session review.',
      ),
    ],
  },
  payments: {
    id: 'payments',
    title: 'Payments',
    permission: 'finance.read',
    editPermission: 'finance.manage',
    fields: [
      text('title', 'Payment reference'),
      { key: 'amountMinor', label: 'Amount in minor currency units', kind: 'number', required: true },
      text('currency', 'Currency'),
      note,
    ],
    initialStatus: 'Pending',
    canCreate: false,
    transitions: [
      transition(
        'Reconcile',
        ['Successful', 'Pending'],
        'Reconciled',
        'finance.manage',
        'Match a trusted provider settlement reference. A browser redirect is not settlement evidence.',
        [text('providerReference', 'Verified provider reference')],
      ),
      transition(
        'Refund',
        ['Successful', 'Reconciled'],
        'Refund requested',
        'finance.manage',
        'Create an auditable refund review request. No real funds move in the demonstration.',
      ),
    ],
  },
  credits: {
    id: 'credits',
    title: 'Credit Adjustments',
    permission: 'finance.read',
    editPermission: 'finance.manage',
    fields: [
      text('title', 'Adjustment reference'),
      text('owner', 'Member reference'),
      { key: 'delta', label: 'Credit adjustment', kind: 'number', required: true },
      note,
    ],
    initialStatus: 'Recorded',
    canCreate: true,
    transitions: [
      transition(
        'Reverse Adjustment',
        ['Recorded'],
        'Reversed',
        'finance.manage',
        'Record a compensating reversal. Never delete or rewrite the original ledger entry.',
      ),
    ],
  },
  refunds: {
    id: 'refunds',
    title: 'Refund Requests',
    permission: 'finance.read',
    editPermission: 'finance.manage',
    fields: [
      text('title', 'Payment reference'),
      { key: 'amountMinor', label: 'Requested amount in minor units', kind: 'number', required: true },
      note,
    ],
    initialStatus: 'Requested',
    canCreate: false,
    transitions: [
      transition(
        'Approve',
        ['Requested'],
        'Approved',
        'finance.manage',
        'Approve the request for backend refund processing; provider confirmation is still required.',
      ),
      transition(
        'Reject',
        ['Requested'],
        'Rejected',
        'finance.manage',
        'Retain the reason and provide an appeal route.',
      ),
    ],
  },
  engagement: {
    id: 'engagement',
    title: 'Communications',
    permission: 'engagement.manage',
    editPermission: 'engagement.manage',
    fields: [
      text('title', 'Subject'),
      choice('channel', 'Channel', ['In-app', 'Email', 'SMS', 'Announcement']),
      text('audience', 'Permission-scoped audience'),
      note,
    ],
    initialStatus: 'Draft',
    canCreate: true,
    transitions: [
      transition(
        'Send Notification',
        ['Draft'],
        'Queued',
        'engagement.manage',
        'Queue the approved communication. Consent and delivery suppression must be checked by the backend. No message is sent from this demo.',
      ),
      transition(
        'Archive',
        ['Draft', 'Queued'],
        'Archived',
        'engagement.manage',
        'Archive this communication record.',
      ),
    ],
  },
  safety: {
    id: 'safety',
    title: 'Safety Reports',
    permission: 'safety.manage',
    editPermission: 'safety.manage',
    fields: [
      text('title', 'Case title'),
      choice('severity', 'Severity', ['Low', 'Medium', 'High', 'Urgent']),
      note,
    ],
    initialStatus: 'Open',
    canCreate: true,
    transitions: cases('safety.manage'),
  },
  privacy: {
    id: 'privacy',
    title: 'Privacy Requests',
    permission: 'privacy.manage',
    editPermission: 'privacy.manage',
    fields: [
      text('title', 'Request reference'),
      choice('kind', 'Request type', ['Access', 'Correction', 'Deletion', 'Consent review']),
      note,
    ],
    initialStatus: 'Open',
    canCreate: true,
    transitions: cases('privacy.manage'),
  },
  retention: {
    id: 'retention',
    title: 'Retention Rules',
    permission: 'privacy.manage',
    editPermission: 'privacy.manage',
    fields: [
      text('title', 'Record category'),
      { key: 'days', label: 'Retention days', kind: 'number', required: true },
      note,
    ],
    initialStatus: 'Draft',
    canCreate: true,
    transitions: [
      transition(
        'Approve',
        ['Draft'],
        'Approved',
        'privacy.manage',
        'Approve a retention rule. Legal holds and deletion execution remain backend-controlled.',
      ),
    ],
  },
  support: {
    id: 'support',
    title: 'Support Tickets',
    permission: 'support.manage',
    editPermission: 'support.manage',
    fields: [text('title', 'Ticket subject'), text('owner', 'Account reference'), note],
    initialStatus: 'Open',
    canCreate: true,
    transitions: cases('support.manage'),
  },
  settings: {
    id: 'settings',
    title: 'Platform Settings',
    permission: 'settings.manage',
    editPermission: 'settings.manage',
    fields: [
      text('title', 'Setting name'),
      choice('group', 'Settings section', [
        'pricing',
        'categories',
        'goals',
        'achievements',
        'features',
        'platform',
      ]),
      text('value', 'Configured value'),
      note,
    ],
    initialStatus: 'Active',
    canCreate: true,
    transitions: [],
  },
  purchases: {
    id: 'purchases',
    title: 'Learning Purchases',
    permission: 'content.manage',
    editPermission: 'finance.manage',
    immutable: true,
    canCreate: false,
    initialStatus: 'Completed',
    fields: [
      text('title', 'Purchase reference'),
      text('materialId', 'Material reference'),
      text('owner', 'Member reference'),
      { key: 'amountMinor', label: 'Amount in minor units', kind: 'number', required: true },
      note,
    ],
    transitions: [],
  },
  consents: {
    id: 'consents',
    title: 'Consent Records',
    permission: 'privacy.manage',
    editPermission: 'privacy.manage',
    immutable: true,
    canCreate: false,
    initialStatus: 'Recorded',
    fields: [
      text('title', 'Consent reference'),
      text('scope', 'Specific scope'),
      text('version', 'Policy version'),
      text('decision', 'Recorded decision'),
      note,
    ],
    transitions: [
      transition(
        'Escalate',
        ['Recorded'],
        'Review requested',
        'privacy.manage',
        'Request a consent review. Preserve the original scope, decision and policy version.',
      ),
    ],
  },
  mentorFlags: {
    id: 'mentorFlags',
    title: 'Mentorship Flags',
    permission: 'mentorship.manage',
    editPermission: 'mentorship.manage',
    canCreate: true,
    initialStatus: 'Open',
    fields: [text('title', 'Operational flag'), text('mentorId', 'Mentor reference'), note],
    transitions: cases('mentorship.manage'),
  },
};
adminSchemas.payments.immutable = true;
adminSchemas.credits.immutable = true;
adminSchemas.refunds.immutable = true;
export function schemaForRoute(path: string): string {
  if (path.startsWith('/admin/settings')) return 'settings';
  if (path.includes('/learning/purchases')) return 'purchases';
  if (path.includes('/compliance/consents')) return 'consents';
  if (path.includes('/mentorship/flags')) return 'mentorFlags';
  if (path.includes('/users/staff')) return 'staff';
  if (path.includes('/users')) return 'users';
  if (path.includes('/goals/categories')) return 'categories';
  if (path.includes('/goals')) return 'goals';
  if (path.includes('/learning/categories')) return 'learningCategories';
  if (path.includes('/learning')) return 'materials';
  if (path.includes('/mentorship/applications')) return 'applications';
  if (path.includes('/mentorship/assignments')) return 'assignments';
  if (path.includes('/mentorship/sessions')) return 'sessions';
  if (path.includes('/mentorship/flags')) return 'safety';
  if (path.includes('/mentorship')) return 'mentors';
  if (path.includes('/finance/credits') || path.includes('/finance/ledger')) return 'credits';
  if (path.includes('/finance/refunds')) return 'refunds';
  if (path.includes('/finance')) return 'payments';
  if (path.includes('/engagement')) return 'engagement';
  if (path.includes('/compliance/safety')) return 'safety';
  if (path.includes('/compliance/retention')) return 'retention';
  if (path.includes('/compliance')) return 'privacy';
  if (path.includes('/support')) return 'support';
  return 'settings';
}
