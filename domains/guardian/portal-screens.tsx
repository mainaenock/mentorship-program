'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, Check, Notice, Skeleton, Textarea } from '../shared/ui';
import { Mutation } from '../goals/screens';
import { AccountPage } from '../account/screens';
import { guardianPortal, type GuardianWorkspace } from './portal-service';
export function GuardianPage({ section = '' }: { section?: string }) {
  const [data, setData] = useState<GuardianWorkspace | null>(null);
  const [error, setError] = useState('');
  async function load() {
    setData(null);
    setError('');
    try {
      if (section.startsWith('children/')) await guardianPortal.child(section.split('/')[1]);
      setData(await guardianPortal.read());
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [section]);
  if (!data)
    return error ? (
      <Notice error>
        {error}
        <Button onClick={load}>Retry</Button>
      </Notice>
    ) : (
      <Skeleton />
    );
  if (section === 'profile') return <AccountPage section="profile" base="/guardian" />;
  if (section === 'settings') return <AccountPage section="settings/notifications" base="/guardian" />;
  if (section === 'privacy') return <AccountPage section="settings/privacy" base="/guardian" />;
  if (section === 'notifications') return <AccountPage section="notifications" base="/guardian" />;
  const children = data.children.filter(
    (item) => !section.startsWith('children/') || item.id === section.split('/')[1],
  );
  return (
    <>
      <Notice>
        Guardian oversight shows only permitted summaries. Private reflections, private mentor notes and full
        message content are excluded.
      </Notice>
      {section === '' && (
        <section className="next-action">
          <h2>
            {data.children.filter((item) => item.status === 'Pending').length} relationship requests need your
            review.
          </h2>
          <Link className="button primary" href="/guardian/children">
            Review Relationships
          </Link>
        </section>
      )}
      {children.map((item) => (
        <Card key={item.id}>
          <Badge>{item.status}</Badge>
          <h2>{item.childName}</h2>
          {item.status === 'Pending' && (
            <div className="actions">
              {(['accept', 'decline'] as const).map((action) => (
                <Mutation
                  key={action}
                  title={action === 'accept' ? 'Accept Relationship' : 'Decline Relationship'}
                  confirmation="This decides a fictional relationship request. Production acceptance requires independently verified guardian identity and authority."
                  onSubmit={async (form) =>
                    setData(await guardianPortal.relationship(item.id, action, String(form.get('reason'))))
                  }
                >
                  <Textarea label="Relationship decision reason" name="reason" required minLength={3} />
                </Mutation>
              ))}
            </div>
          )}
          {item.status === 'Accepted' && (
            <>
              {['', 'children'].includes(section) && (
                <Link href={`/guardian/children/${item.id}`}>View Child Overview</Link>
              )}
              {(section === '' || section.startsWith('children')) && (
                <>
                  <h3>Permitted goal overview</h3>
                  <p>
                    {item.consents.participation
                      ? item.goalSummary
                      : 'Goal updates are restricted until participation consent is granted.'}
                  </p>
                  <Link href="/guardian/consents">Review Consent</Link>
                </>
              )}
              {(section === 'consents' || section.startsWith('children/')) && (
                <>
                  <h3>Specific consent choices</h3>
                  {(Object.keys(item.consents) as (keyof typeof item.consents)[]).map((scope) => (
                    <div key={scope}>
                      <p>
                        {scope}: <strong>{item.consents[scope] ? 'Granted' : 'Not granted'}</strong>
                      </p>
                      <Mutation
                        title={`${item.consents[scope] ? 'Withdraw' : 'Grant'} ${scope} Consent`}
                        confirmation={
                          item.consents[scope]
                            ? 'Withdrawal restricts the affected feature. Withdrawing participation also withdraws learning and mentorship consent.'
                            : 'Grant only the stated scope. The decision is recorded with its policy version and time.'
                        }
                        onSubmit={async (form) =>
                          setData(
                            await guardianPortal.consent(
                              item.id,
                              scope,
                              !item.consents[scope],
                              String(form.get('reason')),
                            ),
                          )
                        }
                      >
                        <Check required>I understand this specific consent decision.</Check>
                        <Textarea label="Consent decision reason" name="reason" required minLength={3} />
                      </Mutation>
                    </div>
                  ))}
                </>
              )}
              {(section === 'mentorship' || section === '' || section.startsWith('children/')) && (
                <>
                  <h3>Mentor information</h3>
                  <p>
                    {item.consents.mentorship
                      ? item.mentorName
                      : 'Mentorship information is restricted until mentorship consent is granted.'}
                  </p>
                  <Link href="/guardian/sessions">View Upcoming Session</Link>
                  {item.consents.mentorship && <p>{item.mentorSummary}</p>}
                </>
              )}
              {section === 'sessions' && (
                <>
                  <h3>Upcoming sessions</h3>
                  <p>
                    {item.consents.mentorship
                      ? item.sessions?.length
                        ? 'Approved session summaries'
                        : 'No sessions are scheduled for this demonstration relationship.'
                      : 'Session access is restricted while mentorship consent is inactive.'}
                  </p>
                  {item.sessions?.map((session) => (
                    <details key={session.id}>
                      <summary>
                        {session.title} · {session.status}
                      </summary>
                      <p>
                        {new Date(session.startsAt).toLocaleString()} · {session.duration} minutes
                      </p>
                      <p>{session.oversight}</p>
                      <Link href="/guardian/safety">Raise a session concern</Link>
                    </details>
                  ))}
                </>
              )}
              {section.startsWith('children/') && (
                <Mutation
                  title="Unlink Relationship"
                  confirmation="This submits a safeguarded unlink request and restricts the affected participation. A reviewer must resolve the relationship; historical consent records are retained."
                  onSubmit={async (form) =>
                    setData(await guardianPortal.relationship(item.id, 'unlink', String(form.get('reason'))))
                  }
                >
                  <Textarea label="Unlink reason" name="reason" required minLength={3} />
                </Mutation>
              )}
            </>
          )}
          {(section === 'safety' || section.startsWith('children/')) && (
            <div className="actions">
              {['Raise Concern', 'Report Safety Issue'].map((kind) => (
                <Mutation
                  key={kind}
                  title={kind}
                  onSubmit={async (form) =>
                    setData(await guardianPortal.concern(item.id, kind, String(form.get('detail'))))
                  }
                >
                  <Notice>This records a demonstration report only. No external report is delivered.</Notice>
                  <Textarea label="Safety concern" name="detail" required minLength={10} />
                </Mutation>
              ))}
            </div>
          )}
        </Card>
      ))}
      {section === 'safety' && (
        <>
          <h2>Safety reports</h2>
          {!data.concerns.length && <p>No safety reports recorded.</p>}
          {data.concerns.map((item) => (
            <Card key={item.id}>
              <Badge>{item.status}</Badge>
              <h3>{item.kind}</h3>
              <p>{item.detail}</p>
            </Card>
          ))}
          <Link href="/safeguarding">Safeguarding and urgent help information</Link>
        </>
      )}
      {(section === 'consents' || section.startsWith('children/')) && (
        <>
          <h2>Consent and relationship history</h2>
          {!data.audit.length && <p>No decisions recorded yet.</p>}
          {data.audit.map((item) => (
            <Card key={item.id}>
              <h3>{item.action}</h3>
              <p>{item.detail}</p>
              <small>{item.at}</small>
            </Card>
          ))}
        </>
      )}
    </>
  );
}
