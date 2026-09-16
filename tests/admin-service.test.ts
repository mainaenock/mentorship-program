import { beforeEach, describe, expect, it } from 'vitest';
import { saveSession } from '../domains/shared/demo-services';
import { adminService } from '../domains/administration/demo-service';
import type { Role } from '../domains/shared/contracts';
function login(role: Role) {
  saveSession({
    id: 'staff-test',
    email: 'staff@example.test',
    role,
    status: 'active',
    expiresAt: Date.now() + 60000,
  });
}
beforeEach(() => login('administrator'));
describe('administrative workflow invariants', () => {
  it('keeps ordinary administrators out of finance and staff governance', async () => {
    await expect(adminService.list('payments')).rejects.toThrow('permission');
    await expect(adminService.list('staff')).rejects.toThrow('permission');
    expect((await adminService.list('applications')).length).toBeGreaterThan(0);
  });
  it('records review history and rejects incompatible bulk transitions atomically', async () => {
    const rows = await adminService.list('applications');
    await adminService.transition(
      'applications',
      [rows[0].id],
      'Approve',
      'Screening completed for this demo.',
    );
    await expect(
      adminService.transition(
        'applications',
        [rows[0].id, rows[1].id],
        'Reject',
        'Cannot approve this group.',
      ),
    ).rejects.toThrow('No records');
    expect((await adminService.get('applications', rows[1].id)).status).toBe('Submitted');
    expect((await adminService.audit('applications', rows[0].id))[0].action).toBe('Approve');
  });
  it('reverses a credit adjustment with a compensating record and preserves the original amount', async () => {
    login('finance_officer');
    const rows = await adminService.list('credits');
    const original = rows[0];
    await expect(
      adminService.save('credits', original.id, original.version, original.values),
    ).rejects.toThrow('cannot be edited');
    await adminService.transition(
      'credits',
      [original.id],
      'Reverse Adjustment',
      'Correct an erroneous demonstration entry.',
    );
    const after = await adminService.list('credits');
    expect(after.find((row) => row.id === original.id)?.values.delta).toBe(original.values.delta);
    expect(after).toHaveLength(rows.length + 1);
    expect(after.at(-1)?.values.delta).toBe(-Number(original.values.delta));
  });
});
