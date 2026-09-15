'use client';
import { useEffect, useState } from 'react';
import { mentors } from '../shared/demo-services';
import type { MentorStatus } from '../shared/contracts';
import { ActionLink, Badge, Button, Notice, SafeForm, Skeleton, Textarea } from '../shared/ui';
export function MentorApplicationStatus({ id }: { id: string }) {
  const [record, setRecord] = useState<{ id: string; status: MentorStatus; note: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [responding, setResponding] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError('');
    mentors
      .status(id)
      .then((value) => {
        if (active) {
          setRecord(value);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  return (
    <div className="form-page">
      <span className="eyebrow">YOUR MENTOR APPLICATION</span>
      <h1>Every step, kept in view.</h1>
      <Notice>
        Development demonstration. Status is supplied by a typed adapter; only authorised reviewers may change
        real approval decisions.
      </Notice>
      {!loaded ? (
        <Skeleton />
      ) : error ? (
        <>
          <Notice error>{error}</Notice>
          <Button
            onClick={() => {
              setLoaded(false);
              setAttempt(attempt + 1);
            }}
          >
            Try again
          </Button>
        </>
      ) : !record ? (
        <>
          <h2>No application found</h2>
          <p>Check the reference or start an application.</p>
          <ActionLink href="/mentor/application">Start application</ActionLink>
        </>
      ) : (
        <>
          <Badge tone={record.status === 'rejected' || record.status === 'suspended' ? 'warning' : 'info'}>
            {record.status.replaceAll('_', ' ')}
          </Badge>
          <h2 style={{ marginTop: 25 }}>{record.note}</h2>
          <p>Reference: {record.id}</p>
          {record.status === 'draft' && <ActionLink href="/mentor/application">Resume draft</ActionLink>}
          {record.status === 'more_information_required' &&
            (!responding ? (
              <Button onClick={() => setResponding(true)}>Provide more information</Button>
            ) : (
              <SafeForm
                className="form-stack"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const text = String(new FormData(e.currentTarget).get('response'));
                  setBusy(true);
                  try {
                    await mentors.provideInformation(record.id, text);
                    setRecord({
                      ...record,
                      status: 'under_review',
                      note: 'Your demo response has been recorded. The application is under review; nothing was sent.',
                    });
                    setResponding(false);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Textarea
                  label="Additional information"
                  name="response"
                  minLength={20}
                  maxLength={3000}
                  required
                />
                <Button loading={busy} type="submit">
                  Submit additional information
                </Button>
              </SafeForm>
            ))}
          <p>
            <ActionLink href="/contact" secondary>
              Contact the review team
            </ActionLink>
          </p>
        </>
      )}
    </div>
  );
}
