'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ActionLink, Card, Notice, Skeleton, Button } from '../shared/ui';
import { GoalCollection, Mutation } from '../goals/screens';
import { goalService } from '../goals/demo-service';
import { accountService } from '../account/service';
import { learningService } from '../learning/demo-service';
import { mentorshipPortal } from '../mentorship/portal-service';
import { achievementService } from '../goals/achievements';
async function readDashboard() {
  const [goals, account, learning, mentorship, achievements] = await Promise.all([
    goalService.list(),
    accountService.read(),
    learningService.library(),
    mentorshipPortal.read(),
    achievementService.list(),
  ]);
  return { goals, account, learning, mentorship, achievements };
}
export function MemberDashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof readDashboard>> | null>(null);
  const [error, setError] = useState('');
  async function load() {
    try {
      setData(await readDashboard());
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (!data)
    return error ? (
      <Notice error>
        {error}
        <Button onClick={load}>Retry</Button>
      </Notice>
    ) : (
      <Skeleton />
    );
  const primary = data.goals.find((goal) => goal.status === 'active');
  const action = primary?.occurrences.find((item) =>
    ['Due', 'Upcoming', 'Rescheduled'].includes(item.status),
  );
  const definition = primary?.actions.find((item) => item.id === action?.actionId);
  const session = data.mentorship.sessions
    .filter((item) => item.status === 'Scheduled' && Date.parse(item.startsAt) > Date.now())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const recent = data.achievements.achievements.filter((item) => item.earned).at(-1);
  const recommended = data.learning.materials
    .filter((item) => (primary ? item.category === primary.category : item.featured))
    .slice(0, 2);
  return (
    <>
      <p>
        {data.account.profile.displayName
          ? `Welcome back, ${data.account.profile.displayName}.`
          : 'Welcome back.'}{' '}
        Take one practical step today.
      </p>
      <GoalCollection key={primary?.version || 0} dashboard />
      {primary && (
        <div className="actions">
          {action && (
            <Mutation
              title="Complete Action"
              onSubmit={async (form) => {
                await goalService.updateOccurrence(
                  primary.id,
                  action.id,
                  'Completed',
                  '',
                  undefined,
                  String(form.get('evidence') || ''),
                );
                await load();
              }}
            >
              <p>{definition?.title}</p>
              {definition?.evidenceRequired && (
                <label className="field">
                  Required evidence
                  <select name="evidence" required>
                    <option value="">Choose evidence</option>
                    {primary.evidence.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                  <Link href={`/app/goals/${primary.id}/evidence`}>Add Evidence</Link>
                </label>
              )}
            </Mutation>
          )}
          <ActionLink href={`/app/goals/${primary.id}/evidence`} secondary>
            Add Evidence
          </ActionLink>
          <ActionLink href={`/app/goals/${primary.id}/edit`} secondary>
            Adjust Plan
          </ActionLink>
          <ActionLink href="/app/goals" secondary>
            View All Goals
          </ActionLink>
        </div>
      )}
      <div className="portal-grid">
        <Card>
          <h2>Upcoming mentor session</h2>
          {session ? (
            <>
              <h3>{session.title}</h3>
              <p>{new Date(session.startsAt).toLocaleString()}</p>
              <ActionLink href={`/app/mentor/sessions/${session.id}`}>Open Session</ActionLink>
            </>
          ) : (
            <>
              <p>No upcoming sessions. Review your assignment or arrange a time for support.</p>
              <Link href="/app/mentor">View mentorship</Link>
            </>
          )}
        </Card>
        <Card>
          <h2>Evaluation due</h2>
          {primary ? (
            <>
              <p>
                {primary.evaluations.length
                  ? 'Review progress and record your next adjustment when your plan needs it.'
                  : 'Your first evaluation is ready whenever you have progress or a challenge to reflect on.'}
              </p>
              <ActionLink href={`/app/goals/${primary.id}/evaluations`}>Complete Evaluation</ActionLink>
              {primary.interventions.some((item) => item.status !== 'Completed') && (
                <p>
                  <Link href={`/app/goals/${primary.id}/interventions`}>View Intervention</Link>
                </p>
              )}
            </>
          ) : (
            <p>Create a goal to begin evaluating progress.</p>
          )}
        </Card>
        <Card>
          <h2>Recommended learning</h2>
          <p>
            {primary
              ? `Resources in ${primary.category}, your primary goal’s category.`
              : 'Featured resources to help you begin.'}
          </p>
          {recommended.length ? (
            recommended.map((item) => (
              <p key={item.id}>
                <Link href={`/app/learning/${item.id}`}>{item.title}</Link>
              </p>
            ))
          ) : (
            <p>No published demonstration resources match this category yet.</p>
          )}
          <Link href="/app/learning">View Learning</Link>
        </Card>
        <Card>
          <h2>Recent achievement</h2>
          {recent ? (
            <>
              <h3>{recent.title}</h3>
              <p>{recent.description}</p>
            </>
          ) : (
            <p>Your first meaningful step will begin your achievement history.</p>
          )}
          <Link href="/app/achievements">View Achievements</Link>
        </Card>
        <Card>
          <h2>Notifications requiring action</h2>
          {data.account.notifications.some((item) => !item.read) ? (
            data.account.notifications
              .filter((item) => !item.read)
              .map((item) => (
                <p key={item.id}>
                  <Link href={item.href}>{item.title}</Link>
                </p>
              ))
          ) : (
            <p>You have no unread notifications.</p>
          )}
          <Link href="/app/notifications">View Notifications</Link>
        </Card>
      </div>
    </>
  );
}
