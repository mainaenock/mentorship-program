import type { Role, Session } from '../shared/contracts';
import { hasPermission, type Permission } from './permissions';

export interface PortalRoute {
  path: string;
  title: string;
  permission: Permission;
  group: string;
}
const entries = (
  prefix: string,
  permission: Permission,
  group: string,
  paths: readonly [string, string][],
): PortalRoute[] => paths.map(([path, title]) => ({ path: prefix + path, title, permission, group }));

export const portalRoutes: readonly PortalRoute[] = [
  ...entries('/app', 'member.self', 'Your journey', [
    ['', 'Home'],
    ['/goals', 'Goals'],
    ['/goals/new', 'Create New Goal'],
    ['/goals/[goalId]', 'Goal Overview'],
    ['/goals/[goalId]/edit', 'Edit Goal'],
    ['/goals/[goalId]/plan', 'Action Plan'],
    ['/goals/[goalId]/actions', 'Actions'],
    ['/goals/[goalId]/check-ins', 'Check-ins'],
    ['/goals/[goalId]/evaluations', 'Evaluations'],
    ['/goals/[goalId]/evidence', 'Evidence'],
    ['/goals/[goalId]/interventions', 'Interventions'],
    ['/history', 'Goal History'],
    ['/achievements', 'Achievements'],
    ['/learning', 'Learn'],
    ['/learning/[materialId]', 'Learning Material'],
    ['/learning/[materialId]/learn', 'Learning Player'],
    ['/my-learning', 'My Learning'],
    ['/credits', 'Learning Credits'],
    ['/credits/history', 'Credit History'],
    ['/payments', 'Payments'],
    ['/mentor', 'Mentor'],
    ['/mentor/sessions', 'Mentor Sessions'],
    ['/mentor/sessions/[sessionId]', 'Session Details'],
    ['/messages', 'Messages'],
    ['/notifications', 'Notifications'],
    ['/profile', 'Profile'],
    ['/settings', 'Settings'],
    ['/settings/security', 'Security'],
    ['/settings/notifications', 'Notification Preferences'],
    ['/settings/privacy', 'Privacy'],
    ['/help', 'Help'],
    ['/support', 'Support'],
  ]),
  ...entries('/mentor', 'mentor.assigned', 'Mentorship', [
    ['', 'Home'],
    ['/mentees', 'Mentees'],
    ['/mentees/[memberId]', 'Mentee Workspace'],
    ['/attention', 'Needs Attention'],
    ['/evaluations', 'Evaluations'],
    ['/interventions', 'Interventions'],
    ['/sessions', 'Sessions'],
    ['/sessions/[sessionId]', 'Session Details'],
    ['/messages', 'Messages'],
    ['/notes', 'Private Mentor Notes'],
    ['/resources', 'Resources'],
    ['/availability', 'Availability'],
    ['/reports', 'Reports'],
    ['/profile', 'Profile'],
    ['/compliance', 'Compliance'],
  ]),
  ...entries('/guardian', 'guardian.linked', 'Family', [
    ['', 'Home'],
    ['/children', 'Children'],
    ['/children/[relationshipId]', 'Child Overview'],
    ['/consents', 'Consents'],
    ['/mentorship', 'Mentorship'],
    ['/sessions', 'Sessions'],
    ['/safety', 'Safety'],
    ['/notifications', 'Notifications'],
    ['/privacy', 'Privacy'],
    ['/profile', 'Profile'],
    ['/settings', 'Settings'],
  ]),
  ...entries('/admin', 'staff.workspace', 'Overview', [['', 'Overview']]),
  ...entries('/admin', 'reports.read', 'Overview', [['/reports', 'Reports']]),
  ...entries('/admin/users', 'users.read', 'Users', [
    ['', 'Users'],
    ['/members', 'Members'],
    ['/guardians', 'Guardians'],
    ['/mentors', 'Mentors'],
    ['/[userId]', 'User Details'],
  ]),
  ...entries('/admin/users', 'staff.manage', 'Users', [['/staff', 'Staff']]),
  ...entries('/admin/goals', 'goals.review', 'Goals', [
    ['', 'Goals'],
    ['/at-risk', 'At-risk Goals'],
    ['/categories', 'Goal Categories'],
    ['/statistics', 'Goal Statistics'],
  ]),
  ...entries('/admin/learning', 'content.manage', 'Learning', [
    ['', 'Learning'],
    ['/materials', 'Materials'],
    ['/materials/new', 'Create Material'],
    ['/materials/[materialId]', 'Material Editor'],
    ['/categories', 'Learning Categories'],
    ['/purchases', 'Learning Purchases'],
    ['/analytics', 'Learning Analytics'],
  ]),
  ...entries('/admin/mentorship', 'mentorship.manage', 'Mentorship', [
    ['/applications', 'Applications'],
    ['/mentors', 'Mentors'],
    ['/assignments', 'Assignments'],
    ['/sessions', 'Sessions'],
    ['/flags', 'Mentorship Flags'],
    ['/reports', 'Mentorship Reports'],
  ]),
  ...entries('/admin/finance', 'finance.read', 'Finance', [
    ['/payments', 'Payments'],
    ['/credits', 'Learning Credits'],
    ['/ledger', 'Ledger'],
    ['/refunds', 'Refunds'],
    ['/reconciliation', 'Reconciliation'],
    ['/revenue', 'Revenue'],
  ]),
  ...entries('/admin/engagement', 'engagement.manage', 'Engagement', [
    ['/notifications', 'Notifications'],
    ['/email', 'Email'],
    ['/sms', 'SMS'],
    ['/announcements', 'Announcements'],
  ]),
  ...entries('/admin/compliance', 'privacy.manage', 'Compliance', [
    ['/consents', 'Consents'],
    ['/privacy', 'Privacy Requests'],
    ['/retention', 'Retention'],
  ]),
  ...entries('/admin/compliance', 'safety.manage', 'Compliance', [['/safety', 'Safety Reports']]),
  ...entries('/admin/compliance', 'audit.read', 'Compliance', [['/audit', 'Audit Trail']]),
  ...entries('/admin', 'support.manage', 'Support', [['/support', 'Support']]),
  ...entries('/admin/settings', 'settings.manage', 'Settings', [
    ['', 'Settings'],
    ['/pricing', 'Pricing'],
    ['/categories', 'Categories'],
    ['/goals', 'Goal Rules'],
    ['/achievements', 'Achievements'],
    ['/features', 'Features'],
    ['/platform', 'Platform'],
  ]),
];

