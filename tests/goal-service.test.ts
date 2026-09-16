import { beforeEach, describe, expect, it } from 'vitest';
import { saveSession } from '../domains/shared/demo-services';
import { goalService } from '../domains/goals/demo-service';
import type { GoalInput } from '../domains/goals/contracts';
const input: GoalInput = {
  category: 'Technology',
  title: 'Build a portfolio',
  description: 'Create and publish a working portfolio site.',
  currentPosition: 'One draft page',
  target: 'Publish a complete portfolio',
  motivation: 'Show my work to future collaborators.',
  deadline: '2027-12-31',
  milestones: [
    {
      id: 'm',
      title: 'Build pages',
      target: 10,
      current: 9,
      unit: 'pages',
      weight: 1,
      deadline: '2027-12-31',
    },
  ],
  actions: [
    {
      id: 'a',
      goalId: '',
      title: 'Build a page',
      description: '',
      frequency: 'One-time',
      days: [],
      intervalDays: 1,
      duration: 30,
      startDate: '2027-01-01',
      endDate: '2027-12-31',
      reminder: '',
      evidenceRequired: false,
      skipReasonRequired: true,
      milestoneId: 'm',
      contribution: 5,
      paused: false,
    },
  ],
};
beforeEach(() =>
  saveSession({
    id: 'owner',
    email: 'owner@example.test',
    role: 'member',
    status: 'active',
    expiresAt: Date.now() + 60000,
  }),
);
describe('goal adapter invariants', () => {
  it('isolates edit drafts and preserves their original version for stale-edit detection', async () => {
    const goal = await goalService.create(input);
    await goalService.saveDraft({ ...input, title: 'New plan' });
    await goalService.saveDraft({ ...input, title: 'Edited plan' }, goal.id, goal.version);
    expect((await goalService.draft())?.title).toBe('New plan');
    const draft = await goalService.draft(goal.id);
    expect(draft?.title).toBe('Edited plan');
    await goalService.recordProgress(goal.id, 'm', 8, 'Changed while draft was open');
    await expect(goalService.update(goal.id, draft!.version!, draft!)).rejects.toThrow('changed');
    await goalService.discardDraft(goal.id);
    expect(await goalService.draft(goal.id)).toBeNull();
    expect((await goalService.draft())?.title).toBe('New plan');
  });
  it('preserves onboarding details as an account-scoped planning draft', async () => {
    sessionStorage.setItem(
      'gap-first-goal',
      JSON.stringify({
        title: 'My onboarding goal',
        measure: 'Publish one page',
        targetDate: '2027-12-31',
        action: 'Draft my page',
      }),
    );
    const draft = await goalService.draft();
    expect(draft?.title).toBe('My onboarding goal');
    expect(draft?.target).toBe('Publish one page');
    expect(draft?.actions[0].title).toBe('Draft my page');
    expect(sessionStorage.getItem('gap-first-goal')).toBeNull();
    expect((await goalService.draft())?.title).toBe('My onboarding goal');
  });
  it('isolates accounts and rejects stale versions', async () => {
    const goal = await goalService.create(input);
    await goalService.recordProgress(goal.id, 'm', 8, 'Adjusted baseline');
    await expect(goalService.update(goal.id, goal.version, input)).rejects.toThrow('changed');
    saveSession({
      id: 'other',
      email: 'other@example.test',
      role: 'member',
      status: 'active',
      expiresAt: Date.now() + 60000,
    });
    expect(await goalService.get(goal.id)).toBeNull();
    await expect(goalService.recordProgress(goal.id, 'm', 2, '')).rejects.toThrow('not found');
  });
  it('undoes only the contribution actually applied at a milestone cap', async () => {
    const goal = await goalService.create(input);
    const completed = await goalService.updateOccurrence(goal.id, goal.occurrences[0].id, 'Completed');
    expect(completed.milestones[0].current).toBe(10);
    const undone = await goalService.updateOccurrence(goal.id, goal.occurrences[0].id, 'Due');
    expect(undone.milestones[0].current).toBe(9);
    await expect(goalService.updateOccurrence(goal.id, goal.occurrences[0].id, 'Skipped')).rejects.toThrow(
      'Explain',
    );
  });
  it('retains an immutable evaluation snapshot and rejects changes to an archived goal', async () => {
    const goal = await goalService.create(input);
    await goalService.submitEvaluation(goal.id, {
      activitiesCompleted: 'One page',
      wentWell: 'Clear plan',
      challenges: 'Time available',
      blockers: '',
      adjustment: 'Shorter sessions',
      confidence: 2,
      mentorAssistance: true,
      privateReflection: 'Private thought',
    });
    const changed = await goalService.recordProgress(goal.id, 'm', 10, 'Finished');
    expect(changed.evaluations[0].progress).toBe(90);
    expect(changed.evaluations[0].milestoneSnapshot[0].current).toBe(9);
    expect(changed.interventions).toHaveLength(1);
    await goalService.setStatus(goal.id, 'archived', 'Keep a record');
    await expect(
      goalService.addEvidence(goal.id, { title: 'Late change', description: '', url: '' }),
    ).rejects.toThrow('read-only');
  });
});
