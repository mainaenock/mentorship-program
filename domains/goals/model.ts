import type { Goal, GoalAction, GoalInput, Milestone, Occurrence } from './contracts';

export function weightedProgress(milestones: readonly Milestone[]): number {
  const total = milestones.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (!total) return 0;
  return Math.round(
    (milestones.reduce(
      (sum, item) =>
        sum + Math.max(0, item.weight) * Math.min(1, Math.max(0, item.current) / Math.max(1, item.target)),
      0,
    ) /
      total) *
      100,
  );
}
export function smartAssessment(input: GoalInput): { label: string; passed: boolean; explanation: string }[] {
  return [
    {
      label: 'Specific',
      passed: input.title.trim().length >= 5 && input.description.trim().length >= 10,
      explanation: 'Name the outcome and describe what you will do (at least 10 characters).',
    },
    {
      label: 'Measurable',
      passed:
        input.milestones.length > 0 &&
        input.milestones.every((m) => m.target > 0 && !!m.unit.trim() && m.weight > 0),
      explanation: 'Give every milestone a positive target, unit and weight.',
    },
    {
      label: 'Achievable',
      passed: !!input.currentPosition.trim() && input.actions.length > 0,
      explanation:
        'Record your starting point and at least one practical action. This checks plan completeness, not whether success is guaranteed.',
    },
    {
      label: 'Relevant',
      passed: input.motivation.trim().length >= 10,
      explanation: 'Explain why the goal matters to you (at least 10 characters).',
    },
    {
      label: 'Time-bound',
      passed:
        /^\d{4}-\d{2}-\d{2}$/.test(input.deadline) && input.deadline >= new Date().toISOString().slice(0, 10),
      explanation: 'Choose today or a future deadline.',
    },
  ];
}
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const parseDate = (value: string) => new Date(`${value}T00:00:00Z`);
/** Generate a bounded occurrence window. Production scheduling remains server-owned. */
export function occurrencesFor(
  action: GoalAction,
  through: string,
  today = isoDate(new Date()),
): Occurrence[] {
  if (action.paused || !action.startDate || !action.endDate) return [];
  const start = parseDate(action.startDate);
  const end = parseDate(through < action.endDate ? through : action.endDate);
  const output: Occurrence[] = [];
  const anchor = start.getTime();
  for (
    let date = new Date(start), scanned = 0;
    date <= end && scanned < 3660;
    date.setUTCDate(date.getUTCDate() + 1), scanned++
  ) {
    const difference = Math.round((date.getTime() - anchor) / 86400000);
    const matches =
      action.frequency === 'Daily' ||
      (action.frequency === 'One-time' && difference === 0) ||
      (action.frequency === 'Weekly' && difference % 7 === 0) ||
      (action.frequency === 'Selected weekdays' && action.days.includes(date.getUTCDay())) ||
      (action.frequency === 'Monthly' &&
        date.getUTCDate() ===
          Math.min(
            start.getUTCDate(),
            new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(),
          )) ||
      (action.frequency === 'Custom recurrence' && difference % Math.max(1, action.intervalDays) === 0);
    if (!matches) continue;
    const scheduledDate = isoDate(date);
    output.push({
      id: `${action.id}:${scheduledDate}`,
      actionId: action.id,
      scheduledDate,
      originalDate: scheduledDate,
      status: scheduledDate < today ? 'Missed' : scheduledDate === today ? 'Due' : 'Upcoming',
      reason: '',
    });
  }
  return output;
}
export function goalHealth(
  goal: Goal,
  today = isoDate(new Date()),
): 'On Track' | 'Needs Attention' | 'At Risk' {
  if (goal.status === 'achieved') return 'On Track';
  const missed = goal.occurrences.filter((item) => item.status === 'Missed').length;
  if ((goal.deadline < today && weightedProgress(goal.milestones) < 100) || missed >= 3) return 'At Risk';
  return missed > 0 || goal.interventions.some((item) => item.status !== 'Completed')
    ? 'Needs Attention'
    : 'On Track';
}
export function currentStreak(occurrences: readonly Occurrence[], today = isoDate(new Date())): number {
  const completed = new Set(occurrences.filter((o) => o.status === 'Completed').map((o) => o.scheduledDate));
  const cursor = parseDate(today);
  if (!completed.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (completed.has(isoDate(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