export function matchPortalRoute(pathname: string): PortalRoute | undefined {
  const path = pathname.replace(/\/$/, '') || '/';
  const exact = portalRoutes.find((route) => route.path === path);
  if (exact) return exact;
  return portalRoutes.find((route) => {
    const pattern = route.path.split('/');
    const parts = path.split('/');
    return (
      pattern.length === parts.length &&
      pattern.every((part, i) => (part.startsWith('[') ? !!parts[i] : part === parts[i]))
    );
  });
}
export function visibleRoutes(session: Session): PortalRoute[] {
  return portalRoutes.filter(
    (route) => !route.path.includes('[') && hasPermission(session, route.permission),
  );
}
export interface NavItem {
  label: string;
  href: string;
}
export function primaryNavigation(role: Role): NavItem[] {
  const items: [string, string][] =
    role === 'member' || role === 'minor'
      ? [
          ['Home', '/app'],
          ['Goals', '/app/goals'],
          ['Learn', '/app/learning'],
          ['Mentor', '/app/mentor'],
          ['Profile', '/app/profile'],
        ]
      : role === 'mentor'
        ? [
            ['Home', '/mentor'],
            ['Mentees', '/mentor/mentees'],
            ['Sessions', '/mentor/sessions'],
            ['Messages', '/mentor/messages'],
            ['Profile', '/mentor/profile'],
          ]
        : role === 'guardian'
          ? [
              ['Home', '/guardian'],
              ['Children', '/guardian/children'],
              ['Sessions', '/guardian/sessions'],
              ['Safety', '/guardian/safety'],
              ['Profile', '/guardian/profile'],
            ]
          : [
              ['Overview', '/admin'],
              ['Users', '/admin/users'],
              ['Operations', '/admin/mentorship/assignments'],
              ['Alerts', '/admin/compliance/safety'],
            ];
  return items.map(([label, href]) => ({ label, href }));
}
