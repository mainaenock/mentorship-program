import { describe, expect, it } from 'vitest';
import type { Role, Session } from '../domains/shared/contracts';
import { assertMemberScope, hasPermission } from '../domains/portal/permissions';
import { matchPortalRoute, portalRoutes, primaryNavigation, visibleRoutes } from '../domains/portal/routes';
const session = (role: Role): Session => ({
  id: 'member-1',
  email: 'fixture@example.test',
  role,
  status: 'active',
  expiresAt: Date.now() + 60000,
});
describe('portal boundaries', () => {
  it('keeps finance, staff governance and private cases out of ordinary administration', () => {
    expect(hasPermission(session('administrator'), 'finance.manage')).toBe(false);
    expect(hasPermission(session('administrator'), 'staff.manage')).toBe(false);
    expect(hasPermission(session('administrator'), 'safety.manage')).toBe(false);
    expect(hasPermission(session('finance_officer'), 'finance.manage')).toBe(true);
    expect(
      visibleRoutes(session('finance_officer')).every((route) => !route.path.startsWith('/admin/users')),
    ).toBe(true);
  });
  it('denies missing, expired and suspended sessions', () => {
    expect(hasPermission(null, 'member.self')).toBe(false);
    expect(hasPermission({ ...session('super_administrator'), status: 'suspended' }, 'staff.manage')).toBe(
      false,
    );
    expect(hasPermission({ ...session('member'), expiresAt: 0 }, 'member.self')).toBe(false);
  });
  it('enforces own or assigned member scope, without guardian access to raw member records', () => {
    expect(() => assertMemberScope(session('member'), 'member-1')).not.toThrow();
    expect(() => assertMemberScope(session('member'), 'member-2')).toThrow('scope');
    expect(() => assertMemberScope(session('mentor'), 'member-2', ['member-2'])).not.toThrow();
    expect(() => assertMemberScope(session('mentor'), 'member-3', ['member-2'])).toThrow('scope');
    expect(() => assertMemberScope(session('guardian'), 'member-1')).toThrow('scope');
  });
  it('prioritizes literal new and staff routes over record identifiers', () => {
    expect(matchPortalRoute('/app/goals/new')?.title).toBe('Create New Goal');
    expect(matchPortalRoute('/admin/users/staff')?.permission).toBe('staff.manage');
    expect(matchPortalRoute('/app/goals/example/plan')?.title).toBe('Action Plan');
    expect(matchPortalRoute('/app/goals/example/unknown')).toBeUndefined();
    expect(new Set(portalRoutes.map((route) => route.path)).size).toBe(portalRoutes.length);
  });
  it('preserves the specified mobile destinations for members, mentors and guardians', () => {
    expect(primaryNavigation('member').map((item) => item.label)).toEqual([
      'Home',
      'Goals',
      'Learn',
      'Mentor',
      'Profile',
    ]);
    expect(primaryNavigation('mentor').map((item) => item.label)).toEqual([
      'Home',
      'Mentees',
      'Sessions',
      'Messages',
      'Profile',
    ]);
    expect(primaryNavigation('guardian').map((item) => item.label)).toEqual([
      'Home',
      'Children',
      'Sessions',
      'Safety',
      'Profile',
    ]);
  });
});
