'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Notice } from '../shared/ui';
import { config } from '../shared/config';
import { auth, saveSession } from '../shared/demo-services';
import type { Role } from '../shared/contracts';
import { portalHome } from './permissions';
import { seedPaymentFixtures } from '../payments/demo-fixtures';
const roles: { role: Role; title: string; detail: string }[] = [
  { role: 'member', title: 'Member', detail: 'Create goals, learn and review your progress.' },
  { role: 'mentor', title: 'Mentor', detail: 'Review assigned fictional mentees and sessions.' },
  {
    role: 'guardian',
    title: 'Guardian',
    detail: 'Review fictional relationships and specific consent choices.',
  },
  {
    role: 'administrator',
    title: 'Administrator',
    detail: 'Review operations without finance or protected-case grants.',
  },
  { role: 'content_manager', title: 'Content manager', detail: 'Manage learning content and publication.' },
  {
    role: 'finance_officer',
    title: 'Finance officer',
    detail: 'Inspect fictional payment and ledger workflows.',
  },
  {
    role: 'safeguarding_officer',
    title: 'Safeguarding officer',
    detail: 'Review protected demonstration cases.',
  },
  { role: 'support', title: 'Support', detail: 'Review support cases and limited account information.' },
  {
    role: 'super_administrator',
    title: 'Super administrator',
    detail: 'Review all configuration and staff-governance screens in the demonstration.',
  },
];
interface DemoWorkspaceService {
  open(role: Role): Promise<string>;
}
export const demoWorkspaceService: DemoWorkspaceService = {
  async open(role) {
    if (!config.demo || !roles.some((item) => item.role === role))
      throw new Error('Demo workspaces are unavailable.');
    if (!navigator.onLine) throw new Error('Reconnect before opening a workspace.');
    await auth.logout();
    saveSession({
      id: `demo-workspace-${role}`,
      email: `${role}@example.test`,
      role,
      status: 'active',
      expiresAt: Date.now() + 3600000,
    });
    if (role === 'member') await seedPaymentFixtures();
    return portalHome(role);
  },
};
export function DemoEntry() {
  const router = useRouter();
  const [busy, setBusy] = useState<Role | null>(null);
  const [error, setError] = useState('');
  if (!config.demo) return <Notice>Demo workspaces are disabled.</Notice>;
  return (
    <div className="container page-content">
      <h1>Explore a demonstration workspace</h1>
      <Notice>
        These are fictional role fixtures, not production sign-in or real permissions. No messages, payments
        or consent decisions leave this browser tab. Choosing a role ends your current demonstration session.
      </Notice>
      {error && <Notice error>{error}</Notice>}
      <div className="portal-grid">
        {roles.map((item) => (
          <Card key={item.role}>
            <h2>{item.title}</h2>
            <p>{item.detail}</p>
            <Button
              loading={busy === item.role}
              disabled={!!busy}
              onClick={async () => {
                setBusy(item.role);
                setError('');
                try {
                  router.push(await demoWorkspaceService.open(item.role));
                } catch (e) {
                  setError((e as Error).message);
                  setBusy(null);
                }
              }}
            >
              Open {item.title} Demo
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
