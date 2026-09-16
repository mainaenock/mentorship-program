import { beforeEach, describe, expect, it } from 'vitest';
import { saveSession } from '../domains/shared/demo-services';
import { mentorshipPortal } from '../domains/mentorship/portal-service';
import { guardianPortal } from '../domains/guardian/portal-service';
import type { Role } from '../domains/shared/contracts';
function login(role: Role) {
  saveSession({
    id: `demo-${role}`,
    email: `${role}@example.test`,
    role,
    status: 'active',
    expiresAt: Date.now() + 60000,
  });
}
beforeEach(() => login('mentor'));
describe('mentorship and guardian scopes', () => {
  it('rejects unassigned mentees for reads, private notes and messages', async () => {
    expect((await mentorshipPortal.mentee('assigned-demo-member')).name).toBe('Demo Member');
    await expect(mentorshipPortal.mentee('unassigned')).rejects.toThrow('not assigned');
    await expect(mentorshipPortal.note('unassigned', 'Private note')).rejects.toThrow('not assigned');
    await expect(mentorshipPortal.send('unassigned', 'Hello there')).rejects.toThrow('not assigned');
  });
  it('requires member assignment acceptance before messaging and excludes mentor notes', async () => {
    await mentorshipPortal.note('assigned-demo-member', 'Private mentor reflection');
    login('member');
    expect((await mentorshipPortal.read()).notes).toEqual([]);
    await expect(mentorshipPortal.send('demo-member', 'Hello mentor')).rejects.toThrow('Accept');
    await mentorshipPortal.requestMentor({
      category: 'Technology',
      language: 'English',
      availability: 'Weekday evenings',
    });
    await mentorshipPortal.assignment('accept');
    expect((await mentorshipPortal.send('demo-member', 'Hello mentor')).messages).toHaveLength(1);
  });
  it('revokes dependent scopes and preserves the consent history', async () => {
    login('guardian');
    await expect(guardianPortal.child('unlinked')).rejects.toThrow('not linked');
    await expect(
      guardianPortal.consent('demo-relationship', 'participation', true, 'Approved scope'),
    ).rejects.toThrow('Accept');
    await guardianPortal.relationship(
      'demo-relationship',
      'accept',
      'I confirm the demonstration relationship',
    );
    await guardianPortal.consent('demo-relationship', 'participation', true, 'Participation approved');
    await guardianPortal.consent('demo-relationship', 'mentorship', true, 'Mentorship approved');
    expect((await guardianPortal.child('demo-relationship')).sessions).toHaveLength(1);
    const state = await guardianPortal.consent(
      'demo-relationship',
      'participation',
      false,
      'Withdraw participation',
    );
    expect(state.children[0].consents).toEqual({ participation: false, mentorship: false, learning: false });
    expect(state.children[0].sessions).toEqual([]);
    expect(state.children[0].mentorSummary).toBe('');
    expect(state.audit).toHaveLength(4);
    expect(JSON.stringify(state)).not.toContain('privateReflection');
    expect(JSON.stringify(state)).not.toContain('notes');
  });
});
