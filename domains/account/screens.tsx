'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Check,
  Field,
  Notice,
  SafeForm,
  Select,
  Skeleton,
  Textarea,
} from '../shared/ui';
import { Mutation } from '../goals/screens';
import { accountService, type AccountData, type Preferences } from './service';
import { config } from '../shared/config';
export function AccountPage({ section, base = '/app' }: { section: string; base?: string }) {
  const [data, setData] = useState<AccountData | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      setData(await accountService.read());
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (!data)
    return error ? (
      <Notice error>
        {error}
        <Button onClick={load}>Retry</Button>
      </Notice>
    ) : (
      <Skeleton />
    );
  async function save(operation: () => Promise<AccountData>) {
    setBusy(true);
    setError('');
    try {
      setData(await operation());
      setMessage('Saved in your demonstration account.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const preferences: [keyof Preferences, string][] = section.includes('privacy')
    ? [
        ['achievementsPublic', 'Allow privacy-safe achievement sharing'],
        ['analytics', 'Optional analytics'],
      ]
    : [
        ['email', 'Email notifications'],
        ['sms', 'SMS notifications'],
        ['inApp', 'In-app notifications'],
        ['reminders', 'Action reminders'],
      ];
  return (
    <>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      {section === 'profile' && (
        <Card>
          <SafeForm
            onSubmit={(e) => {
              e.preventDefault();
              void save(() => accountService.saveProfile(data.profile));
            }}
          >
            <Field
              label="Display name"
              required
              value={data.profile.displayName}
              onChange={(e) =>
                setData({ ...data, profile: { ...data.profile, displayName: e.target.value } })
              }
            />
            <Field label="Account email" type="email" value={data.profile.email} readOnly />
            <p>Changing a verified contact requires a separate verification flow.</p>
            <Field
              label="Phone"
              type="tel"
              value={data.profile.phone}
              onChange={(e) => setData({ ...data, profile: { ...data.profile, phone: e.target.value } })}
            />
            <Select
              label="Language"
              options={[...config.languages]}
              value={data.profile.language}
              required
              onChange={(e) => setData({ ...data, profile: { ...data.profile, language: e.target.value } })}
            />
            <Select
              label="Timezone"
              options={['Africa/Nairobi', 'UTC']}
              value={data.profile.timezone}
              required
              onChange={(e) => setData({ ...data, profile: { ...data.profile, timezone: e.target.value } })}
            />
            <Textarea
              label="About you"
              value={data.profile.biography}
              onChange={(e) => setData({ ...data, profile: { ...data.profile, biography: e.target.value } })}
            />
            <Button type="submit" loading={busy}>
              Save Profile
            </Button>
          </SafeForm>
        </Card>
      )}
      {section === 'settings' && (
        <div className="portal-grid">
          {[
            ['security', 'Security'],
            ['notifications', 'Notification Preferences'],
            ['privacy', 'Privacy'],
          ].map(([path, label]) => (
            <Card key={path}>
              <h2>{label}</h2>
              <Link href={`${base}/settings/${path}`}>Manage {label}</Link>
            </Card>
          ))}
        </div>
      )}
      {(section === 'settings/notifications' || section === 'settings/privacy') && (
        <Card>
          <SafeForm
            onSubmit={(e) => {
              e.preventDefault();
              void save(() => accountService.savePreferences(data.preferences));
            }}
          >
            {preferences.map(([key, label]) => (
              <Check
                key={key}
                checked={data.preferences[key]}
                onChange={(e) =>
                  setData({ ...data, preferences: { ...data.preferences, [key]: e.target.checked } })
                }
              >
                {label}
              </Check>
            ))}
            <Button type="submit" loading={busy}>
              Save Preferences
            </Button>
          </SafeForm>
          {section.endsWith('privacy') && (
            <>
              <p>Private reflections and mentor private notes are never included in achievement sharing.</p>
              <Mutation
                title="Request Data Access"
                onSubmit={async (form) =>
                  setData(
                    await accountService.request(
                      'Privacy',
                      'Data access request',
                      String(form.get('detail')),
                    ),
                  )
                }
              >
                <Textarea label="Request details" name="detail" required minLength={10} />
              </Mutation>
              <Mutation
                title="Request Account Deletion"
                confirmation="This submits a review request. Identity verification and retention safeguards apply before deletion; nothing is deleted by this demonstration."
                onSubmit={async (form) =>
                  setData(
                    await accountService.request(
                      'Privacy',
                      'Account deletion request',
                      String(form.get('detail')),
                    ),
                  )
                }
              >
                <Textarea label="Deletion request details" name="detail" required minLength={10} />
              </Mutation>
            </>
          )}
        </Card>
      )}
      {section === 'settings/security' && (
        <Card>
          <h2>Account security</h2>
          <p>
            This browser has one demonstration session. Production session revocation and stronger
            authentication require the identity provider.
          </p>
          <Link className="button outline" href="/forgot-password">
            Change Password
          </Link>
          <Mutation
            title="Review Account Security"
            onSubmit={async (form) =>
              setData(await accountService.request('Security', 'Security review', String(form.get('detail'))))
            }
          >
            <Textarea label="Security concern" name="detail" required minLength={10} />
          </Mutation>
        </Card>
      )}
      {section === 'notifications' && (
        <>
          {!data.notifications.length ? (
            <Card>
              <h2>You’re all caught up</h2>
              <p>Notifications that need your attention will appear here.</p>
            </Card>
          ) : (
            <>
              <Button
                loading={busy}
                onClick={() => {
                  void save(() => accountService.markRead());
                }}
              >
                Mark All Read
              </Button>
              {data.notifications.map((item) => (
                <Card key={item.id}>
                  <Badge>{item.read ? 'Read' : 'Unread'}</Badge>
                  <h3>
                    <Link href={item.href}>{item.title}</Link>
                  </h3>
                  <p>{item.detail}</p>
                  {!item.read && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        void save(() => accountService.markRead(item.id));
                      }}
                    >
                      Mark Read
                    </Button>
                  )}
                </Card>
              ))}
            </>
          )}
        </>
      )}
      {section === 'help' && (
        <div className="portal-grid">
          <Card>
            <h2>Find a clear next step</h2>
            <p>Review the guide to goals, plans, evaluations and mentorship.</p>
            <Link href="/how-it-works">How it works</Link>
          </Card>
          <Card>
            <h2>Questions and support</h2>
            <Link href="/faq">Search frequently asked questions</Link>
            <p>
              <Link href={`${base}/support`}>Contact Support</Link>
            </p>
          </Card>
          <Card>
            <h2>Safety comes first</h2>
            <p>Use the safeguarding information to understand reporting and oversight.</p>
            <Link href="/safeguarding">Safeguarding</Link>
          </Card>
        </div>
      )}
      {section === 'support' && (
        <Card>
          <h2>Open a support request</h2>
          <Notice>Submissions stay in this demonstration account. No email or SMS is sent.</Notice>
          <SafeForm
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void save(() =>
                accountService.request('Support', String(form.get('subject')), String(form.get('detail'))),
              );
            }}
          >
            <Field label="Subject" name="subject" required />
            <Textarea label="How can we help?" name="detail" required minLength={10} />
            <Button loading={busy} type="submit">
              Submit Support Request
            </Button>
          </SafeForm>
        </Card>
      )}
      {['support', 'settings/privacy', 'settings/security'].includes(section) && (
        <>
          <h2>Your requests</h2>
          {!data.requests.length && <p>No requests yet.</p>}
          {data.requests.map((request) => (
            <Card key={request.id}>
              <Badge>{request.status}</Badge>
              <h3>{request.subject}</h3>
              <p>{request.detail}</p>
              <small>
                {request.id} · {request.createdAt}
              </small>
            </Card>
          ))}
        </>
      )}
    </>
  );
}
