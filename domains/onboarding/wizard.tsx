'use client';
import { SafeForm } from '../shared/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { config, money, analytics } from '../shared/config';
import { ageAt } from '../shared/contracts';
import { readSession, saveSession } from '../shared/demo-services';
import { ActionLink, Button, Check, Field, Notice, Select, Stepper, Textarea } from '../shared/ui';
const steps = [
  'Your age',
  'Policies and consent',
  'Your profile',
  'Your interests',
  'Communication preferences',
  'Membership',
  'Your first goal',
];
type Draft = Record<string, string>;
export function Onboarding() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(config.plans[0]);
  useEffect(() => {
    const planId = sessionStorage.getItem('gap-plan');
    setSelectedPlan(config.plans.find((plan) => plan.id === planId) || config.plans[0]);
    const session = readSession();
    if (!session || session.expiresAt <= Date.now()) {
      router.replace('/login?reason=expired');
      return;
    }
    if (session.status === 'unverified') {
      router.replace('/verify-email');
      return;
    }
    if (session.status === 'guardian_pending') setPending(true);
    if (
      session.status === 'suspended' ||
      session.status === 'activation_pending' ||
      session.status === 'mentor_pending'
    ) {
      router.replace('/account-status');
      return;
    }
    if (session.status === 'active') {
      router.replace('/dashboard');
      return;
    }
    try {
      const saved = sessionStorage.getItem('gap-onboarding');
      if (saved) {
        const data = JSON.parse(saved);
        setDraft(data.draft);
        setCurrent(data.current);
      }
    } catch {
      sessionStorage.removeItem('gap-onboarding');
    }
    setReady(true);
  }, [router]);
  function persist(next: Draft, step: number) {
    setDraft(next);
    setCurrent(step);
    const safe = Object.fromEntries(
      Object.entries(next).filter(([key]) => !key.startsWith('guardian') && key !== 'relationship'),
    );
    sessionStorage.setItem('gap-onboarding', JSON.stringify({ draft: safe, current: step }));
  }
  const minor = draft.dob ? ageAt(draft.dob) < config.adultAge : false;
  if (!ready) return <Notice>Checking your session…</Notice>;
  if (pending)
    return (
      <div className="form-page">
        <span className="eyebrow">GUARDIAN CONSENT</span>
        <h1>A little support before your next step.</h1>
        <Notice>Your demo account is pending guardian consent. Restricted features remain locked.</Notice>
        <p>
          Your guardian must independently verify their contact and review specific permissions. A real
          invitation will be sent by the backend when connected.
        </p>
        <ActionLink href="/guardian/invitation/demo-invitation" secondary>
          Review demo guardian flow
        </ActionLink>
        <p>
          <Link href="/contact">Need help with the invitation?</Link>
        </p>
      </div>
    );
  return (
    <div className="form-page">
      <span className="eyebrow">MAKE YOURSELF AT HOME</span>
      <h1>A path that fits you.</h1>
      <Stepper steps={steps} current={current} />
      <SafeForm
        className="form-stack"
        key={current}
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          const form = new FormData(e.currentTarget);
          const next: Draft = {
            ...draft,
            ...Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)])),
            ...(current === 3
              ? { additionalInterests: form.getAll('additionalInterests').map(String).join('|') }
              : {}),
          };
          if (
            current === 0 &&
            (ageAt(next.dob) < 0 || ageAt(next.dob) > 120 || Number.isNaN(ageAt(next.dob)))
          ) {
            setError('Enter a valid date of birth.');
            return;
          }
          if (current === 1 && minor) {
            const session = readSession();
            if (session) saveSession({ ...session, role: 'minor', status: 'guardian_pending' });
            persist({ dob: draft.dob }, 1);
            setPending(true);
            return;
          }
          if (current === steps.length - 1) {
            if (next.targetDate <= new Date().toISOString().slice(0, 10)) {
              setError('Choose a future target date.');
              return;
            }
            const session = readSession();
            if (session)
              saveSession({
                ...session,
                status: config.membershipActivationRequired ? 'activation_pending' : 'active',
              });
            sessionStorage.removeItem('gap-onboarding');
            sessionStorage.setItem(
              'gap-first-goal',
              JSON.stringify({
                title: next.goal,
                measure: next.measure,
                targetDate: next.targetDate,
                action: next.action,
              }),
            );
            analytics.track('onboarding_completed', { plan: selectedPlan.id });
            router.push(config.membershipActivationRequired ? '/account-pending' : '/dashboard');
            return;
          }
          persist(next, current + 1);
        }}
      >
        {current === 0 && (
          <>
            <p>
              We use your age to provide the right experience and determine whether guardian consent is
              needed.
            </p>
            <Field
              label="Date of birth"
              type="date"
              name="dob"
              defaultValue={draft.dob}
              max={new Date().toISOString().slice(0, 10)}
              required
            />
          </>
        )}
        {current === 1 &&
          (minor ? (
            <>
              <Notice>
                A guardian needs to review and approve your participation. You cannot grant this permission
                yourself.
              </Notice>
              <Field label="Guardian name" name="guardianName" required />
              <Select
                label="Relationship"
                name="relationship"
                options={['Parent', 'Legal guardian']}
                required
              />
              <Field label="Guardian email" type="email" name="guardianEmail" required />
              <p>
                This demonstration does not send invitations. Guardian details are not saved on this device.
              </p>
            </>
          ) : (
            <>
              <p>
                Review the policies before continuing. Required consent is recorded against policy version 1.0
                in the future backend.
              </p>
              <Check name="terms" required defaultChecked={draft.terms === 'on'}>
                I accept the <Link href="/terms">Terms of use</Link>.
              </Check>
              <Check name="privacy" required defaultChecked={draft.privacy === 'on'}>
                I have read the <Link href="/privacy">Privacy Policy</Link>.
              </Check>
              <Check name="safety" required defaultChecked={draft.safety === 'on'}>
                I agree to the <Link href="/safeguarding">Safeguarding standards</Link>.
              </Check>
            </>
          ))}
        {current === 2 && (
          <>
            <Field
              label="First name"
              name="firstName"
              autoComplete="given-name"
              defaultValue={draft.firstName}
              required
            />
            <Field
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              defaultValue={draft.lastName}
              required
            />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              placeholder="+254 7XX XXX XXX"
              defaultValue={draft.phone}
              required
              pattern="\+?[0-9 ()-]{9,20}"
            />
            <Select
              label="Country"
              name="country"
              options={config.countries}
              defaultValue={draft.country || 'Kenya'}
              required
            />
            <Field label="County or region (optional)" name="region" defaultValue={draft.region} />
            <Select
              label="Preferred language"
              name="language"
              options={config.languages}
              defaultValue={draft.language || 'English'}
              required
            />
          </>
        )}
        {current === 3 && (
          <>
            <p>Choose a starting interest. You can expand your interests later.</p>
            <Select
              label="Primary interest"
              name="interest"
              options={config.categories}
              defaultValue={draft.interest}
              required
            />
            <fieldset>
              <legend>Additional interests (optional)</legend>
              {config.categories.map((interest) => (
                <Check
                  key={interest}
                  name="additionalInterests"
                  value={interest}
                  defaultChecked={draft.additionalInterests?.split('|').includes(interest)}
                >
                  {interest}
                </Check>
              ))}
            </fieldset>
          </>
        )}
        {current === 4 && (
          <>
            <p>
              Essential account and safeguarding messages are required. Choose whether to receive optional
              updates.
            </p>
            <Select
              label="Optional learning and progress updates"
              name="communications"
              options={['No optional updates', 'Email', 'SMS', 'Email and SMS']}
              defaultValue={draft.communications || 'No optional updates'}
              required
            />
          </>
        )}
        {current === 5 && (
          <>
            <h3>{selectedPlan.name}</h3>
            <p>
              {selectedPlan.price === null
                ? 'This plan’s pricing is awaiting publication. No paid entitlement will be activated.'
                : `${money(selectedPlan.price)} · ${selectedPlan.period}`}
            </p>
            <p>
              {config.membershipActivationRequired
                ? 'Membership activation is required. Your setup will be saved and restricted features will remain locked until activation is confirmed.'
                : 'You can complete the free account setup. Paid membership, content, and mentorship are separate and require approved terms before activation.'}
            </p>
            <Notice>There is no payment collection in this setup.</Notice>
          </>
        )}
        {current === 6 && (
          <>
            <Field
              label="What do you want to achieve?"
              name="goal"
              minLength={5}
              maxLength={160}
              defaultValue={draft.goal}
              required
            />
            <Field
              label="How will you measure success?"
              name="measure"
              minLength={5}
              defaultValue={draft.measure}
              required
            />
            <Field
              label="Target date"
              type="date"
              name="targetDate"
              min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
              defaultValue={draft.targetDate}
              required
            />
            <Textarea
              label="Your first recurring action"
              name="action"
              minLength={5}
              defaultValue={draft.action}
              required
            />
          </>
        )}
        {error && <Notice error>{error}</Notice>}
        <div className="wizard-actions">
          {current > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={(event) => {
                const form = event.currentTarget.form;
                persist(
                  form
                    ? {
                        ...draft,
                        ...Object.fromEntries(
                          [...new FormData(form).entries()].map(([key, value]) => [key, String(value)]),
                        ),
                      }
                    : draft,
                  current - 1,
                );
              }}
            >
              Back
            </Button>
          )}
          <Button type="submit">
            {current === 1 && minor ? 'Invite guardian' : current === 6 ? 'Create first goal' : 'Continue'}
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={(e) => {
            const form = e.currentTarget.form;
            const next = form
              ? {
                  ...draft,
                  ...Object.fromEntries(
                    [...new FormData(form).entries()].map(([key, value]) => [key, String(value)]),
                  ),
                }
              : draft;
            persist(next, current);
            router.push('/setup-saved');
          }}
        >
          Save and exit
        </Button>
      </SafeForm>
    </div>
  );
}
