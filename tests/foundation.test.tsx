import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ageAt, canEnter } from '../domains/shared/contracts';
import { auth, guardian, readSession, saveSession } from '../domains/shared/demo-services';
import { credentialsSchema } from '../domains/authentication/auth-form';
import { Button, Password, Modal, Skeleton, Notice } from '../domains/shared/ui';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
describe('age and permission boundaries', () => {
  it('uses birthdays rather than year alone', () => {
    expect(ageAt('2008-09-15', new Date('2026-09-14'))).toBe(17);
    expect(ageAt('2008-09-14', new Date('2026-09-14'))).toBe(18);
  });
  it('denies pending, missing and expired sessions', () => {
    expect(canEnter(null)).toBe(false);
    const session = {
      id: 'test',
      email: 'demo@example.test',
      role: 'minor' as const,
      status: 'guardian_pending' as const,
      expiresAt: Date.now() + 10000,
    };
    expect(canEnter(session)).toBe(false);
    expect(canEnter({ ...session, status: 'active', expiresAt: 1 })).toBe(false);
    expect(canEnter({ ...session, role: 'member', status: 'active' })).toBe(true);
  });
});
describe('demo contracts', () => {
  it('reverification cannot remove pending consent restrictions', async () => {
    const current = await auth.register('minor@example.test', 'private-password');
    saveSession({ ...current, role: 'minor', status: 'guardian_pending' });
    expect((await auth.verify('123456')).status).toBe('guardian_pending');
  });
  it('never persists a password and requires the verification code', async () => {
    await auth.register('demo@example.test', 'private-password');
    expect(sessionStorage.getItem('gap-demo-session')).not.toContain('private-password');
    await expect(auth.verify('000000')).rejects.toThrow('incorrect');
    expect((await auth.verify('123456')).status).toBe('onboarding');
    await auth.logout();
    expect(readSession()).toBeNull();
  });
  it('exposes invalid, expired and used invitation states', async () => {
    expect(await guardian.invitation('unknown')).toBe('invalid');
    expect(await guardian.invitation('expired')).toBe('expired');
    expect(await guardian.invitation('used')).toBe('used');
    expect(await guardian.invitation('demo-invitation')).toBe('valid');
  });
  it('does not activate a minor from demo consent', async () => {
    await auth.register('demo@example.test', 'private-password');
    await guardian.respond('demo-invitation', { participation: true });
    expect(readSession()?.status).toBe('unverified');
  });
  it('rejects invalid email and weak passwords', () => {
    expect(credentialsSchema.safeParse({ email: 'invalid', password: 'short' }).success).toBe(false);
    expect(
      credentialsSchema.safeParse({ email: 'demo@example.test', password: 'long-password' }).success,
    ).toBe(true);
  });
});
describe('accessible components', () => {
  it('toggles password visibility with an accessible name', () => {
    render(<Password />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });
  it('prevents repeated submissions while loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  it('opens a labelled dialog and closes it', () => {
    render(
      <Modal title="Confirm" trigger={<Button>Open</Button>}>
        Review your choice
      </Modal>,
    );
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog', { name: 'Confirm' })).toBeVisible();
    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('announces failure and loading states', () => {
    render(
      <>
        <Notice error>Failed to save</Notice>
        <Skeleton />
      </>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
  });
});
