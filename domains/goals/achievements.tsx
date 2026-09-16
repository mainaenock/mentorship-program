'use client';
import { useEffect, useState } from 'react';
import { ActionLink, Badge, Button, Card, Modal, Notice, Skeleton } from '../shared/ui';
import { goalService } from './demo-service';
import { weightedProgress } from './model';
import { learningService } from '../learning/demo-service';
import { mentorshipPortal } from '../mentorship/portal-service';
import { accountService } from '../account/service';
import { readSession } from '../shared/demo-services';
export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}
export interface AchievementService {
  list(): Promise<{ achievements: Achievement[]; sharingAllowed: boolean }>;
}
export const achievementService: AchievementService = {
  async list() {
    const [goals, learning, mentorship, account] = await Promise.all([
      goalService.list(),
      learningService.library(),
      mentorshipPortal.read(),
      accountService.read(),
    ]);
    const completedDates = [
      ...new Set(
        goals.flatMap((goal) =>
          goal.occurrences.filter((item) => item.status === 'Completed').map((item) => item.scheduledDate),
        ),
      ),
    ].sort();
    let best = 0;
    let streak = 0;
    let previous = 0;
    for (const date of completedDates) {
      const time = Date.parse(date);
      streak = time - previous === 86400000 ? streak + 1 : 1;
      best = Math.max(best, streak);
      previous = time;
    }
    const achieved = goals.filter(
      (goal) => goal.status === 'achieved' || goal.timeline.some((event) => event.title === 'Goal achieved'),
    ).length;
    const progress = Math.max(0, ...goals.map((goal) => weightedProgress(goal.milestones)));
    const entries: [string, string, boolean][] = [
      ['First goal', 'Create your first meaningful goal.', goals.length > 0],
      ['First action', 'Complete an action in your plan.', completedDates.length > 0],
      ['Seven-day consistency', 'Complete actions on seven consecutive dates.', best >= 7],
      [
        'First evaluation',
        'Submit your first progress evaluation.',
        goals.some((goal) => goal.evaluations.length > 0),
      ],
      ['25% progress', 'Reach 25% weighted milestone progress.', progress >= 25],
      ['50% progress', 'Reach 50% weighted milestone progress.', progress >= 50],
      ['75% progress', 'Reach 75% weighted milestone progress.', progress >= 75],
      [
        'Completed learning path',
        'Finish an eligible mini-course.',
        learning.records.some(
          (record) =>
            record.state === 'Completed' &&
            learning.materials.find((item) => item.id === record.materialId)?.type === 'Mini-course',
        ),
      ],
      [
        'Mentor milestone',
        'Complete a mentor session with a recorded outcome.',
        mentorship.sessions.some((item) => item.status === 'Completed' && !!item.outcome),
      ],
      ['Goal achieved', 'Complete your milestones and mark a goal achieved.', achieved >= 1],
      ['Three goals achieved', 'Complete three meaningful goals.', achieved >= 3],
    ];
    return {
      achievements: entries.map(([title, description, earned], index) => ({
        id: `achievement-${index}`,
        title,
        description,
        earned,
      })),
      sharingAllowed: account.preferences.achievementsPublic && readSession()?.role !== 'minor',
    };
  },
};
export function Achievements() {
  const [data, setData] = useState<Awaited<ReturnType<AchievementService['list']>> | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function load() {
    try {
      setData(await achievementService.list());
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
  return (
    <>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <p>Earn recognition through meaningful actions and progress. No random rewards or cash prizes.</p>
      <div className="actions">
        <ActionLink href="/app/goals/new">Start Next Goal</ActionLink>
        <ActionLink href="/app/history" secondary>
          View Goal History
        </ActionLink>
      </div>
      <div className="portal-grid">
        {data.achievements.map((item) => (
          <Card key={item.id}>
            <Badge tone={item.earned ? 'success' : 'neutral'}>
              {item.earned ? 'Earned' : 'Not yet earned'}
            </Badge>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <Modal title={item.title} trigger={<Button variant="outline">View Achievement</Button>}>
              <p>{item.description}</p>
              <p>
                {item.earned
                  ? 'You have met this achievement’s progress requirement.'
                  : 'Keep working toward this achievement at your own pace.'}
              </p>
              {item.earned && data.sharingAllowed && (
                <Button
                  onClick={async () => {
                    try {
                      const text = `I earned the “${item.title}” achievement through meaningful progress.`;
                      if (navigator.share) await navigator.share({ title: 'My achievement', text });
                      else {
                        await navigator.clipboard.writeText(text);
                        setMessage('Privacy-safe achievement text copied.');
                      }
                    } catch (e) {
                      if ((e as Error).name !== 'AbortError')
                        setError('Sharing is unavailable. Try another browser.');
                    }
                  }}
                >
                  Share Achievement
                </Button>
              )}
              <p>
                Sharing contains only the achievement name. It excludes your identity, goal details and
                reflections.
              </p>
            </Modal>
          </Card>
        ))}
      </div>
    </>
  );
}
