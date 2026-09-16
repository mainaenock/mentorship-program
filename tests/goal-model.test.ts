import { describe, expect, it } from 'vitest';
import type { GoalAction, Milestone } from '../domains/goals/contracts';
import { currentStreak, occurrencesFor, weightedProgress } from '../domains/goals/model';
const action: GoalAction = {
  id: 'a',
  goalId: 'g',
  title: 'Practice',
  description: '',
  frequency: 'Daily',
  days: [1, 3],
  intervalDays: 3,
  duration: 15,
  startDate: '2026-09-01',
  endDate: '2026-10-31',
  reminder: '',
  evidenceRequired: false,
  skipReasonRequired: true,
  milestoneId: 'm',
  contribution: 1,
  paused: false,
};
describe('goal calculations', () => {
  it('weights milestones, clamps overshoot and handles an empty plan', () => {
    const milestones: Milestone[] = [
      { id: 'a', title: 'a', target: 10, current: 5, unit: 'items', weight: 80, deadline: '' },
      { id: 'b', title: 'b', target: 1, current: 3, unit: 'items', weight: 20, deadline: '' },
    ];
    expect(weightedProgress(milestones)).toBe(60);
    expect(weightedProgress([])).toBe(0);
  });
  it('generates each recurrence and distinguishes missed, due and future work', () => {
    expect(occurrencesFor(action, '2026-09-03', '2026-09-02').map((o) => o.status)).toEqual([
      'Missed',
      'Due',
      'Upcoming',
    ]);
    expect(occurrencesFor({ ...action, frequency: 'One-time' }, '2026-09-30')).toHaveLength(1);
    expect(occurrencesFor({ ...action, frequency: 'Weekly' }, '2026-09-30')).toHaveLength(5);
    expect(
      occurrencesFor({ ...action, frequency: 'Selected weekdays' }, '2026-09-07').map((o) => o.scheduledDate),
    ).toEqual(['2026-09-02', '2026-09-07']);
    expect(occurrencesFor({ ...action, frequency: 'Custom recurrence' }, '2026-09-07')).toHaveLength(3);
    expect(
      occurrencesFor(
        { ...action, frequency: 'Monthly', startDate: '2026-01-31', endDate: '2026-03-31' },
        '2026-03-31',
      ).map((o) => o.scheduledDate),
    ).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
    expect(occurrencesFor({ ...action, paused: true }, '2026-09-07')).toEqual([]);
  });
  it('counts consecutive completed dates without double-counting actions', () => {
    const occurrences = occurrencesFor(action, '2026-09-03', '2026-09-03').map((o) => ({
      ...o,
      status: 'Completed' as const,
    }));
    expect(currentStreak([...occurrences, occurrences[0]], '2026-09-04')).toBe(3);
    expect(currentStreak(occurrences, '2026-09-05')).toBe(0);
  });
});
