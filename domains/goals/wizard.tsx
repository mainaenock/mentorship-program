'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Check,
  Field,
  Modal,
  Notice,
  SafeForm,
  Select,
  Skeleton,
  Stepper,
  Textarea,
} from '../shared/ui';
import { goalService } from './demo-service';
import { smartAssessment } from './model';
import type { Frequency, GoalAction, GoalInput, Milestone } from './contracts';

export const blankGoal = (): GoalInput => ({
  category: '',
  title: '',
  description: '',
  currentPosition: '',
  target: '',
  motivation: '',
  deadline: '',
  milestones: [],
  actions: [],
});
const steps = [
  'Choose category',
  'Describe the goal',
  'Record current position',
  'Define target',
  'Why this matters',
  'Choose deadline',
  'Define milestones',
  'Define actions',
  'Review SMART assessment',
  'Review complete goal',
  'Create goal',
];
const frequencies: Frequency[] = [
  'One-time',
  'Daily',
  'Weekly',
  'Selected weekdays',
  'Monthly',
  'Custom recurrence',
];
export function GoalWizard({ id }: { id?: string }) {
  const router = useRouter();
  const [input, setInput] = useState<GoalInput>(blankGoal);
  const [categories, setCategories] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function load() {
    setError('');
    try {
      const [options, saved] = await Promise.all([
        goalService.categories(),
        id ? goalService.draft(id).then((draft) => draft || goalService.get(id)) : goalService.draft(),
      ]);
      setCategories(options);
      if (id && !saved) throw new Error('Goal not found.');
      if (saved) {
        setInput(saved);
        if ('version' in saved && typeof saved.version === 'number') setVersion(saved.version);
      }
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load(); /* Route remount owns draft loading. */
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    const guardNavigation = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (
        !dirty ||
        !link ||
        link.target === '_blank' ||
        !link.href ||
        link.getAttribute('href')?.startsWith('#')
      )
        return;
      if (
        !window.confirm('Leave this goal? Unsaved changes will be lost. Your last saved draft is retained.')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', guardNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', guardNavigation, true);
    };
  }, [dirty]);
  function change<K extends keyof GoalInput>(key: K, value: GoalInput[K]) {
    setInput((old) => ({ ...old, [key]: value }));
    setDirty(true);
    setMessage('');
  }
  async function saveDraft() {
    setBusy(true);
    setError('');
    try {
      await goalService.saveDraft(input, id, version);
      setDirty(false);
      setMessage('Draft saved for this account in this browser tab.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    setBusy(true);
    setError('');
    try {
      const goal = id ? await goalService.update(id, version, input) : await goalService.create(input);
      if (id) await goalService.discardDraft(id);
      setDirty(false);
      router.push(`/app/goals/${goal.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return error ? (
      <Notice error>
        {error}
        <Button onClick={load}>Retry</Button>
      </Notice>
    ) : (
      <Skeleton />
    );
  const assessment = smartAssessment(input);
  const milestoneChange = (index: number, value: Milestone) =>
    change(
      'milestones',
      input.milestones.map((item, i) => (i === index ? value : item)),
    );
  return (
    <div className="goal-wizard">
      <Stepper steps={steps} current={step} />
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <SafeForm
        onSubmit={(event) => {
          event.preventDefault();
          setError('');
          if (step === 6 && !input.milestones.length) {
            setError('Add at least one milestone.');
            return;
          }
          if (step === 7 && !input.actions.length) {
            setError('Add at least one action.');
            return;
          }
          if (step === 8 && assessment.some((item) => !item.passed)) {
            setError('Resolve the SMART checks before continuing.');
            return;
          }
          if (step === 10) void submit();
          else setStep(step + 1);
        }}
      >
        {step === 0 && (
          <Select
            label="Goal category"
            options={categories}
            value={input.category}
            required
            onChange={(e) => change('category', e.target.value)}
          />
        )}
        {step === 1 && (
          <>
            <Field
              label="Goal title"
              value={input.title}
              minLength={5}
              maxLength={160}
              required
              onChange={(e) => change('title', e.target.value)}
            />
            <Textarea
              label="Describe the outcome"
              minLength={10}
              required
              value={input.description}
              onChange={(e) => change('description', e.target.value)}
            />
          </>
        )}
        {step === 2 && (
          <Textarea
            label="Where are you starting from?"
            required
            value={input.currentPosition}
            onChange={(e) => change('currentPosition', e.target.value)}
          />
        )}
        {step === 3 && (
          <Textarea
            label="What will success look like?"
            required
            value={input.target}
            onChange={(e) => change('target', e.target.value)}
          />
        )}
        {step === 4 && (
          <Textarea
            label="Why does this goal matter to you?"
            minLength={10}
            required
            value={input.motivation}
            onChange={(e) => change('motivation', e.target.value)}
          />
        )}
        {step === 5 && (
          <Field
            label="Goal deadline"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            required
            value={input.deadline}
            onChange={(e) => change('deadline', e.target.value)}
          />
        )}
        {step === 6 && (
          <>
            <p>
              Weights describe each milestone’s share of the goal. Progress uses current ÷ target, weighted
              across your plan.
            </p>
            {input.milestones.map((milestone, index) => (
              <Card key={milestone.id}>
                <h3>Milestone {index + 1}</h3>
                <Field
                  label="Milestone title"
                  required
                  value={milestone.title}
                  onChange={(e) => milestoneChange(index, { ...milestone, title: e.target.value })}
                />
                <div className="portal-grid">
                  <Field
                    label="Target amount"
                    type="number"
                    min={1}
                    required
                    value={milestone.target}
                    onChange={(e) => milestoneChange(index, { ...milestone, target: Number(e.target.value) })}
                  />
                  <Field
                    label="Unit of measurement"
                    required
                    value={milestone.unit}
                    onChange={(e) => milestoneChange(index, { ...milestone, unit: e.target.value })}
                  />
                  <Field
                    label="Current amount"
                    type="number"
                    min={0}
                    max={milestone.target}
                    required
                    value={milestone.current}
                    onChange={(e) =>
                      milestoneChange(index, { ...milestone, current: Number(e.target.value) })
                    }
                  />
                  <Field
                    label="Milestone weight"
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={milestone.weight}
                    onChange={(e) => milestoneChange(index, { ...milestone, weight: Number(e.target.value) })}
                  />
                </div>
                <Field
                  label="Milestone deadline"
                  type="date"
                  max={input.deadline}
                  required
                  value={milestone.deadline}
                  onChange={(e) => milestoneChange(index, { ...milestone, deadline: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    change(
                      'milestones',
                      input.milestones.filter((item) => item.id !== milestone.id),
                    )
                  }
                >
                  Remove Milestone
                </Button>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                change('milestones', [
                  ...input.milestones,
                  {
                    id: crypto.randomUUID(),
                    title: '',
                    target: 1,
                    current: 0,
                    unit: '',
                    weight: 1,
                    deadline: input.deadline,
                  },
                ])
              }
            >
              Add Milestone
            </Button>
          </>
        )}
        {step === 7 && (
          <>
            {input.actions.map((action, index) => (
              <Card key={action.id}>
                <h3>Action {index + 1}</h3>
                <ActionFields
                  action={action}
                  milestones={input.milestones}
                  deadline={input.deadline}
                  onChange={(value) =>
                    change(
                      'actions',
                      input.actions.map((item, i) => (i === index ? value : item)),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    change(
                      'actions',
                      input.actions.filter((item) => item.id !== action.id),
                    )
                  }
                >
                  Remove Action
                </Button>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                change('actions', [
                  ...input.actions,
                  newAction(input.deadline, input.milestones[0]?.id || ''),
                ])
              }
            >
              Add Action
            </Button>
          </>
        )}
        {step === 8 && (
          <>
            {assessment.map((item, index) => (
              <Card key={item.label}>
                <h3>
                  {item.passed ? '✓' : 'Needs work'} · {item.label}
                </h3>
                <p>{item.explanation}</p>
                {!item.passed && (
                  <Button type="button" variant="outline" onClick={() => setStep([1, 6, 7, 4, 5][index])}>
                    Edit {item.label}
                  </Button>
                )}
              </Card>
            ))}
            <Notice>This is a transparent completeness check. No AI prediction or guarantee is used.</Notice>
          </>
        )}
        {step === 9 && (
          <>
            <GoalSummary input={input} />
            {steps.slice(0, 8).map((label, index) => (
              <Button key={label} type="button" variant="ghost" onClick={() => setStep(index)}>
                Edit Section: {label}
              </Button>
            ))}
          </>
        )}
        {step === 10 && (
          <>
            <h3>{id ? 'Save your revised plan' : 'Ready for your first action'}</h3>
            <p>
              {input.title} · {input.milestones.length} milestones · {input.actions.length} actions
            </p>
            <Notice>
              Your plan will be saved in this tab’s demo account. Production persistence will use the goal
              service contract.
            </Notice>
          </>
        )}
        <div className="actions">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || busy}
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
          <Button type="submit" loading={busy}>
            {step === 10 ? (id ? 'Save Goal' : 'Create Goal') : step === 8 ? 'Review Goal' : 'Continue'}
          </Button>
          <Button type="button" variant="ghost" loading={busy} onClick={saveDraft}>
            Save Draft
          </Button>
        </div>
      </SafeForm>
      <Modal title="Cancel goal editing?" trigger={<Button variant="ghost">Cancel</Button>}>
        <p>
          {dirty
            ? 'Unsaved changes will be discarded. Your last saved draft is retained.'
            : 'Your saved draft will remain available.'}
        </p>
        <Button
          variant="destructive"
          onClick={() => {
            setDirty(false);
            router.push('/app/goals');
          }}
        >
          Discard unsaved progress
        </Button>
      </Modal>
    </div>
  );
}
export function newAction(deadline: string, milestoneId: string): GoalAction {
  return {
    id: crypto.randomUUID(),
    goalId: '',
    title: '',
    description: '',
    frequency: 'One-time',
    days: [],
    intervalDays: 1,
    duration: 15,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: deadline,
    reminder: '',
    evidenceRequired: false,
    skipReasonRequired: true,
    milestoneId,
    contribution: 1,
    paused: false,
  };
}
export function ActionFields({
  action,
  milestones,
  deadline,
  onChange,
}: {
  action: GoalAction;
  milestones: Milestone[];
  deadline: string;
  onChange: (action: GoalAction) => void;
}) {
  const set = <K extends keyof GoalAction>(key: K, value: GoalAction[K]) =>
    onChange({ ...action, [key]: value });
  return (
    <>
      <Field
        label="Action title"
        required
        value={action.title}
        onChange={(e) => set('title', e.target.value)}
      />
      <Textarea
        label="Action description"
        value={action.description}
        onChange={(e) => set('description', e.target.value)}
      />
      <Select
        label="Frequency"
        required
        options={frequencies}
        value={action.frequency}
        onChange={(e) => set('frequency', e.target.value as Frequency)}
      />
      {action.frequency === 'Selected weekdays' && (
        <fieldset>
          <legend>Days</legend>
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
            (day, index) => (
              <Check
                key={day}
                checked={action.days.includes(index)}
                onChange={(e) =>
                  set(
                    'days',
                    e.target.checked
                      ? [...action.days, index]
                      : action.days.filter((value) => value !== index),
                  )
                }
              >
                {day}
              </Check>
            ),
          )}
        </fieldset>
      )}
      {action.frequency === 'Custom recurrence' && (
        <Field
          label="Repeat every number of days"
          type="number"
          min={1}
          max={365}
          required
          value={action.intervalDays}
          onChange={(e) => set('intervalDays', Number(e.target.value))}
        />
      )}
      <div className="portal-grid">
        <Field
          label="Duration in minutes"
          type="number"
          min={1}
          max={1440}
          required
          value={action.duration}
          onChange={(e) => set('duration', Number(e.target.value))}
        />
        <Field
          label="Start date"
          type="date"
          max={deadline}
          required
          value={action.startDate}
          onChange={(e) => set('startDate', e.target.value)}
        />
        <Field
          label="End date"
          type="date"
          min={action.startDate}
          max={deadline}
          required
          value={action.endDate}
          onChange={(e) => set('endDate', e.target.value)}
        />
        <Field
          label="Reminder time"
          type="time"
          value={action.reminder}
          onChange={(e) => set('reminder', e.target.value)}
        />
      </div>
      <label className="field">
        Contributes to milestone
        <select value={action.milestoneId} onChange={(e) => set('milestoneId', e.target.value)}>
          <option value="">No automatic contribution</option>
          {milestones.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      {action.milestoneId && (
        <Field
          label="Contribution per completion"
          type="number"
          min={0}
          required
          value={action.contribution}
          onChange={(e) => set('contribution', Number(e.target.value))}
        />
      )}
      <Check checked={action.evidenceRequired} onChange={(e) => set('evidenceRequired', e.target.checked)}>
        Evidence required to complete
      </Check>
      <Check
        checked={action.skipReasonRequired}
        onChange={(e) => set('skipReasonRequired', e.target.checked)}
      >
        Require a reason when skipped
      </Check>
    </>
  );
}
export function GoalSummary({ input }: { input: GoalInput }) {
  return (
    <Card>
      <h3>{input.title}</h3>
      <p>
        {input.category} · Due {input.deadline}
      </p>
      <p>{input.description}</p>
      <dl>
        <dt>Starting point</dt>
        <dd>{input.currentPosition}</dd>
        <dt>Target</dt>
        <dd>{input.target}</dd>
        <dt>Why it matters</dt>
        <dd>{input.motivation}</dd>
      </dl>
      <h4>Milestones</h4>
      <ul>
        {input.milestones.map((item) => (
          <li key={item.id}>
            {item.title}: {item.current}/{item.target} {item.unit} · weight {item.weight} · {item.deadline}
          </li>
        ))}
      </ul>
      <h4>Actions</h4>
      <ul>
        {input.actions.map((item) => (
          <li key={item.id}>
            {item.title} · {item.frequency} · {item.duration} minutes
          </li>
        ))}
      </ul>
    </Card>
  );
}
