import { canEnter, type Role, type Session } from '../shared/contracts';

export type Permission =
  | 'staff.workspace'
  | 'member.self'
  | 'mentor.assigned'
  | 'guardian.linked'
  | 'users.read'
  | 'users.manage'
  | 'staff.manage'
  | 'goals.review'
  | 'content.manage'
  | 'mentorship.manage'
  | 'finance.read'
  | 'finance.manage'
  | 'engagement.manage'
  | 'safety.manage'
  | 'privacy.manage'
  | 'audit.read'
  | 'support.manage'
  | 'reports.read'
  | 'settings.manage'
  | 'export';

const grants: Record<Role, readonly Permission[]> = {
  member: ['member.self'],
  minor: ['member.self'],
  mentor: ['mentor.assigned'],
  guardian: ['guardian.linked'],
  content_manager: ['staff.workspace', 'content.manage', 'reports.read', 'export'],
  finance_officer: ['staff.workspace', 'finance.read', 'finance.manage', 'reports.read', 'export'],
  safeguarding_officer: ['staff.workspace', 'safety.manage', 'privacy.manage', 'audit.read'],
  support: ['staff.workspace', 'support.manage', 'users.read'],
  administrator: [
    'staff.workspace',
    'users.read',
    'users.manage',
    'goals.review',
    'content.manage',
    'mentorship.manage',
    'engagement.manage',
    'support.manage',
    'reports.read',
    'export',
  ],
  super_administrator: [
    'staff.workspace',
    'users.read',
    'users.manage',
    'staff.manage',
    'goals.review',
    'content.manage',
    'mentorship.manage',
    'finance.read',
    'finance.manage',
    'engagement.manage',
    'safety.manage',
    'privacy.manage',
    'audit.read',
    'support.manage',
    'reports.read',
    'settings.manage',
    'export',
  ],
};

/** Demo UX policy. Production adapters must enforce equivalent grants on the server. */
export function hasPermission(session: Session | null, permission: Permission): boolean {
  return canEnter(session) && !!session && grants[session.role]?.includes(permission);
}
export function portalHome(role: Role): string {
  return role === 'member' || role === 'minor'
    ? '/app'
    : role === 'mentor'
      ? '/mentor'
      : role === 'guardian'
        ? '/guardian'
        : '/admin';
}
export function assertPermission(
  session: Session | null,
  permission: Permission,
): asserts session is Session {
  if (!hasPermission(session, permission))
    throw new Error('Your account does not have permission for this operation.');
}
export function assertMemberScope(session: Session, memberId: string, assignedIds: readonly string[] = []) {
  if (hasPermission(session, 'member.self') && session.id === memberId) return;
  if (hasPermission(session, 'mentor.assigned') && assignedIds.includes(memberId)) return;
  throw new Error('This member is outside your permitted scope.');
}
