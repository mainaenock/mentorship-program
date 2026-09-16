'use client';
import { config } from '../shared/config';
import { readSession } from '../shared/demo-services';
import { assertPermission } from '../portal/permissions';
import type { EvaluationInput, Goal, GoalInput, GoalService } from './contracts';
import { occurrencesFor, smartAssessment, weightedProgress } from './model';

function accountKey() {
  const session = readSession();
  assertPermission(session, 'member.self');
  return `gap-goals:${session.id}`;
}
async function ready() {
  await new Promise((resolve) => setTimeout(resolve, 180));
  if (!navigator.onLine) throw new Error('You are offline. Reconnect and try again.');
  return accountKey();
}
function read(key: string): Goal[] {
  const goals = JSON.parse(sessionStorage.getItem(key) || '[]') as Goal[];
  const today = new Date().toISOString().slice(0, 10);
  for (const goal of goals)
    for (const occurrence of goal.occurrences) {
      if (['Upcoming', 'Due', 'Missed'].includes(occurrence.status))
        occurrence.status =
          occurrence.scheduledDate < today
            ? 'Missed'
            : occurrence.scheduledDate === today
              ? 'Due'
              : 'Upcoming';
    }
  return goals;
}
function write(key: string, goals: Goal[]) {
  sessionStorage.setItem(key, JSON.stringify(goals));
}
function event(goal: Goal, title: string, detail: string) {
  goal.timeline.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), title, detail });
  goal.version++;
}
async function mutate(id: string, operation: (goal: Goal) => void): Promise<Goal> {
  const key = await ready();
  const goals = read(key);
  const goal = goals.find((item) => item.id === id);
  if (!goal) throw new Error('Goal not found in your account.');
  if (goal.status === 'archived') throw new Error('An archived goal is read-only.');
  operation(goal);
  write(key, goals);
  return structuredClone(goal);
}
function validate(input: GoalInput) {
  const invalid = smartAssessment(input).filter((item) => !item.passed);
  if (invalid.length)
    throw new Error(`Review these SMART checks: ${invalid.map((item) => item.label).join(', ')}.`);
  if (!config.categories.includes(input.category)) throw new Error('Choose an available goal category.');
  if (
    input.milestones.some(
      (m) => !m.title.trim() || m.current < 0 || !m.deadline || m.deadline > input.deadline,
    )
  )
    throw new Error('Give milestones a title, valid progress and a deadline within the goal.');
  if (
    input.actions.some(
      (a) =>
        !a.title.trim() ||
        a.duration <= 0 ||
        !a.startDate ||
        a.endDate < a.startDate ||
        a.endDate > input.deadline ||
        (a.frequency === 'Selected weekdays' && !a.days.length) ||
        (a.frequency === 'Custom recurrence' && a.intervalDays < 1),
    )
  )
    throw new Error('Review action titles, durations and recurrence dates.');
}
function validateEvaluation(input: EvaluationInput) {
  if (
    !input.wentWell.trim() ||
    !input.challenges.trim() ||
    !input.adjustment.trim() ||
    input.confidence < 1 ||
    input.confidence > 5
  )
    throw new Error('Complete the reflection and choose confidence from 1 to 5.');
}
export const goalService: GoalService = {
  async categories() {
    await ready();
    return [...config.categories];
  },
  async list() {
    return read(await ready());
  },
  async get(id) {
    return (await this.list()).find((goal) => goal.id === id) || null;
  },
  async draft(goalId) {
    const key = await ready();
    if (goalId) {
      if (!(await this.get(goalId))) throw new Error('Goal not found.');
      return JSON.parse(sessionStorage.getItem(`${key}:draft:${goalId}`) || 'null');
    }
    const saved = JSON.parse(sessionStorage.getItem(`${key}:draft`) || 'null') as GoalInput | null;
    if (saved) return saved;
    const setup = JSON.parse(sessionStorage.getItem('gap-first-goal') || 'null') as {
      title?: string;
      measure?: string;
      targetDate?: string;
      action?: string;
    } | null;
    if (!setup?.title) return null;
    const draft: GoalInput = {
      category: '',
      title: setup.title,
      description: setup.measure || '',
      currentPosition: '',
      target: setup.measure || '',
      motivation: '',
      deadline: setup.targetDate || '',
      milestones: [],
      actions: setup.action
        ? [
            {
              id: crypto.randomUUID(),
              goalId: '',
              title: setup.action,
              description: '',
              frequency: 'One-time',
              days: [],
              intervalDays: 1,
              duration: 15,
              startDate: new Date().toISOString().slice(0, 10),
              endDate: setup.targetDate || '',
              reminder: '',
              evidenceRequired: false,
              skipReasonRequired: true,
              milestoneId: '',
              contribution: 0,
              paused: false,
            },
          ]
        : [],
    };
    sessionStorage.setItem(`${key}:draft`, JSON.stringify(draft));
    sessionStorage.removeItem('gap-first-goal');
    return draft;
  },
  async saveDraft(input, goalId, version) {
    const key = await ready();
    if (goalId && !(await this.get(goalId))) throw new Error('Goal not found.');
    sessionStorage.setItem(
      `${key}:draft${goalId ? `:${goalId}` : ''}`,
      JSON.stringify({ ...input, ...(goalId ? { version } : {}) }),
    );
  },
  async discardDraft(goalId) {
    const key = await ready();
    sessionStorage.removeItem(`${key}:draft${goalId ? `:${goalId}` : ''}`);
  },
  async create(input) {
    const key = await ready();
    validate(input);
    const session = readSession();
    assertPermission(session, 'member.self');
    const id = crypto.randomUUID();
    const actions = input.actions.map((action) => ({ ...action, goalId: id }));
    const goal: Goal = {
      ...structuredClone(input),
      id,
      ownerId: session.id,
      status: 'active',
      actions,
      occurrences: actions.flatMap((action) => occurrencesFor(action, input.deadline)),
      evidence: [],
      evaluations: [],
      interventions: [],
      timeline: [],
      createdAt: new Date().toISOString(),
      version: 0,
    };
    event(goal, 'Goal created', 'Your plan is ready for its first action.');
    write(key, [...read(key), goal]);
    sessionStorage.removeItem(`${key}:draft`);
    return goal;
  },
  async update(id, version, input) {
    validate(input);
    return mutate(id, (goal) => {
      if (goal.version !== version) throw new Error('This goal changed. Reload before saving your changes.');
      const old = new Map(goal.occurrences.map((item) => [item.id, item]));
      Object.assign(goal, structuredClone(input));
      goal.actions = goal.actions.map((action) => ({ ...action, goalId: id }));
      goal.occurrences = goal.actions
        .flatMap((action) => occurrencesFor(action, goal.deadline))
        .map((item) => old.get(item.id) || item);
      // Retain historical outcomes even when the new recurrence no longer includes them.
      for (const item of old.values())
        if (
          ['Completed', 'Skipped', 'Rescheduled'].includes(item.status) &&
          !goal.occurrences.some((o) => o.id === item.id)
        )
          goal.occurrences.push(item);
      event(goal, 'Plan adjusted', 'Goal details, milestones and recurring actions updated.');
    });
  },
  async setStatus(id, status, reason) {
    return mutate(id, (goal) => {
      if (!reason.trim()) throw new Error('Explain this change before confirming.');
      if (status === 'achieved' && weightedProgress(goal.milestones) < 100)
        throw new Error('Complete the weighted milestones before marking this goal achieved.');
      if (goal.status === 'archived') throw new Error('An archived goal is read-only.');
      goal.status = status;
      event(goal, `Goal ${status}`, reason);
    });
  },
  async recordProgress(id, milestoneId, current, note) {
    return mutate(id, (goal) => {
      if (goal.status !== 'active') throw new Error('Resume the goal before recording progress.');
      const milestone = goal.milestones.find((item) => item.id === milestoneId);
      if (!milestone || !Number.isFinite(current) || current < 0 || current > milestone.target)
        throw new Error('Enter progress between zero and the milestone target.');
      milestone.current = current;
      event(goal, 'Progress recorded', `${milestone.title}: ${current} ${milestone.unit}. ${note}`);
    });
  },
  async saveAction(id, action) {
    return mutate(id, (goal) => {
      if (!action.title.trim() || action.duration <= 0 || action.endDate < action.startDate)
        throw new Error('Provide a title, duration and valid dates.');
      const existing = goal.actions.findIndex((item) => item.id === action.id);
      if (existing < 0) goal.actions.push({ ...action, goalId: id });
      else goal.actions[existing] = { ...action, goalId: id };
      const outcomes = goal.occurrences.filter(
        (item) =>
          item.actionId !== action.id || ['Completed', 'Skipped', 'Rescheduled'].includes(item.status),
      );
      goal.occurrences = [
        ...outcomes,
        ...occurrencesFor(action, goal.deadline).filter((item) => !outcomes.some((o) => o.id === item.id)),
      ];
      event(goal, action.paused ? 'Action paused' : 'Action saved', action.title);
    });
  },
  async deleteAction(id, actionId, reason) {
    return mutate(id, (goal) => {
      if (!reason.trim()) throw new Error('A reason is required to delete an action.');
      const action = goal.actions.find((item) => item.id === actionId);
      if (!action) throw new Error('Action not found.');
      goal.actions = goal.actions.filter((item) => item.id !== actionId);
      goal.occurrences = goal.occurrences.filter(
        (item) => item.actionId !== actionId || ['Completed', 'Skipped', 'Rescheduled'].includes(item.status),
      );
      event(goal, 'Action deleted', `${action.title}. ${reason}. Completed history retained.`);
    });
  },
  async updateOccurrence(id, occurrenceId, state, reason = '', date, evidenceId) {
    return mutate(id, (goal) => {
      if (goal.status !== 'active') throw new Error('Resume the goal before changing an action.');
      const occurrence = goal.occurrences.find((item) => item.id === occurrenceId);
      const action = goal.actions.find((item) => item.id === occurrence?.actionId);
      if (!occurrence || !action) throw new Error('Action occurrence not found.');
      if (action.paused) throw new Error('Resume the action first.');
      if (
        state === 'Completed' &&
        action.evidenceRequired &&
        !goal.evidence.some((item) => item.id === evidenceId)
      )
        throw new Error('Attach evidence before completing this action.');
      if (state === 'Skipped' && action.skipReasonRequired && !reason.trim())
        throw new Error('Explain why this action is being skipped.');
      if (
        state === 'Rescheduled' &&
        (!date || date < new Date().toISOString().slice(0, 10) || date > goal.deadline)
      )
        throw new Error('Choose a new date between today and the goal deadline.');
      const milestone = goal.milestones.find((item) => item.id === action.milestoneId);
      const wasCompleted = occurrence.status === 'Completed';
      if (milestone && !wasCompleted && state === 'Completed') {
        occurrence.appliedContribution = Math.min(
          milestone.target - milestone.current,
          Math.max(0, action.contribution),
        );
        milestone.current += occurrence.appliedContribution;
      }
      if (milestone && wasCompleted && state !== 'Completed') {
        milestone.current = Math.max(0, milestone.current - (occurrence.appliedContribution || 0));
        occurrence.appliedContribution = 0;
      }
      occurrence.status = state;
      occurrence.reason = reason;
      occurrence.evidenceId = evidenceId || occurrence.evidenceId;
      occurrence.completedAt = state === 'Completed' ? new Date().toISOString() : undefined;
      if (state === 'Rescheduled' && date) occurrence.scheduledDate = date;
      event(goal, `Action ${state.toLowerCase()}`, `${action.title}. ${reason}`);
    });
  },
  async addEvidence(id, input) {
    return mutate(id, (goal) => {
      if (!input.title.trim()) throw new Error('Evidence needs a title.');
      if (input.url && !/^https:\/\//i.test(input.url)) throw new Error('Use an HTTPS evidence link.');
      goal.evidence.push({
        ...input,
        id: crypto.randomUUID(),
        goalId: id,
        createdAt: new Date().toISOString(),
      });
      event(goal, 'Evidence added', input.title);
    });
  },
  async saveEvaluationDraft(id, input) {
    const key = await ready();
    if (!read(key).some((item) => item.id === id)) throw new Error('Goal not found.');
    sessionStorage.setItem(`${key}:evaluation:${id}`, JSON.stringify(input));
  },
  async evaluationDraft(id) {
    const key = await ready();
    return JSON.parse(sessionStorage.getItem(`${key}:evaluation:${id}`) || 'null') as EvaluationInput | null;
  },
  async submitEvaluation(id, input) {
    validateEvaluation(input);
    const goal = await mutate(id, (goal) => {
      goal.evaluations.push({
        ...input,
        id: crypto.randomUUID(),
        goalId: id,
        submittedAt: new Date().toISOString(),
        progress: weightedProgress(goal.milestones),
        milestoneSnapshot: structuredClone(goal.milestones),
        completedOccurrenceIds: goal.occurrences
          .filter((item) => item.status === 'Completed')
          .map((item) => item.id),
      });
      event(goal, 'Evaluation submitted', 'An immutable progress snapshot was recorded.');
      if (input.mentorAssistance || input.confidence <= 2)
        goal.interventions.push({
          id: crypto.randomUUID(),
          goalId: id,
          trigger: input.mentorAssistance ? 'Member requested assistance' : 'Low confidence reported',
          riskSignals: [input.blockers || input.challenges],
          steps: [
            'Review the next action and make it manageable.',
            'Arrange a mentor review if you need support.',
          ],
          memberResponse: '',
          mentorRecommendation: 'Awaiting mentor review',
          followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          outcome: '',
          status: 'Open',
        });
    });
    sessionStorage.removeItem(`${accountKey()}:evaluation:${id}`);
    return goal;
  },
  async respondToIntervention(id, interventionId, response, state) {
    return mutate(id, (goal) => {
      const intervention = goal.interventions.find((item) => item.id === interventionId);
      if (!intervention) throw new Error('Intervention not found.');
      if (!response.trim()) throw new Error('Add a response or outcome.');
      intervention.memberResponse = response;
      intervention.status = state;
      if (state === 'Completed') intervention.outcome = response;
      event(goal, `Intervention ${state.toLowerCase()}`, response);
    });
  },
};
