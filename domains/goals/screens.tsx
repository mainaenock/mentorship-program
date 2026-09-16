'use client';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActionLink,
  Badge,
  Button,
  Card,
  Field,
  Modal,
  Notice,
  SafeForm,
  Select,
  Skeleton,
  Textarea,
  Check,
} from '../shared/ui';
import { CircularProgress, Timeline, Pagination } from '../shared/composites';
import { goalService } from './demo-service';
import { currentStreak, goalHealth, weightedProgress } from './model';
import { ActionFields, GoalSummary, newAction } from './wizard';
import type {
  EvaluationInput,
  Goal,
  GoalAction,
  GoalStatus,
  Intervention,
  Occurrence,
  OccurrenceStatus,
} from './contracts';

export function GoalCollection({
  history = false,
  dashboard = false,
}: {
  history?: boolean;
  dashboard?: boolean;
}) {
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [draftTitle, setDraftTitle] = useState('');
  async function load() {
    setError('');
    try {
      const [records, draft] = await Promise.all([goalService.list(), goalService.draft()]);
      setGoals(records);
      setDraftTitle(draft?.title || '');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (!goals)
    return error ? (
      <Notice error>
        {error}
        <Button onClick={load}>Retry</Button>
      </Notice>
    ) : (
      <Skeleton />
    );
  const primary = goals.find((goal) => goal.status === 'active');
  const next = primary?.occurrences.find((item) => ['Due', 'Upcoming', 'Rescheduled'].includes(item.status));
  const nextAction = primary?.actions.find((item) => item.id === next?.actionId);
  const filtered = goals.filter(
    (goal) =>
      (history || goal.status !== 'archived') &&
      (filter === 'All' || goal.status === filter) &&
      goal.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      {draftTitle && (
        <Card>
          <h2>Continue your goal plan</h2>
          <p>{draftTitle}</p>
          <p>
            Your saved goal details are ready. Review the category, milestones and actions before creating the
            full plan.
          </p>
          <ActionLink href="/app/goals/new">Continue Goal Plan</ActionLink>
        </Card>
      )}
      {dashboard && (
        <section className="next-action">
          <span className="eyebrow">YOUR NEXT STEP</span>
          <h2>
            {primary
              ? nextAction?.title || 'Review your goal and choose your next action.'
              : 'Give your next chapter a clear direction.'}
          </h2>
          <p>
            {primary
              ? `${primary.title} · Due ${primary.deadline}`
              : 'Start with one meaningful goal. We’ll help you turn it into a practical plan.'}
          </p>
          {primary ? (
            <>
              <div className="actions">
                <ActionLink href={`/app/goals/${primary.id}/actions`}>Start Next Action</ActionLink>
                <ActionLink href={`/app/goals/${primary.id}`} secondary>
                  View Goal
                </ActionLink>
              </div>
              <p>
                {currentStreak(primary.occurrences)}-day streak · {weightedProgress(primary.milestones)}%
                complete · {goalHealth(primary)}
              </p>
            </>
          ) : (
            <ActionLink href="/app/goals/new">Create New Goal</ActionLink>
          )}
        </section>
      )}
      {dashboard && primary && (
        <Card>
          <h2>This week’s actions</h2>
          {primary.occurrences
            .filter(
              (item) =>
                item.scheduledDate >= new Date().toISOString().slice(0, 10) &&
                item.scheduledDate <= new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
            )
            .slice(0, 7)
            .map((item) => (
              <p key={item.id}>
                <Link href={`/app/goals/${primary.id}/actions`}>
                  {primary.actions.find((a) => a.id === item.actionId)?.title || 'Previous action'}
                </Link>{' '}
                · {item.scheduledDate} · {item.status}
              </p>
            ))}
          <Link href={`/app/goals/${primary.id}/evaluations`}>Complete Evaluation</Link>
        </Card>
      )}
      <div className="portal-toolbar">
        <Field label="Search goals" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select
          label="Goal status"
          options={['All', 'active', 'paused', 'achieved', 'archived']}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <ActionLink href="/app/goals/new">Create New Goal</ActionLink>
      </div>
      {!filtered.length && (
        <Card>
          <h2>{goals.length ? 'No matching goals' : 'Your goals start here'}</h2>
          <p>
            {goals.length
              ? 'Try another search or status.'
              : 'Create a goal, define its milestones, and choose a first action.'}
          </p>
        </Card>
      )}
      <div className="portal-grid">
        {filtered.map((goal) => (
          <Card key={goal.id}>
            <Badge tone={goalHealth(goal) === 'At Risk' ? 'warning' : 'success'}>
              {goal.status} · {goalHealth(goal)}
            </Badge>
            <h2>
              <Link href={`/app/goals/${goal.id}`}>{goal.title}</Link>
            </h2>
            <p>
              {goal.category} · Due {goal.deadline}
            </p>
            <progress
              value={weightedProgress(goal.milestones)}
              max={100}
              aria-label={`${goal.title} progress`}
            />
            <p>
              {weightedProgress(goal.milestones)}% · {goal.milestones.length} milestones
            </p>
            <ActionLink href={`/app/goals/${goal.id}`} secondary>
              View Goal
            </ActionLink>
          </Card>
        ))}
      </div>
    </>
  );
}
export function GoalDetails({ id, section = 'overview' }: { id: string; section?: string }) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() {
    setError('');
    setLoading(true);
    try {
      setGoal(await goalService.get(id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [id]);
  if (loading) return <Skeleton />;
  if (error)
    return (
      <Notice error>
        {error}
        <Button onClick={load}>Retry</Button>
      </Notice>
    );
  if (!goal)
    return (
      <Card>
        <h2>Goal not found</h2>
        <p>This goal is not available in your account.</p>
        <ActionLink href="/app/goals">View All Goals</ActionLink>
      </Card>
    );
  const tabs = [
    ['overview', 'Overview'],
    ['plan', 'Plan'],
    ['actions', 'Actions'],
    ['check-ins', 'Check-ins'],
    ['evaluations', 'Evaluations'],
    ['evidence', 'Evidence'],
    ['interventions', 'Interventions'],
  ];
  return (
    <>
      <nav className="portal-tabs" aria-label="Goal sections">
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            aria-current={section === key ? 'page' : undefined}
            href={`/app/goals/${id}${key === 'overview' ? '' : `/${key}`}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="portal-heading">
        <div>
          <Badge>
            {goal.status} · {goalHealth(goal)}
          </Badge>
          <h2>{goal.title}</h2>
          <p>Due {goal.deadline}</p>
        </div>
        <CircularProgress value={weightedProgress(goal.milestones)} label="Weighted goal progress" />
      </div>
      {goal.status === 'archived' && (
        <Notice>This goal is archived. Its history remains available and cannot be changed.</Notice>
      )}
      {(section === 'overview' || section === 'plan') && (
        <>
          <GoalSummary input={goal} />
          <div className="actions">
            <ActionLink href={`/app/goals/${id}/edit`} secondary>
              Adjust Plan
            </ActionLink>
            <ActionLink href={`/app/goals/${id}/actions`}>Complete Action</ActionLink>
            <ActionLink href={`/app/goals/${id}/evidence`} secondary>
              Add Evidence
            </ActionLink>
            <ActionLink href={`/app/goals/${id}/evaluations`} secondary>
              Complete Evaluation
            </ActionLink>
          </div>
          {goal.status === 'active' && (
            <Mutation
              title="Record Progress"
              onSubmit={async (data) =>
                setGoal(
                  await goalService.recordProgress(
                    id,
                    String(data.get('milestone')),
                    Number(data.get('current')),
                    String(data.get('note')),
                  ),
                )
              }
            >
              <label className="field">
                Milestone
                <select name="milestone" required>
                  {goal.milestones.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} (target {item.target} {item.unit})
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Current progress amount" name="current" type="number" min={0} required />
              <Textarea label="Progress note" name="note" />
            </Mutation>
          )}
          <h3>Milestones</h3>
          {goal.milestones.map((item) => (
            <Card key={item.id}>
              <h4>{item.title}</h4>
              <p>
                {item.current}/{item.target} {item.unit} · Weight {item.weight} · Due {item.deadline}
              </p>
              <progress value={item.current} max={item.target} aria-label={`${item.title} progress`} />
            </Card>
          ))}
          <div className="actions">
            <Link href={`/app/goals/${id}/edit`}>Add Milestone</Link>
            <Link href="/app/learning">View Learning</Link>
            <Link href="/app/mentor">Request Mentor Help</Link>
          </div>
          <Card>
            <h3>Mentor feedback</h3>
            <p>No mentor feedback has been shared for this goal.</p>
            <Link href="/app/mentor">View mentor assignment</Link>
          </Card>
          {goal.status !== 'archived' && (
            <div className="actions">
              {(goal.status === 'active'
                ? [
                    ['Pause Goal', 'paused'],
                    ['Mark Goal Achieved', 'achieved'],
                    ['Archive Goal', 'archived'],
                  ]
                : goal.status === 'paused'
                  ? [
                      ['Resume Goal', 'active'],
                      ['Archive Goal', 'archived'],
                    ]
                  : [['Archive Goal', 'archived']]
              ).map(([label, status]) => (
                <Mutation
                  key={status}
                  title={label}
                  confirmation="This changes the goal’s lifecycle. Paused goals stop accepting action updates; archived goals become read-only. Achievement requires all weighted milestones to be complete."
                  onSubmit={async (data) =>
                    setGoal(await goalService.setStatus(id, status as GoalStatus, String(data.get('reason'))))
                  }
                >
                  <Textarea label="Reason for change" name="reason" required />
                </Mutation>
              ))}
            </div>
          )}
          <h3>Activity timeline</h3>
          <Timeline
            items={goal.timeline.map((item) => ({
              title: item.title,
              date: new Date(item.at).toLocaleString(),
              detail: item.detail,
            }))}
          />
        </>
      )}
      {(section === 'actions' || section === 'check-ins') && (
        <ActionPlan goal={goal} onChange={setGoal} history={section === 'check-ins'} />
      )}
      {section === 'evidence' && (
        <>
          <EvidenceForm goal={goal} onChange={setGoal} />
          {!goal.evidence.length && <p>No evidence added yet.</p>}
          {goal.evidence.map((item) => (
            <Card key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer">
                  Open evidence
                </a>
              )}
              {item.fileName && (
                <p>Selected file: {item.fileName} · Metadata only in demonstration; no upload was sent.</p>
              )}
              <small>{item.createdAt}</small>
            </Card>
          ))}
        </>
      )}
      {section === 'evaluations' && <Evaluations goal={goal} onChange={setGoal} />}
      {section === 'interventions' && (
        <>
          {!goal.interventions.length && (
            <Card>
              <h3>No open interventions</h3>
              <p>Submit an evaluation when you need help or want to review your progress.</p>
              <ActionLink href={`/app/goals/${id}/evaluations`}>Start Evaluation</ActionLink>
            </Card>
          )}
          {goal.interventions.map((item) => (
            <InterventionCard key={item.id} goal={goal} intervention={item} onChange={setGoal} />
          ))}
        </>
      )}
    </>
  );
}

export function Mutation({
  title,
  children,
  onSubmit,
  confirmation,
}: {
  title: string;
  children?: ReactNode;
  onSubmit: (data: FormData) => Promise<void>;
  confirmation?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  return (
    <Modal
      title={title}
      trigger={
        <Button
          variant="outline"
          onClick={() => {
            setSuccess(false);
            setError('');
          }}
        >
          {title}
        </Button>
      }
    >
      <p>{confirmation}</p>
      {success ? (
        <Notice>Saved. You can close this dialog.</Notice>
      ) : (
        <SafeForm
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            const data = new FormData(e.currentTarget);
            try {
              await onSubmit(data);
              setSuccess(true);
            } catch (error) {
              setError((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {children}
          {error && <Notice error>{error}</Notice>}
          <Button loading={busy} type="submit">
            {confirmation ? 'Confirm' : 'Save'}
          </Button>
        </SafeForm>
      )}
    </Modal>
  );
}
function EvidenceForm({ goal, onChange }: { goal: Goal; onChange: (goal: Goal) => void }) {
  if (goal.status === 'archived') return null;
  return (
    <Mutation
      title="Add Evidence"
      onSubmit={async (data) => {
        const file = data.get('file') as File | null;
        if (
          file?.size &&
          (file.size > 5 * 1024 * 1024 || !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type))
        )
          throw new Error('Choose a PDF, PNG or JPG under 5 MB.');
        onChange(
          await goalService.addEvidence(goal.id, {
            title: String(data.get('title')),
            description: String(data.get('description')),
            url: String(data.get('url')),
            fileName: file?.size ? file.name : undefined,
          }),
        );
      }}
    >
      <Field label="Evidence title" name="title" required />
      <Textarea label="Evidence description" name="description" />
      <Field label="Evidence link" name="url" type="url" placeholder="https://" />
      <Field label="Evidence file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" />
      <p>Files stay on your device; this demonstration records the name only.</p>
    </Mutation>
  );
}
function ActionPlan({
  goal,
  onChange,
  history,
}: {
  goal: Goal;
  onChange: (goal: Goal) => void;
  history: boolean;
}) {
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<GoalAction>(() => newAction(goal.deadline, goal.milestones[0]?.id || ''));
  const occurrences = goal.occurrences
    .filter((item) => filter === 'All' || item.status === filter)
    .filter((item) => !history || ['Completed', 'Skipped', 'Missed', 'Rescheduled'].includes(item.status));
  return (
    <>
      <div className="portal-toolbar">
        <Select
          label="Occurrence status"
          options={['All', 'Upcoming', 'Due', 'Completed', 'Missed', 'Skipped', 'Rescheduled']}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <Link href={`/app/goals/${goal.id}/check-ins`}>View History</Link>
      </div>
      {goal.status !== 'archived' && (
        <Mutation
          title="Add Action"
          onSubmit={async () => {
            onChange(await goalService.saveAction(goal.id, edit));
            setEdit(newAction(goal.deadline, goal.milestones[0]?.id || ''));
          }}
        >
          <ActionFields
            action={edit}
            milestones={goal.milestones}
            deadline={goal.deadline}
            onChange={setEdit}
          />
        </Mutation>
      )}
      {!occurrences.length && (
        <Card>
          <h3>No matching action occurrences</h3>
          <p>Change the filter or add an action to the plan.</p>
        </Card>
      )}
      {occurrences
        .slice(
          (Math.min(page, Math.max(1, Math.ceil(occurrences.length / 20))) - 1) * 20,
          Math.min(page, Math.max(1, Math.ceil(occurrences.length / 20))) * 20,
        )
        .map((occurrence) => (
          <OccurrenceCard
            key={`${occurrence.id}:${goal.version}`}
            goal={goal}
            occurrence={occurrence}
            onChange={onChange}
          />
        ))}
      <Pagination
        page={Math.min(page, Math.max(1, Math.ceil(occurrences.length / 20)))}
        pages={Math.max(1, Math.ceil(occurrences.length / 20))}
        onChange={setPage}
      />
      <h3>Action definitions</h3>
      {goal.actions.map((action) => (
        <ActionEditor key={`${action.id}:${goal.version}`} goal={goal} action={action} onChange={onChange} />
      ))}
    </>
  );
}
function ActionEditor({
  goal,
  action,
  onChange,
}: {
  goal: Goal;
  action: GoalAction;
  onChange: (goal: Goal) => void;
}) {
  const [edit, setEdit] = useState(action);
  return (
    <Card>
      <h4>{action.title}</h4>
      <p>
        {action.frequency} · {action.duration} minutes · {action.paused ? 'Paused' : 'Active'}
      </p>
      {goal.status !== 'archived' && (
        <div className="actions">
          <Mutation
            title="Edit Action"
            onSubmit={async () => onChange(await goalService.saveAction(goal.id, edit))}
          >
            <ActionFields
              action={edit}
              milestones={goal.milestones}
              deadline={goal.deadline}
              onChange={setEdit}
            />
          </Mutation>
          <Mutation
            title={action.paused ? 'Resume Action' : 'Pause Action'}
            confirmation="This changes future action scheduling. Completed history remains available."
            onSubmit={async () =>
              onChange(await goalService.saveAction(goal.id, { ...action, paused: !action.paused }))
            }
          />
          <Mutation
            title="Delete Action"
            confirmation="Future occurrences will be removed. Completed and skipped outcomes remain in the goal history."
            onSubmit={async (data) =>
              onChange(await goalService.deleteAction(goal.id, action.id, String(data.get('reason'))))
            }
          >
            <Textarea label="Deletion reason" name="reason" required />
          </Mutation>
        </div>
      )}
    </Card>
  );
}
function OccurrenceCard({
  goal,
  occurrence,
  onChange,
}: {
  goal: Goal;
  occurrence: Occurrence;
  onChange: (goal: Goal) => void;
}) {
  const action = goal.actions.find((item) => item.id === occurrence.actionId);
  const operations: [string, OccurrenceStatus][] =
    occurrence.status === 'Completed'
      ? [['Undo Completion', 'Due']]
      : [
          ['Complete', 'Completed'],
          ['Skip', 'Skipped'],
          ['Reschedule', 'Rescheduled'],
        ];
  return (
    <Card>
      <Badge>{occurrence.status}</Badge>
      <h3>{action?.title || 'Deleted action'}</h3>
      <p>
        {occurrence.scheduledDate} · {action?.duration || 0} minutes
      </p>
      {occurrence.reason && <p>{occurrence.reason}</p>}
      {goal.status === 'active' && action && !action.paused && (
        <div className="actions">
          {operations.map(([label, state]) => (
            <Mutation
              key={label}
              title={label}
              onSubmit={async (data) =>
                onChange(
                  await goalService.updateOccurrence(
                    goal.id,
                    occurrence.id,
                    state,
                    String(data.get('reason') || ''),
                    String(data.get('date') || ''),
                    String(data.get('evidence') || ''),
                  ),
                )
              }
            >
              {state === 'Completed' && action.evidenceRequired && (
                <label className="field">
                  Required evidence
                  <select name="evidence" required>
                    <option value="">Choose evidence</option>
                    {goal.evidence.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                  <Link href={`/app/goals/${goal.id}/evidence`}>Add Evidence</Link>
                </label>
              )}
              {state === 'Skipped' && (
                <Textarea label="Skip reason" name="reason" required={action.skipReasonRequired} />
              )}
              {state === 'Rescheduled' && (
                <>
                  <Field
                    label="New date"
                    name="date"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    max={goal.deadline}
                    required
                  />
                  <Textarea label="Reschedule reason" name="reason" />
                </>
              )}
            </Mutation>
          ))}
        </div>
      )}
    </Card>
  );
}
const blankEvaluation: EvaluationInput = {
  activitiesCompleted: '',
  wentWell: '',
  challenges: '',
  blockers: '',
  adjustment: '',
  mentorAssistance: false,
  confidence: 3,
  privateReflection: '',
};
function Evaluations({ goal, onChange }: { goal: Goal; onChange: (goal: Goal) => void }) {
  const [input, setInput] = useState<EvaluationInput>(blankEvaluation);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void goalService
      .evaluationDraft(goal.id)
      .then((saved) => {
        if (saved) setInput(saved);
      })
      .catch((e: Error) => setError(e.message));
  }, [goal.id]);
  const fields: [keyof EvaluationInput, string][] = [
    ['activitiesCompleted', 'Activities completed'],
    ['wentWell', 'What went well'],
    ['challenges', 'Challenges'],
    ['blockers', 'Blockers'],
    ['adjustment', 'Planned adjustment'],
    ['privateReflection', 'Optional private reflection'],
  ];
  return (
    <>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      {goal.status !== 'archived' && (
        <Card>
          <h3>Start Evaluation</h3>
          <p>
            Current weighted progress: {weightedProgress(goal.milestones)}%. Submission captures this progress
            and the current milestones permanently.
          </p>
          <SafeForm
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError('');
              try {
                onChange(await goalService.submitEvaluation(goal.id, input));
                setInput(blankEvaluation);
                setMessage('Evaluation submitted as an immutable snapshot.');
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {fields.map(([key, label]) => (
              <Textarea
                key={key}
                label={label}
                required={['wentWell', 'challenges', 'adjustment'].includes(key)}
                value={String(input[key])}
                onChange={(e) => setInput({ ...input, [key]: e.target.value })}
              />
            ))}
            <Field
              label="Confidence score (1–5)"
              type="number"
              min={1}
              max={5}
              required
              value={input.confidence}
              onChange={(e) => setInput({ ...input, confidence: Number(e.target.value) })}
            />
            <Check
              checked={input.mentorAssistance}
              onChange={(e) => setInput({ ...input, mentorAssistance: e.target.checked })}
            >
              Request Mentor Assistance
            </Check>
            <p>Your private reflection is excluded from guardian and mentor projections.</p>
            <div className="actions">
              <Button type="submit" loading={busy}>
                Submit Evaluation
              </Button>
              <Button
                type="button"
                variant="outline"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await goalService.saveEvaluationDraft(goal.id, input);
                    setMessage('Evaluation draft saved.');
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Save Draft
              </Button>
            </div>
          </SafeForm>
        </Card>
      )}
      {!goal.evaluations.length && <p>No submitted evaluations yet.</p>}
      {goal.evaluations.map((evaluation, index) => (
        <Card key={evaluation.id}>
          <h3>Evaluation · {new Date(evaluation.submittedAt).toLocaleDateString()}</h3>
          <Badge>Immutable snapshot</Badge>
          <p>
            {evaluation.progress}% progress · Confidence {evaluation.confidence}/5
          </p>
          <dl>
            {fields.map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{String(evaluation[key]) || 'Not provided'}</dd>
              </div>
            ))}
          </dl>
          {index > 0 && (
            <Modal
              title="Compare with Previous"
              trigger={<Button variant="outline">Compare with Previous</Button>}
            >
              <p>
                Previous: {goal.evaluations[index - 1].progress}% · Current: {evaluation.progress}%
              </p>
              <p>
                Confidence: {goal.evaluations[index - 1].confidence} → {evaluation.confidence}
              </p>
              <p>Previous adjustment: {goal.evaluations[index - 1].adjustment}</p>
              <p>Current adjustment: {evaluation.adjustment}</p>
            </Modal>
          )}
          <Link href={`/app/goals/${goal.id}`}>View Timeline</Link>
        </Card>
      ))}
    </>
  );
}
function InterventionCard({
  goal,
  intervention,
  onChange,
}: {
  goal: Goal;
  intervention: Intervention;
  onChange: (goal: Goal) => void;
}) {
  return (
    <Card>
      <Badge>{intervention.status}</Badge>
      <h3>{intervention.trigger}</h3>
      <h4>Risk signals</h4>
      <ul>
        {intervention.riskSignals.map((signal) => (
          <li key={signal}>{signal}</li>
        ))}
      </ul>
      <h4>Recommended recovery steps</h4>
      <ol>
        {intervention.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p>Mentor recommendation: {intervention.mentorRecommendation}</p>
      <p>Member response: {intervention.memberResponse || 'Awaiting response'}</p>
      <p>Follow-up: {intervention.followUpDate}</p>
      <p>Outcome: {intervention.outcome || 'Not yet recorded'}</p>
      {goal.status !== 'archived' && intervention.status !== 'Completed' && (
        <div className="actions">
          {(
            [
              ['Accept Recommendation', 'Accepted'],
              ['Request Changes', 'Changes requested'],
              ['Mark Follow-up Complete', 'Completed'],
            ] as const
          ).map(([label, status]) => (
            <Mutation
              key={label}
              title={label}
              onSubmit={async (data) =>
                onChange(
                  await goalService.respondToIntervention(
                    goal.id,
                    intervention.id,
                    String(data.get('response')),
                    status,
                  ),
                )
              }
            >
              <Textarea
                label={status === 'Completed' ? 'Follow-up outcome' : 'Member response'}
                name="response"
                required
              />
            </Mutation>
          ))}
          <ActionLink href={`/app/goals/${goal.id}/edit`} secondary>
            Update Action Plan
          </ActionLink>
          <Link href="/app/mentor/sessions">Book Mentor Review</Link>
        </div>
      )}
    </Card>
  );
}
