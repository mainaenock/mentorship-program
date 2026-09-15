'use client';
import { SafeForm } from '../shared/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Check as CheckIcon, Search } from 'lucide-react';
import { config, money } from '../shared/config';
import { ActionLink, Badge, Button, Card, Check, Empty, Field, Notice, Select, Textarea } from '../shared/ui';
import { support } from '../shared/demo-services';
export const questions = [
  {
    category: 'Getting started',
    q: 'Do I need to have a goal already?',
    a: 'No. Explore the goal categories, reflect on what matters to you, and create a goal during setup. You can refine it as you learn.',
  },
  {
    category: 'Getting started',
    q: 'Who is this platform for?',
    a: 'Young people and adults who want to work towards meaningful goals. Members under 18 follow a guardian consent process before restricted features are activated.',
  },
  {
    category: 'Mentorship',
    q: 'How does mentorship work?',
    a: 'Your goals, interests, language, and availability inform matching. Mentors help you reflect and plan your next action through structured sessions.',
  },
  {
    category: 'Membership',
    q: 'What does it cost to get started?',
    a: 'The current configuration enables free registration. Membership, paid resources, and mentorship prices must be published before purchase. No payment is collected in this foundation.',
  },
  {
    category: 'Safety',
    q: 'How are younger members supported?',
    a: 'A guardian must independently verify their contact and grant specific consent. Restricted features remain locked while consent is pending.',
  },
  {
    category: 'Membership',
    q: 'What are Learning Credits?',
    a: 'Learning Credits represent a configured entitlement for eligible learning resources. Conversion, expiry, refunds, and eligible materials must be shown before a purchase. Credits are not cash.',
  },
];
export function Faq({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const matches = questions.filter(
    (item) =>
      (!category || category === 'All topics' || item.category === category) &&
      `${item.q} ${item.a}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      {!compact && (
        <div className="filter-row">
          <Field
            label="Search questions"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            label="Topic"
            options={['All topics', ...new Set(questions.map((q) => q.category))]}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
        </div>
      )}
      <div className="faq-list">
        {matches.slice(0, compact ? 4 : undefined).map((item) => (
          <details key={item.q}>
            <summary>
              {item.q}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
        {!matches.length && (
          <Empty title="No matching questions">Try another word or choose a different topic.</Empty>
        )}
      </div>
      <p>
        Still have a question?{' '}
        <Link className="text-link inline" href="/contact">
          Talk to us <ArrowUpRight size={16} />
        </Link>
      </p>
    </>
  );
}
export function Pricing({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div className="pricing-grid">
        {config.plans.map((plan) => (
          <Card key={plan.id}>
            <span className="eyebrow">{plan.period}</span>
            <h3>{plan.name}</h3>
            <div className="price">{plan.price === null ? 'Pricing to be published' : money(plan.price)}</div>
            <p>{plan.description}</p>
            <ul className="check-list">
              {plan.features.map((feature) => (
                <li key={feature}>
                  <CheckIcon size={18} />
                  {feature}
                </li>
              ))}
            </ul>
            <ActionLink href={`/register?plan=${plan.id}`}>
              Get started <ArrowUpRight size={17} />
            </ActionLink>
          </Card>
        ))}
      </div>
      {!compact && (
        <>
          <h2>Transparent choices, at every step.</h2>
          <p>
            Registration, membership, learning materials, and mentorship can have separate pricing. Your
            selected plan is carried into registration; there is no checkout until commercial settings are
            approved.
          </p>
          <h3>Learning Credits</h3>
          <p>
            Eligible content may be accessed using Learning Credits. Each resource will display its credit
            cost and applicable conditions before you confirm access.
          </p>
          <Link className="text-link" href="/refund-policy">
            Read the refund policy
          </Link>
          <Faq />
        </>
      )}
    </>
  );
}
export function Contact() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <SafeForm
      className="form-stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        const form = event.currentTarget;
        try {
          const result = await support.submit(Object.fromEntries(new FormData(form)));
          setMessage(
            `Demo submission recorded: ${result.reference}. No message has been sent. Production delivery requires the support service.`,
          );
          form.reset();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Name" name="name" autoComplete="name" required maxLength={100} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" placeholder="+254" />
      <Select
        label="Subject"
        name="subject"
        options={[
          'Getting started',
          'Membership',
          'Mentorship',
          'Safeguarding concern',
          'Privacy request',
          'Other',
        ]}
        required
      />
      <Textarea label="Message" name="message" minLength={10} maxLength={5000} required />
      <Check name="consent" required>
        I agree to the use of these details to respond to my request.{' '}
        <Link href="/privacy">Read the privacy notice.</Link>
      </Check>
      <Notice>
        Demo form · Turnstile and message delivery require backend configuration. Do not enter sensitive
        information.
      </Notice>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <Button type="submit" loading={busy}>
        Submit message
      </Button>
    </SafeForm>
  );
}
export function Stories() {
  const [category, setCategory] = useState('');
  const [open, setOpen] = useState(false);
  return (
    <>
      <Select
        label="Filter stories by goal"
        options={['All categories', ...config.categories]}
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      />
      {!category || ['All categories', 'Technology'].includes(category) ? (
        <Card>
          <Badge tone="info">Illustrative example · Technology</Badge>
          <h2>A first project, one week at a time.</h2>
          <p>
            An example of how a skill-building goal becomes a practical achievement. This is not a real member
            testimonial.
          </p>
          <Button variant="outline" onClick={() => setOpen(!open)} aria-expanded={open}>
            {open ? 'Close story' : 'Read the journey'}
          </Button>
          {open && (
            <ol className="timeline">
              {[
                'Goal: build an accessible personal webpage in eight weeks.',
                'Plan: complete two lessons and one practical task each week.',
                'Evidence: save a project link and a short reflection.',
                'Mentorship: review obstacles and agree the next action.',
                'Evaluation: compare the finished project against the original goal.',
                'Achievement: reflect on what improved and choose a next goal.',
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          )}
        </Card>
      ) : (
        <Empty title="No published stories in this category">
          Member stories will appear only with verified permission. Try Technology to view an illustrative
          example.
        </Empty>
      )}
    </>
  );
}
export function PrivacyControls() {
  const [saved, setSaved] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gap-consent') || '{}');
      setAnalytics(saved.analytics === true);
    } catch {
      setAnalytics(false);
    }
  }, []);
  return (
    <Card>
      <h2>Your privacy choices</h2>
      <p>
        Essential session and theme storage support this experience. Optional analytics is off by default; no
        analytics provider is connected.
      </p>
      <Check checked disabled>
        Essential storage
      </Check>
      <Check checked={analytics} onChange={(e) => setAnalytics(e.target.checked)}>
        Allow optional analytics when configured
      </Check>
      <Button
        onClick={() => {
          localStorage.setItem(
            'gap-consent',
            JSON.stringify({ analytics, version: '1', at: new Date().toISOString() }),
          );
          setSaved(true);
        }}
      >
        Save preferences
      </Button>
      {saved && <Notice>Your preferences have been saved on this device.</Notice>}
      <p>
        <Link href="/contact?subject=Privacy%20request">
          Request access, correction, export, or deletion of your data
        </Link>
      </p>
    </Card>
  );
}
export function Library() {
  const [q, setQ] = useState('');
  return (
    <>
      <Field
        label="Search learning resources"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Empty title={q ? `No published resources match “${q}”` : 'Your learning journey begins with a goal'}>
        The library is awaiting approved content. Create your goal to prepare for relevant recommendations.
      </Empty>
      <ActionLink href="/register">
        Create a goal <Search size={18} />
      </ActionLink>
    </>
  );
}
