'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readSession } from '../shared/demo-services';
import { canEnter, type Session } from '../shared/contracts';
import { Notice, Skeleton } from '../shared/ui';
import { portalHome } from '../portal/permissions';
export function AuthenticatedShell() {
  const router = useRouter();
  useEffect(() => {
    const current = readSession();
    if (!current || current.expiresAt <= Date.now()) router.replace('/login?reason=expired');
    else if (!canEnter(current))
      router.replace(current.status === 'guardian_pending' ? '/onboarding' : '/account-status');
    else router.replace(portalHome(current.role));
  }, [router]);
  return <Skeleton />;
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
