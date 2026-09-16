import { notFound } from 'next/navigation';
import { PortalShell } from '../../../domains/portal/shell';
import { GoalCollection, GoalDetails } from '../../../domains/goals/screens';
import { GoalWizard } from '../../../domains/goals/wizard';
import { Learning } from '../../../domains/learning/screens';
import { Payments } from '../../../domains/payments/screens';
import { AccountPage } from '../../../domains/account/screens';
import { MentorshipPage } from '../../../domains/mentorship/portal-screens';
import { Achievements } from '../../../domains/goals/achievements';
import { MemberDashboard } from '../../../domains/portal/member-dashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your workspace', robots: { index: false, follow: false } };
export default async function MemberPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path: segments = [] } = await params;
  const path = `/app${segments.length ? `/${segments.join('/')}` : ''}`;
  let content;
  if (!segments.length) content = <MemberDashboard />;
  else if (segments.join('/') === 'achievements') content = <Achievements />;
  else if (
    segments[0] === 'mentor' &&
    (segments.length === 1 || (segments[1] === 'sessions' && segments.length <= 3))
  )
    content = <MentorshipPage section={segments.slice(1).join('/')} />;
  else if (segments.join('/') === 'messages') content = <MentorshipPage section="messages" />;
  else if (
    [
      'profile',
      'settings',
      'settings/security',
      'settings/notifications',
      'settings/privacy',
      'notifications',
      'help',
      'support',
    ].includes(segments.join('/'))
  )
    content = <AccountPage section={segments.join('/')} />;
  else if (
    segments[0] === 'learning' &&
    segments.length <= 3 &&
    (segments.length < 3 || segments[2] === 'learn')
  )
    content = <Learning id={segments[1]} player={segments[2] === 'learn'} />;
  else if (segments.join('/') === 'my-learning') content = <Learning mine />;
  else if (
    segments.join('/') === 'credits' ||
    segments.join('/') === 'credits/history' ||
    segments.join('/') === 'payments'
  )
    content = <Payments history={segments[1] === 'history'} paymentsOnly={segments[0] === 'payments'} />;
  else if (segments.length === 1 && segments[0] === 'goals') content = <GoalCollection />;
  else if (segments.length === 1 && segments[0] === 'history') content = <GoalCollection history />;
  else if (segments.join('/') === 'goals/new') content = <GoalWizard />;
  else if (segments[0] === 'goals' && segments.length === 3 && segments[2] === 'edit')
    content = <GoalWizard id={segments[1]} />;
  else if (
    segments[0] === 'goals' &&
    (segments.length === 2 ||
      (segments.length === 3 &&
        ['plan', 'actions', 'check-ins', 'evaluations', 'evidence', 'interventions'].includes(segments[2])))
  )
    content = <GoalDetails id={segments[1]} section={segments[2]} />;
  else notFound();
  return <PortalShell path={path}>{content}</PortalShell>;
}
