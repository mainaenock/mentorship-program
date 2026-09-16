export type GoalStatus = 'active' | 'paused' | 'achieved' | 'archived';
export type Frequency =
  'One-time' | 'Daily' | 'Weekly' | 'Selected weekdays' | 'Monthly' | 'Custom recurrence';
export type OccurrenceStatus = 'Upcoming' | 'Due' | 'Completed' | 'Missed' | 'Skipped' | 'Rescheduled';
export interface Milestone {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  weight: number;
  deadline: string;
}
export interface GoalAction {
  id: string;
  goalId: string;
  title: string;
  description: string;
  frequency: Frequency;
  days: number[];
  intervalDays: number;
  duration: number;
  startDate: string;
  endDate: string;
  reminder: string;
  evidenceRequired: boolean;
  skipReasonRequired: boolean;
  milestoneId: string;
  contribution: number;
  paused: boolean;
}
export interface Occurrence {
  id: string;
  actionId: string;
  scheduledDate: string;
  originalDate: string;
  status: OccurrenceStatus;
  reason: string;
  completedAt?: string;
  evidenceId?: string;
  appliedContribution?: number;
}
export interface Evidence {
  id: string;
  goalId: string;
  title: string;
  description: string;
  url: string;
  fileName?: string;
  createdAt: string;
}
export interface EvaluationInput {
  activitiesCompleted: string;
  wentWell: string;
  challenges: string;
  blockers: string;
  adjustment: string;
  mentorAssistance: boolean;
  confidence: number;
  privateReflection: string;
}
export interface Evaluation extends EvaluationInput {
  id: string;
  goalId: string;
  submittedAt: string;
  progress: number;
  milestoneSnapshot: Milestone[];
  completedOccurrenceIds: string[];
}
export interface Intervention {
  id: string;
  goalId: string;
  trigger: string;
  riskSignals: string[];
  steps: string[];
  memberResponse: string;
  mentorRecommendation: string;
  followUpDate: string;
  outcome: string;
  status: 'Open' | 'Accepted' | 'Changes requested' | 'Completed';
}
export interface GoalEvent {
  id: string;
  at: string;
  title: string;
  detail: string;
}
export interface Goal {
  id: string;
  ownerId: string;
  category: string;
  title: string;
  description: string;
  currentPosition: string;
  target: string;
  motivation: string;
  deadline: string;
  status: GoalStatus;
  milestones: Milestone[];
  actions: GoalAction[];
  occurrences: Occurrence[];
  evidence: Evidence[];
  evaluations: Evaluation[];
  interventions: Intervention[];
  timeline: GoalEvent[];
  createdAt: string;
  version: number;
}
export type GoalInput = Pick<
  Goal,
  | 'category'
  | 'title'
  | 'description'
  | 'currentPosition'
  | 'target'
  | 'motivation'
  | 'deadline'
  | 'milestones'
  | 'actions'
>;
export interface GoalService {
  categories(): Promise<string[]>;
  list(): Promise<Goal[]>;
  get(id: string): Promise<Goal | null>;
  draft(goalId?: string): Promise<(GoalInput & { version?: number }) | null>;
  saveDraft(input: GoalInput, goalId?: string, version?: number): Promise<void>;
  discardDraft(goalId?: string): Promise<void>;
  create(input: GoalInput): Promise<Goal>;
  update(id: string, version: number, input: GoalInput): Promise<Goal>;
  setStatus(id: string, status: GoalStatus, reason: string): Promise<Goal>;
  recordProgress(id: string, milestoneId: string, current: number, note: string): Promise<Goal>;
  saveAction(id: string, action: GoalAction): Promise<Goal>;
  deleteAction(id: string, actionId: string, reason: string): Promise<Goal>;
  updateOccurrence(
    id: string,
    occurrenceId: string,
    state: OccurrenceStatus,
    reason?: string,
    date?: string,
    evidenceId?: string,
  ): Promise<Goal>;
  addEvidence(id: string, evidence: Omit<Evidence, 'id' | 'goalId' | 'createdAt'>): Promise<Goal>;
  saveEvaluationDraft(id: string, input: EvaluationInput): Promise<void>;
  evaluationDraft(id: string): Promise<EvaluationInput | null>;
  submitEvaluation(id: string, input: EvaluationInput): Promise<Goal>;
  respondToIntervention(
    id: string,
    interventionId: string,
    response: string,
    state: Intervention['status'],
  ): Promise<Goal>;
}
