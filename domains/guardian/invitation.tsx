'use client';
import { SafeForm } from '../shared/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { guardian, verification } from '../shared/demo-services';
import type { InvitationState } from '../shared/contracts';
import { ActionLink, Button, Check, Field, Notice, Select, Stepper } from '../shared/ui';
export function Invitation({ token }: { token: string }) {
  const [state, setState] = useState<InvitationState | 'loading'>('loading');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    guardian
      .invitation(token)
      .then(setState)
      .catch((e) => setError(e.message));
  }, [token, attempt]);
  if (state === 'loading')
    return (
      <div className="form-page">
        <Notice error={!!error}>{error || 'Checking invitation…'}</Notice>
        {error && (
          <Button
            onClick={() => {
              setError('');
              setAttempt(attempt + 1);
            }}
          >
            Try again
          </Button>
        )}
      </div>
    );
  if (state !== 'valid')
    return (
      <div className="form-page">
        <h1>Invitation {state}</h1>
        <p>
          {state === 'expired'
            ? 'Ask the member to request a new invitation.'
            : state === 'used'
              ? 'This invitation has already been answered. Sign in to manage existing consent.'
              : 'This invitation could not be found. Check the complete link or contact support.'}
        </p>
        <ActionLink href="/contact">Contact support</ActionLink>
        <Link href="/login">Log in</Link>
      </div>
    );
  return (
    <div className="form-page">
      <span className="eyebrow">GUARDIAN INVITATION</span>
      <h1>Help them grow safely.</h1>
      <Notice>
        This is an illustrative invitation. No real child is associated with it, and demo consent never
        activates a minor’s account.
      </Notice>
      {result ? (
        <>
          <Notice>{result}</Notice>
          {error && <Notice error>{error}</Notice>}
          {result.startsWith('Your specific choices') && (
            <Button
              variant="outline"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await guardian.withdraw(token);
                  setResult(
                    'Consent withdrawn in this demonstration. Restricted participation stays disabled.',
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Withdraw consent
            </Button>
          )}
          <p>
            <Link href="/login">Go to your account</Link>
          </p>
        </>
      ) : (
        <>
          <Stepper steps={['Identify yourself', 'Verify your contact', 'Review and decide']} current={step} />
          <SafeForm
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              const data = new FormData(e.currentTarget);
              if (step === 1) {
                setBusy(true);
                try {
                  await verification.verify(String(data.get('code')));
                } catch (e) {
                  setError((e as Error).message);
                  return;
                } finally {
                  setBusy(false);
                }
              }
              if (step < 2) {
                setStep(step + 1);
                return;
              }
              setBusy(true);
              try {
                await guardian.respond(token, {
                  participation: data.get('participation') === 'on',
                  mentorship: data.get('mentorship') === 'on',
                });
                setResult(
                  data.get('participation') === 'on'
                    ? 'Your specific choices have been recorded in this demonstration. No real consent has been granted.'
                    : 'Participation declined in this demonstration. The account remains restricted.',
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {step === 0 && (
              <>
                <Field label="Guardian full name" name="name" required />
                <Field label="Guardian email" name="email" type="email" required />
                <Select
                  label="Relationship"
                  name="relationship"
                  options={['Parent', 'Legal guardian']}
                  required
                />
                <p>
                  For a real invitation, sign-in or account creation is followed by independent contact
                  verification.
                </p>
              </>
            )}
            {step === 1 && (
              <>
                <Field
                  label="Verification code"
                  name="code"
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  required
                />
                <p>Demo code: 123456</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setError('Demo code is 123456. No email was sent.')}
                >
                  Resend code
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <p>
                  Review the <Link href="/privacy">Privacy Policy</Link>, <Link href="/terms">Terms</Link>,
                  and <Link href="/safeguarding">Safeguarding standards</Link>. You may decline participation
                  or withdraw consent later. Essential safeguarding messages support oversight.
                </p>
                <Check required name="relationshipConfirmed">
                  I confirm that I am authorised to act as this child’s guardian.
                </Check>
                <Check required name="reviewed">
                  I have reviewed the policies and understand how to withdraw consent.
                </Check>
                <Check name="participation">Allow goal planning and learning participation.</Check>
                <Check name="mentorship">Allow supervised, age-appropriate mentorship.</Check>
              </>
            )}
            {error && <Notice error>{error}</Notice>}
            <div className="actions">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <Button loading={busy} type="submit">
                {step === 2 ? 'Save consent choices' : 'Continue'}
              </Button>
              {step === 2 && (
                <Button
                  type="button"
                  variant="destructive"
                  loading={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await guardian.respond(token, { participation: false, mentorship: false });
                      setResult('Invitation declined. Restricted participation stays disabled.');
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Decline invitation
                </Button>
              )}
            </div>
          </SafeForm>
        </>
      )}
    </div>
  );
}
