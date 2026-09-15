'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Compass, User, LogOut } from 'lucide-react';
import { auth, readSession } from '../shared/demo-services';
import { canEnter, type Session } from '../shared/contracts';
import { Button, Notice, Skeleton } from '../shared/ui';
import { roleLinks } from '../shared/navigation';
export function AuthenticatedShell() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const check = () => {
      const current = readSession();
      if (!current || current.expiresAt <= Date.now()) router.replace('/login?reason=expired');
      else if (!canEnter(current))
        router.replace(current.status === 'guardian_pending' ? '/onboarding' : '/account-status');
      else setSession(current);
    };
    check();
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, [router]);
  if (!session) return <Skeleton />;
  const links = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Explore', href: '/goals', icon: Compass },
    { name: 'Account', href: '/account-status', icon: User },
    ...roleLinks(session.role).map((link) => ({ ...link, icon: User })),
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <span className="eyebrow">{session.role}</span>
        <nav aria-label="Account navigation">
          {links.map((item) => (
            <Link href={item.href} key={item.name}>
              <item.icon size={19} />
              {item.name}
            </Link>
          ))}
        </nav>
        <Button
          variant="ghost"
          onClick={async () => {
            await auth.logout();
            router.push('/login');
          }}
        >
          <LogOut size={18} /> Log out
        </Button>
      </aside>
      <div className="app-main">
        <span className="eyebrow">YOUR JOURNEY</span>
        <h1>You’ve taken the first step.</h1>
        <Notice>
          Your demo setup is complete. The authenticated shell is ready for Prompt 2’s dashboards.
        </Notice>
        <p>
          Your goal draft is retained for this tab. Progress tracking, actions, learning, and mentorship
          dashboards are assigned to the next build prompt.
        </p>
        <Button
          variant="outline"
          onClick={async () => {
            await auth.logout();
            router.push('/login');
          }}
        >
          Log out
        </Button>
      </div>
      <nav className="bottom-nav" aria-label="Mobile account navigation">
        {links.map((item) => (
          <Link href={item.href} key={item.name}>
            <item.icon size={19} />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
export function AccountStatus() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => setSession(readSession()), []);
  return (
    <div className="form-page">
      <h1>Your account</h1>
      <Notice>{session ? `Status: ${session.status.replaceAll('_', ' ')}` : 'You are not signed in.'}</Notice>
      <Link
        className="button primary"
        href={
          !session
            ? '/login'
            : session.status === 'unverified'
              ? '/verify-email'
              : session.status === 'suspended'
                ? '/account-suspended'
                : session.status === 'activation_pending'
                  ? '/account-pending'
                  : session.status === 'mentor_pending'
                    ? '/mentor-pending'
                    : session.status === 'active'
                      ? '/dashboard'
                      : '/onboarding'
        }
      >
        Continue
      </Link>
      <p>
        <Link href="/contact">Get account support</Link>
      </p>
    </div>
  );
}
