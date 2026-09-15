'use client';
import { SafeForm } from '../shared/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { mentors, verification } from '../shared/demo-services';
import { config } from '../shared/config';
import { Badge, Button, Check, Field, Notice, Select, Stepper, Textarea } from '../shared/ui';
const steps = [
  'Personal information',
  'Contact verification',
  'Professional background',
  'Areas of expertise',
  'Preferred age groups',
  'Languages',
  'Availability',
  'Mentee capacity',
  'References',
  'Supporting documents',
  'Safeguarding declarations',
  'Code of conduct',
  'Review and submit',
];
export function MentorApplication() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [refs, setRefs] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('gap-mentor-draft');
      if (saved) {
        const draft = JSON.parse(saved);
        setValues(draft.values);
        setStep(draft.step);
        setRefs(draft.refs || 1);
      }
    } catch {
      sessionStorage.removeItem('gap-mentor-draft');
    }
  }, []);
  function collect(form: HTMLFormElement) {
    return {
      ...values,
      ...Object.fromEntries(
        [...new FormData(form).entries()]
          .filter(([, v]) => typeof v === 'string')
          .map(([k, v]) => [k, String(v)]),
      ),
    };
  }
  function save(form: HTMLFormElement) {
    const next = collect(form);
    setValues(next);
    const safe = Object.fromEntries(
      Object.entries(next).filter(
        ([k]) => !k.startsWith('reference') && !['email', 'phone', 'name', 'code'].includes(k),
      ),
    );
    sessionStorage.setItem('gap-mentor-draft', JSON.stringify({ values: safe, step, refs }));
    setMessage(
      'Safe draft saved for this tab. Contact details, references, and documents must be re-entered after reload.',
    );
  }
  if (submitted)
    return (
      <div className="form-page">
        <Badge>Submitted · Demo</Badge>
        <h1>Thank you for stepping forward.</h1>
        <Notice>{message}</Notice>
        <p>
          Application statuses progress through submitted, under review, more information required, approved,
          rejected, or suspended. Only an authorised reviewer can change approval status.
        </p>
        <p>
          <Link className="button primary" href="/mentor/application/status/latest">
            View status
          </Link>
        </p>
        <Link href="/contact">Contact the review team</Link>
      </div>
    );
  return (
    <div className="form-page wide-form">
      <div className="row between">
        <span className="eyebrow">BECOME A MENTOR</span>
        <Badge tone="info">Draft</Badge>
      </div>
      <h1>Your experience can make a difference.</h1>
      <Notice>
        Demo application. Use fictional details and sample documents. Files stay in memory and are never
        uploaded.
      </Notice>
      <Stepper steps={steps} current={step} />
      <SafeForm
        className="form-stack"
        key={step}
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');
          setMessage('');
          const next = collect(event.currentTarget);
          if (step === 1) {
            setBusy(true);
            try {
              await verification.verify(next.code);
            } catch (e) {
              setError((e as Error).message);
              return;
            } finally {
              setBusy(false);
            }
          }
          if (step === 9 && !files.length) {
            setError('Select at least one sample document.');
            return;
          }
          setValues(next);
          if (step < 12) {
            setStep(step + 1);
            return;
          }
          if (!next.name || !next.email || !next.reference0 || !files.length) {
            setError(
              'Personal details, references, or documents are missing after draft recovery. Go back and complete those steps.',
            );
            return;
          }
          setBusy(true);
          try {
            const result = await mentors.submit({
              ...next,
              files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
            });
            setMessage(
              `Demo reference ${result.id}. Your application is ready for a future backend review workflow.`,
            );
            setSubmitted(true);
            sessionStorage.removeItem('gap-mentor-draft');
            setFiles([]);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {step === 0 && (
          <>
            <Field label="Full name" name="name" defaultValue={values.name} required />
            <Field label="Email" name="email" type="email" defaultValue={values.email} required />
            <Field label="Phone" name="phone" type="tel" defaultValue={values.phone} required />
          </>
        )}
        {step === 1 && (
          <>
            <Field
              label="Verification code"
              name="code"
              pattern="[0-9]{6}"
              defaultValue={values.code}
              required
            />
            <p>Use 123456 for this demo.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMessage('Demo verification code is 123456. No message was sent.')}
            >
              Resend code
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Field label="Professional role" name="profession" defaultValue={values.profession} required />
            <Field
              label="Years of relevant experience"
              type="number"
              min={0}
              max={80}
              name="experience"
              defaultValue={values.experience}
              required
            />
            <Textarea
              label="Professional background"
              name="background"
              minLength={30}
              defaultValue={values.background}
              required
            />
          </>
        )}
        {step === 3 && (
          <>
            <Select
              label="Primary expertise"
              name="expertise"
              options={config.categories}
              defaultValue={values.expertise}
              required
            />
            <Textarea
              label="Skills and experience you can share"
              name="skills"
              defaultValue={values.skills}
              required
            />
          </>
        )}
        {step === 4 && (
          <Select
            label="Preferred age group"
            name="ageGroup"
            options={[
              'Adults only',
              'Minors with required safeguarding approval',
              'Both, subject to safeguarding approval',
            ]}
            defaultValue={values.ageGroup}
            required
          />
        )}
        {step === 5 && (
          <Field
            label="Languages spoken"
            name="languages"
            placeholder="English, Kiswahili"
            defaultValue={values.languages}
            required
          />
        )}
        {step === 6 && (
          <>
            <Textarea
              label="Available days and times"
              name="availability"
              placeholder="Tuesday, 16:00–18:00"
              defaultValue={values.availability}
              required
            />
            <Field
              label="Timezone"
              name="timezone"
              defaultValue={values.timezone || config.timezone}
              required
            />
          </>
        )}
        {step === 7 && (
          <Field
            label="Maximum mentee capacity"
            type="number"
            name="capacity"
            min={1}
            max={20}
            defaultValue={values.capacity}
            required
          />
        )}
        {step === 8 && (
          <>
            {Array.from({ length: refs }, (_, i) => (
              <fieldset key={i}>
                <legend>Reference {i + 1}</legend>
                <Field
                  label="Reference name"
                  name={`reference${i}`}
                  defaultValue={values[`reference${i}`]}
                  required
                />
                <Field
                  label="Reference email"
                  type="email"
                  name={`referenceEmail${i}`}
                  defaultValue={values[`referenceEmail${i}`]}
                  required
                />
                <Field
                  label="Professional relationship"
                  name={`referenceRelationship${i}`}
                  defaultValue={values[`referenceRelationship${i}`]}
                  required
                />
              </fieldset>
            ))}
            <div className="actions">
              <Button
                type="button"
                variant="outline"
                disabled={refs >= 3}
                onClick={(e) => {
                  if (e.currentTarget.form) setValues(collect(e.currentTarget.form));
                  setRefs(refs + 1);
                }}
              >
                Add reference
              </Button>
              {refs > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={(event) => {
                    const next = event.currentTarget.form ? collect(event.currentTarget.form) : values;
                    setValues(
                      Object.fromEntries(
                        Object.entries(next).filter(
                          ([key]) =>
                            !['reference', 'referenceEmail', 'referenceRelationship'].some(
                              (prefix) => key === `${prefix}${refs - 1}`,
                            ),
                        ),
                      ),
                    );
                    setRefs(refs - 1);
                  }}
                >
                  Remove reference
                </Button>
              )}
            </div>
          </>
        )}
        {step === 9 && (
          <>
            <Field
              label="Upload sample supporting documents"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              multiple
              onChange={(e) => {
                const incoming = Array.from(e.target.files || []);
                if (
                  incoming.some(
                    (f) =>
                      f.size > 5 * 1024 * 1024 ||
                      !['application/pdf', 'image/png', 'image/jpeg'].includes(f.type),
                  )
                ) {
                  setError('Use PDF, PNG, or JPEG files up to 5 MB each.');
                  return;
                }
                if (incoming.length + files.length > 5) {
                  setError('Select no more than five documents.');
                  return;
                }
                setFiles([...files, ...incoming]);
                setError('');
              }}
            />
            <p>PDF, PNG, JPEG · 5 MB each · maximum five. Do not use real identity documents in the demo.</p>
            {files.map((f, i) => (
              <div className="row between" key={`${f.name}-${i}`}>
                <span>{f.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setFiles(files.filter((_, index) => index !== i))}
                >
                  Remove document
                </Button>
              </div>
            ))}
          </>
        )}
        {step === 10 && (
          <>
            <Check name="boundaries" required defaultChecked={values.boundaries === 'on'}>
              I will maintain appropriate boundaries and approved communication channels.
            </Check>
            <Check name="reporting" required defaultChecked={values.reporting === 'on'}>
              I will report safeguarding concerns and cooperate with required checks.
            </Check>
            <Check name="truthful" required defaultChecked={values.truthful === 'on'}>
              My application information is accurate and I consent to reference verification.
            </Check>
          </>
        )}
        {step === 11 && (
          <Check name="conduct" required defaultChecked={values.conduct === 'on'}>
            I have read and accept the <Link href="/mentor-code-of-conduct">Mentor code of conduct</Link> and{' '}
            <Link href="/safeguarding">Safeguarding standards</Link>.
          </Check>
        )}
        {step === 12 && (
          <>
            <h3>Review your application</h3>
            <dl className="data-list">
              {Object.entries(values)
                .filter(([k]) => k !== 'code')
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k.replace(/([A-Z])/g, ' $1')}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
            <p>{files.length} sample document(s) selected.</p>
            <Check required>I have reviewed this application and am ready to submit.</Check>
          </>
        )}
        {error && <Notice error>{error}</Notice>}
        {message && <Notice>{message}</Notice>}
        <div className="wizard-actions">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                if (e.currentTarget.form) setValues(collect(e.currentTarget.form));
                setStep(step - 1);
              }}
            >
              Back
            </Button>
          )}
          <Button loading={busy} type="submit">
            {step === 12 ? 'Submit application' : step === 11 ? 'Review' : 'Continue'}
          </Button>
        </div>
        <div className="actions">
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              if (e.currentTarget.form) save(e.currentTarget.form);
            }}
          >
            Save draft
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              sessionStorage.removeItem('gap-mentor-draft');
              setValues({});
              setFiles([]);
              setStep(0);
              setMessage('Draft withdrawn.');
            }}
          >
            Withdraw draft
          </Button>
        </div>
      </SafeForm>
    </div>
  );
}
