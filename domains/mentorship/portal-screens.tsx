'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ActionLink,
  Badge,
  Button,
  Card,
  Check,
  Field,
  Notice,
  SafeForm,
  Select,
  Skeleton,
  Tabs,
  Textarea,
} from '../shared/ui';
import { MetricCard } from '../shared/composites';
import { Mutation } from '../goals/screens';
import { readSession } from '../shared/demo-services';
import { config } from '../shared/config';
import { mentorshipPortal } from './portal-service';
import type { MentorSession, MentorWorkspace } from './portal-contracts';

export function MentorshipPage({ section = '', mentor = false }: { section?: string; mentor?: boolean }) {
  const [data, setData] = useState<MentorWorkspace | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState('');
  const base = mentor ? '/mentor' : '/app/mentor';
  async function load() {
    setError('');
    try {
      const workspace = await mentorshipPortal.read();
      if (section.startsWith('mentees/')) await mentorshipPortal.mentee(section.split('/')[1]);
      setData(workspace);
      setSelected(mentor ? workspace.mentees[0]?.id || '' : readSession()?.id || '');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [section]);
  if (error && !data)
    return (
      <Notice error>
        {error}
        <Button onClick={load}>Retry</Button>
      </Notice>
    );
  if (!data) return <Skeleton />;
  async function save(operation: () => Promise<MentorWorkspace>) {
    setBusy(true);
    setError('');
    try {
      setData(await operation());
      setMessage('Saved in the demonstration workspace.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const memberSelect = (
    <label className="field">
      Mentee
      <select name="memberId" required value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">Choose assigned mentee</option>
        {data.mentees.map((item) => (
          <option value={item.id} key={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
  const schedule = (
    <Mutation
      title={mentor ? 'Schedule Session' : 'Book Session'}
      onSubmit={async (form) =>
        setData(
          await mentorshipPortal.schedule({
            memberId: selected,
            title: String(form.get('title')),
            startsAt: String(form.get('startsAt')),
            duration: Number(form.get('duration')),
            agenda: String(form.get('agenda')),
          }),
        )
      }
    >
      {mentor && memberSelect}
      <Field label="Session title" name="title" required minLength={3} />
      <Field label="Session date and time" name="startsAt" type="datetime-local" required />
      <Field
        label="Duration in minutes"
        name="duration"
        type="number"
        min={15}
        max={120}
        defaultValue={30}
        required
      />
      <Textarea label="Session agenda" name="agenda" />
    </Mutation>
  );
  const concerned = (memberId: string) => (
    <div className="actions">
      {['Escalate Concern', 'Refer to Safeguarding', 'Request Reassignment'].map((kind) => (
        <Mutation
          key={kind}
          title={kind}
          confirmation="This records a review request in the demonstration workspace. No external message is sent. Production routing requires the corresponding backend case workflow."
          onSubmit={async (form) =>
            setData(await mentorshipPortal.concern(memberId, kind, String(form.get('detail'))))
          }
        >
          <Textarea label="Concern details" name="detail" required minLength={3} />
        </Mutation>
      ))}
    </div>
  );
  const noteForm = (memberId: string) => (
    <Mutation
      title="Add Private Mentor Note"
      onSubmit={async (form) => setData(await mentorshipPortal.note(memberId, String(form.get('body'))))}
    >
      <Notice>Private mentor notes are excluded from member and guardian views.</Notice>
      <Textarea label="Private mentor note" name="body" required minLength={3} />
    </Mutation>
  );
  const recommendationForm = (memberId: string) => (
    <Mutation
      title="Create Recommendation"
      onSubmit={async (form) =>
        setData(
          await mentorshipPortal.recommend(memberId, String(form.get('title')), String(form.get('body'))),
        )
      }
    >
      <Field label="Recommendation title" name="title" required minLength={3} />
      <Textarea label="Recommendation" name="body" required minLength={3} />
    </Mutation>
  );
  const interventionForm = (memberId: string) => (
    <Mutation
      title="Create Intervention"
      onSubmit={async (form) =>
        setData(
          await mentorshipPortal.intervene(
            memberId,
            String(form.get('trigger')),
            String(form.get('recommendation')),
            String(form.get('followUp')),
          ),
        )
      }
    >
      <Field label="Intervention trigger" name="trigger" required />
      <Textarea label="Recovery recommendation" name="recommendation" required minLength={3} />
      <Field
        label="Follow-up date"
        name="followUp"
        type="date"
        min={new Date().toISOString().slice(0, 10)}
        required
      />
    </Mutation>
  );
  const mentees = data.mentees.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) &&
      (section !== 'attention' || item.health !== 'On Track'),
  );
  const detail = data.mentees.find((item) => item.id === section.split('/')[1]);
  const sessionId = section.startsWith('sessions/') ? section.split('/')[1] : null;
  const sessions = data.sessions.filter((item) => !sessionId || item.id === sessionId);
  return (
    <>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <p className="portal-demo">Fictional mentorship records · no real sessions or messages are delivered</p>
      {mentor && section === '' && (
        <>
          <section className="next-action">
            <span className="eyebrow">YOUR MENTEES, YOUR NEXT STEP</span>
            <h2>
              {data.mentees.filter((item) => !data.reviewedEvaluations.includes(item.id)).length} evaluations
              are ready for your review.
            </h2>
            <ActionLink href="/mentor/evaluations">Review Evaluation</ActionLink>
          </section>
          <div className="portal-grid">
            {[
              ['Assigned mentees', data.mentees.length, '/mentor/mentees'],
              [
                'Goals on track',
                data.mentees.filter((item) => item.health === 'On Track').length,
                '/mentor/mentees',
              ],
              [
                'Needs attention',
                data.mentees.filter((item) => item.health === 'Needs Attention').length,
                '/mentor/attention',
              ],
              [
                'At-risk goals',
                data.mentees.filter((item) => item.health === 'At Risk').length,
                '/mentor/attention',
              ],
              [
                'Upcoming sessions',
                data.sessions.filter((item) => item.status === 'Scheduled').length,
                '/mentor/sessions',
              ],
              ['Open concerns', data.concerns.length, '/mentor/compliance'],
            ].map(([label, value, href]) => (
              <Link key={label} href={String(href)}>
                <MetricCard label={String(label)} value={String(value)} />
              </Link>
            ))}
          </div>
          {!data.complianceAccepted && (
            <Notice>
              Review your safeguarding and conduct commitments.{' '}
              <Link href="/mentor/compliance">Open compliance actions</Link>
            </Notice>
          )}
        </>
      )}
      {!mentor && section === '' && (
        <>
          <Card>
            <Badge>{data.assignment}</Badge>
            <h2>{data.mentor.name}</h2>
            <p>{data.mentor.biography}</p>
            <p>
              {data.mentor.expertise.join(' · ')} · {data.mentor.languages.join(', ')}
            </p>
            <Mutation
              title={data.assignment === 'Unassigned' ? 'Request Mentor' : 'Update Preferences'}
              onSubmit={async (form) =>
                setData(
                  await mentorshipPortal.requestMentor({
                    category: String(form.get('category')),
                    language: String(form.get('language')),
                    availability: String(form.get('availability')),
                  }),
                )
              }
            >
              <Select
                label="Matching category"
                name="category"
                options={[...config.categories]}
                defaultValue={data.preferences.category}
                required
              />
              <Select
                label="Preferred language"
                name="language"
                options={[...config.languages]}
                defaultValue={data.preferences.language}
                required
              />
              <Textarea
                label="Preferred availability"
                name="availability"
                defaultValue={data.preferences.availability}
                required
                minLength={3}
              />
            </Mutation>
            {data.assignment === 'Proposed' && (
              <Mutation
                title="Accept Assignment"
                confirmation="Accept this demonstration mentor assignment to enable local booking and messaging."
                onSubmit={async () => setData(await mentorshipPortal.assignment('accept'))}
              />
            )}
            {data.assignment !== 'Unassigned' && (
              <Mutation
                title="Raise Assignment Concern"
                onSubmit={async (form) =>
                  setData(await mentorshipPortal.assignment('concern', String(form.get('detail'))))
                }
              >
                <Textarea label="Assignment concern" name="detail" required minLength={3} />
              </Mutation>
            )}
          </Card>
          {readSession()?.role === 'minor' && (
            <Notice>
              Communication with your mentor is subject to guardian consent and safeguarding oversight.
              Reporting controls are available on every message.
            </Notice>
          )}
          <div className="actions">
            <ActionLink href="/app/mentor/sessions">View Upcoming Sessions</ActionLink>
            <ActionLink href="/app/messages" secondary>
              Messages
            </ActionLink>
          </div>
          <h3>Mentor recommendations</h3>
          {!data.recommendations.length && <p>No recommendations have been shared yet.</p>}
          {data.recommendations.map((item) => (
            <Card key={item.id}>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
              <Badge>{item.status}</Badge>
              {(['Accepted', 'Clarification requested'] as const).map((action) => (
                <Mutation
                  key={action}
                  title={action === 'Accepted' ? 'Accept Recommendation' : 'Request Clarification'}
                  onSubmit={async (form) =>
                    setData(
                      await mentorshipPortal.respondRecommendation(
                        item.id,
                        action,
                        String(form.get('response') || ''),
                      ),
                    )
                  }
                >
                  <Textarea
                    label="Your response"
                    name="response"
                    required={action === 'Clarification requested'}
                  />
                </Mutation>
              ))}
            </Card>
          ))}
        </>
      )}
      {mentor && ['mentees', 'attention'].includes(section) && (
        <>
          <Field
            label="Search assigned mentees"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {!mentees.length && (
            <Card>
              <h2>No matching mentees</h2>
              <p>Only assigned members appear in this workspace.</p>
            </Card>
          )}
          <div className="portal-grid">
            {mentees.map((item) => (
              <Card key={item.id}>
                <Badge>{item.health}</Badge>
                <h2>{item.name}</h2>
                <p>
                  {item.goalTitle} · {item.progress}%
                </p>
                {item.minor && <Notice>Guardian-approved communication oversight applies.</Notice>}
                <ActionLink href={`/mentor/mentees/${item.id}`}>View Mentee</ActionLink>
              </Card>
            ))}
          </div>
        </>
      )}
      {mentor && detail && (
        <>
          <h2>{detail.name}</h2>
          <Tabs
            items={[
              {
                title: 'Profile',
                content: (
                  <Card>
                    <p>{detail.approvedProfile}</p>
                    <p>{detail.category}</p>
                    {detail.minor && (
                      <Notice>
                        Only approved profile fields are visible. Communication oversight applies.
                      </Notice>
                    )}
                  </Card>
                ),
              },
              {
                title: 'Goals',
                content: (
                  <Card>
                    <h3>{detail.goalTitle}</h3>
                    <p>
                      {detail.progress}% · {detail.health}
                    </p>
                    {recommendationForm(detail.id)}
                  </Card>
                ),
              },
              {
                title: 'Action plan',
                content: (
                  <Card>
                    <h3>Next planning review</h3>
                    {!detail.actions?.length && <p>No actions have been shared for review.</p>}
                    {detail.actions?.map((action) => (
                      <div key={action.title}>
                        <h4>{action.title}</h4>
                        <p>
                          {action.frequency} · {action.duration} minutes · {action.status}
                        </p>
                      </div>
                    ))}
                    {recommendationForm(detail.id)}
                  </Card>
                ),
              },
              {
                title: 'Activity',
                content: (
                  <ul>
                    {detail.activity.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ),
              },
              {
                title: 'Evaluations',
                content: (
                  <Card>
                    <p>{detail.evaluation}</p>
                    <Mutation
                      title="Review Evaluation"
                      onSubmit={async (form) =>
                        setData(
                          await mentorshipPortal.reviewEvaluation(detail.id, String(form.get('review'))),
                        )
                      }
                    >
                      <Textarea label="Review notes" name="review" required minLength={3} />
                    </Mutation>
                  </Card>
                ),
              },
              {
                title: 'Evidence',
                content: (
                  <Card>
                    {detail.evidence.length ? (
                      <ul>
                        {detail.evidence.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No evidence shared for review.</p>
                    )}
                  </Card>
                ),
              },
              {
                title: 'Sessions',
                content: (
                  <>
                    <Link href="/mentor/sessions">View sessions and scheduling</Link>
                    {data.sessions
                      .filter((item) => item.memberId === detail.id)
                      .map((item) => (
                        <p key={item.id}>
                          {item.title} · {item.startsAt}
                        </p>
                      ))}
                  </>
                ),
              },
              {
                title: 'Mentor notes',
                content: (
                  <>
                    {noteForm(detail.id)}
                    {data.notes
                      .filter((item) => item.memberId === detail.id)
                      .map((item) => (
                        <Card key={item.id}>
                          <p>{item.body}</p>
                          <small>{item.at}</small>
                        </Card>
                      ))}
                  </>
                ),
              },
              {
                title: 'Recommendations',
                content: (
                  <>
                    {recommendationForm(detail.id)}
                    {data.recommendations
                      .filter((item) => item.memberId === detail.id)
                      .map((item) => (
                        <Card key={item.id}>
                          <h3>{item.title}</h3>
                          <p>{item.body}</p>
                        </Card>
                      ))}
                  </>
                ),
              },
              {
                title: 'Risk flags',
                content: (
                  <>
                    <Badge>{detail.health}</Badge>
                    {concerned(detail.id)}
                  </>
                ),
              },
              {
                title: 'Interventions',
                content: (
                  <>
                    {interventionForm(detail.id)}
                    {data.interventions
                      .filter((item) => item.memberId === detail.id)
                      .map((item) => (
                        <Card key={item.id}>
                          <h3>{item.trigger}</h3>
                          <p>{item.recommendation}</p>
                          <p>{item.status}</p>
                        </Card>
                      ))}
                  </>
                ),
              },
            ]}
          />
        </>
      )}
      {section.startsWith('sessions') && (
        <>
          {schedule}
          {!sessions.length && (
            <Card>
              <h2>{sessionId ? 'Session not found' : 'No sessions yet'}</h2>
              <p>Book an available time with your mentor or assigned mentee.</p>
            </Card>
          )}
          {sessions.map((item) => (
            <SessionCard key={item.id} session={item} mentor={mentor} base={base} onChange={setData} />
          ))}
        </>
      )}
      {section === 'messages' && (
        <>
          <Notice>
            Messages are retained only in this demonstration tab. Younger members’ communications require
            consent and oversight.
          </Notice>
          {mentor && memberSelect}
          {data.messages
            .filter((item) => item.memberId === selected)
            .map((item) => (
              <Card key={item.id}>
                <h3>{item.author}</h3>
                <p>{item.body}</p>
                <small>{item.at}</small>
                {item.reported ? (
                  <Badge>Reported for review</Badge>
                ) : (
                  <Mutation
                    title="Report Message"
                    onSubmit={async (form) =>
                      setData(await mentorshipPortal.reportMessage(item.id, String(form.get('detail'))))
                    }
                  >
                    <Textarea label="Report reason" name="detail" required minLength={3} />
                  </Mutation>
                )}
              </Card>
            ))}
          {!data.messages.some((item) => item.memberId === selected) && (
            <p>No messages in this conversation.</p>
          )}
          <SafeForm
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void save(() => mentorshipPortal.send(selected, String(form.get('body'))));
            }}
          >
            <Textarea label="Message" name="body" required minLength={3} maxLength={5000} />
            <Button type="submit" loading={busy}>
              Send Message
            </Button>
          </SafeForm>
        </>
      )}
      {mentor && section === 'evaluations' && (
        <>
          {data.mentees.map((item) => (
            <Card key={item.id}>
              <h2>{item.name}</h2>
              <Badge>{data.reviewedEvaluations.includes(item.id) ? 'Reviewed' : 'Awaiting review'}</Badge>
              <p>{item.evaluation}</p>
              <Mutation
                title="Review Evaluation"
                onSubmit={async (form) =>
                  setData(await mentorshipPortal.reviewEvaluation(item.id, String(form.get('review'))))
                }
              >
                <Textarea label="Review notes" name="review" required minLength={3} />
              </Mutation>
              {recommendationForm(item.id)}
            </Card>
          ))}
        </>
      )}
      {mentor && section === 'interventions' && (
        <>
          {memberSelect}
          {selected && interventionForm(selected)}
          {!data.interventions.length && <p>No interventions recorded.</p>}
          {data.interventions.map((item) => (
            <Card key={item.id}>
              <h3>{item.trigger}</h3>
              <p>{item.recommendation}</p>
              <p>
                Follow-up {item.followUp} · {item.status}
              </p>
              {item.status === 'Open' && (
                <Mutation
                  title="Record Outcome"
                  onSubmit={async (form) =>
                    setData(await mentorshipPortal.completeIntervention(item.id, String(form.get('outcome'))))
                  }
                >
                  <Textarea label="Intervention outcome" name="outcome" required minLength={3} />
                </Mutation>
              )}
            </Card>
          ))}
        </>
      )}
      {mentor && section === 'notes' && (
        <>
          {memberSelect}
          {selected && noteForm(selected)}
          {!data.notes.length && <p>No private notes yet.</p>}
          {data.notes
            .filter((item) => item.memberId === selected)
            .map((item) => (
              <Card key={item.id}>
                <p>{item.body}</p>
                <small>{item.at}</small>
              </Card>
            ))}
        </>
      )}
      {mentor && section === 'resources' && (
        <div className="portal-grid">
          {data.resources
            .filter((item) => item.priceMinor === 0)
            .map((item) => (
              <Card key={item.id}>
                <h3>{item.title}</h3>
                <p>{item.preview}</p>
                <details>
                  <summary>Read resource</summary>
                  {item.lessons.map((lesson) => (
                    <p key={lesson.id}>{lesson.body}</p>
                  ))}
                </details>
                {memberSelect}
                {selected && recommendationForm(selected)}
              </Card>
            ))}
        </div>
      )}
      {mentor && section === 'availability' && (
        <Card>
          <SafeForm
            onSubmit={(event) => {
              event.preventDefault();
              void save(() => mentorshipPortal.saveAvailability(data.availability));
            }}
          >
            <fieldset>
              <legend>Available weekdays</legend>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <Check
                  key={day}
                  checked={data.availability.weekdays.includes(day)}
                  onChange={(e) =>
                    setData({
                      ...data,
                      availability: {
                        ...data.availability,
                        weekdays: e.target.checked
                          ? [...data.availability.weekdays, day]
                          : data.availability.weekdays.filter((item) => item !== day),
                      },
                    })
                  }
                >
                  {day}
                </Check>
              ))}
            </fieldset>
            <Field
              label="Available from"
              type="time"
              required
              value={data.availability.from}
              onChange={(e) =>
                setData({ ...data, availability: { ...data.availability, from: e.target.value } })
              }
            />
            <Field
              label="Available until"
              type="time"
              required
              value={data.availability.to}
              onChange={(e) =>
                setData({ ...data, availability: { ...data.availability, to: e.target.value } })
              }
            />
            <Field
              label="Mentee capacity"
              type="number"
              min={1}
              max={30}
              required
              value={data.availability.capacity}
              onChange={(e) =>
                setData({ ...data, availability: { ...data.availability, capacity: Number(e.target.value) } })
              }
            />
            <p>Timezone: {data.availability.timezone}</p>
            <Button type="submit" loading={busy}>
              Save Availability
            </Button>
          </SafeForm>
        </Card>
      )}
      {mentor && section === 'profile' && (
        <Card>
          <SafeForm
            onSubmit={(event) => {
              event.preventDefault();
              void save(() => mentorshipPortal.saveProfile(data.mentor));
            }}
          >
            <Field
              label="Mentor display name"
              required
              value={data.mentor.name}
              onChange={(e) => setData({ ...data, mentor: { ...data.mentor, name: e.target.value } })}
            />
            <Textarea
              label="Mentor biography"
              required
              minLength={3}
              value={data.mentor.biography}
              onChange={(e) => setData({ ...data, mentor: { ...data.mentor, biography: e.target.value } })}
            />
            <Field
              label="Expertise, separated by commas"
              value={data.mentor.expertise.join(', ')}
              onChange={(e) =>
                setData({
                  ...data,
                  mentor: {
                    ...data.mentor,
                    expertise: e.target.value.split(',').map((value) => value.trim()),
                  },
                })
              }
            />
            <Button type="submit" loading={busy}>
              Save Profile
            </Button>
          </SafeForm>
        </Card>
      )}
      {mentor && section === 'reports' && (
        <>
          <div className="portal-grid">
            <MetricCard
              label="Completed sessions"
              value={String(data.sessions.filter((item) => item.status === 'Completed').length)}
            />
            <MetricCard label="Reviewed evaluations" value={String(data.reviewedEvaluations.length)} />
            <MetricCard
              label="Completed interventions"
              value={String(data.interventions.filter((item) => item.status === 'Complete').length)}
            />
            <MetricCard
              label="Assigned goals on track"
              value={String(data.mentees.filter((item) => item.health === 'On Track').length)}
            />
          </div>
          <p>
            These counts summarize the current demonstration workspace. No platform-wide member data is
            included.
          </p>
        </>
      )}
      {mentor && section === 'compliance' && (
        <>
          <Card>
            <h2>Conduct and safeguarding</h2>
            <p>
              <Link href="/mentor-code-of-conduct">Read the mentor code of conduct</Link>
            </p>
            <p>
              <Link href="/safeguarding">Review safeguarding policy</Link>
            </p>
            {data.complianceAccepted ? (
              <Badge>Commitments acknowledged</Badge>
            ) : (
              <Mutation
                title="Acknowledge Commitments"
                onSubmit={async () => setData(await mentorshipPortal.acceptCompliance())}
              >
                <Check required>I have reviewed the policies and understand communication boundaries.</Check>
              </Mutation>
            )}
          </Card>
          {memberSelect}
          {selected && concerned(selected)}
          <h3>Recorded concerns</h3>
          {!data.concerns.length && <p>No concerns recorded.</p>}
          {data.concerns.map((item) => (
            <Card key={item.id}>
              <h3>{item.kind}</h3>
              <p>{item.detail}</p>
              <Badge>Awaiting review</Badge>
            </Card>
          ))}
        </>
      )}
    </>
  );
}
function SessionCard({
  session,
  mentor,
  base,
  onChange,
}: {
  session: MentorSession;
  mentor: boolean;
  base: string;
  onChange: (data: MentorWorkspace) => void;
}) {
  return (
    <Card>
      <Badge>{session.status}</Badge>
      <h2>
        <Link href={`${base}/sessions/${session.id}`}>{session.title}</Link>
      </h2>
      <p>
        {new Date(session.startsAt).toLocaleString()} · {session.duration} minutes
      </p>
      <p>{session.agenda}</p>
      {session.oversight && (
        <Notice>Guardian consent and communication oversight are required for this session.</Notice>
      )}
      {session.outcome && <p>Outcome: {session.outcome}</p>}
      {session.status === 'Scheduled' && (
        <div className="actions">
          <Mutation
            title="Reschedule"
            onSubmit={async (form) =>
              onChange(
                await mentorshipPortal.session(
                  session.id,
                  'reschedule',
                  String(form.get('reason')),
                  String(form.get('startsAt')),
                ),
              )
            }
          >
            <Field label="New session date and time" name="startsAt" type="datetime-local" required />
            <Textarea label="Reschedule reason" name="reason" required minLength={3} />
          </Mutation>
          <Mutation
            title="Cancel Session"
            confirmation="This cancels the scheduled session. It remains visible in session history."
            onSubmit={async (form) =>
              onChange(await mentorshipPortal.session(session.id, 'cancel', String(form.get('reason'))))
            }
          >
            <Textarea label="Cancellation reason" name="reason" required minLength={3} />
          </Mutation>
          {mentor && (
            <Mutation
              title="Complete Session"
              onSubmit={async (form) =>
                onChange(await mentorshipPortal.session(session.id, 'complete', String(form.get('outcome'))))
              }
            >
              <Textarea label="Session outcome" name="outcome" required minLength={3} />
            </Mutation>
          )}
          {session.joinUrl ? (
            <a className="button primary" href={session.joinUrl} target="_blank" rel="noreferrer">
              Join Session
            </a>
          ) : (
            <Notice>A meeting link will appear when an approved meeting provider is connected.</Notice>
          )}
        </div>
      )}
    </Card>
  );
}
