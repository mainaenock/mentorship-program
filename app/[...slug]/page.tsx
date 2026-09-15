import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { pages } from '../../domains/marketing/content';
import {
  Contact,
  Faq,
  Library,
  Pricing,
  PrivacyControls,
  Stories,
} from '../../domains/marketing/interactive';
import { AuthForm } from '../../domains/authentication/auth-form';
import { AuthenticatedShell, AccountStatus } from '../../domains/authentication/shell';
import { Onboarding } from '../../domains/onboarding/wizard';
import { Invitation } from '../../domains/guardian/invitation';
import { MentorApplication } from '../../domains/mentorship/application';
import { MentorApplicationStatus } from '../../domains/mentorship/status';
import { config, slug } from '../../domains/shared/config';
import { ActionLink, Card, Notice } from '../../domains/shared/ui';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string[] }> };
const special: Record<string, [string, string]> = {
  pricing: ['A clear path to getting started.', 'Transparent choices for your journey.'],
  faq: ['Good questions. Clear answers.', 'Find the information you need to take your next step.'],
  contact: ['Let’s find a way forward.', 'Questions, feedback, or a concern? We’re ready to listen.'],
  'success-stories': [
    'Every goal has a story.',
    'Real stories require real permission. Explore an illustrative journey.',
  ],
  'learning/library': ['Your learning library.', 'Resources that turn knowledge into action.'],
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: segments } = await params;
  const route = segments.join('/');
  return {
    title: pages[route]?.title || special[route]?.[0] || segments[0].replaceAll('-', ' '),
    robots: /login|register|onboarding|guardian|application|dashboard|password|verify/.test(route)
      ? { index: false, follow: false }
      : undefined,
  };
}
export default async function Page({ params }: Props) {
  const { slug: segments } = await params;
  const route = segments.join('/');
  if (
    ['login', 'register', 'forgot-password', 'reset-password', 'verify-email', 'verify-phone'].includes(route)
  )
    return <AuthForm mode={route} />;
  if (route === 'onboarding') return <Onboarding />;
  if (route === 'dashboard') return <AuthenticatedShell />;
  if (route === 'account-status') return <AccountStatus />;
  if (segments[0] === 'guardian' && segments[1] === 'invitation' && segments.length === 3)
    return <Invitation token={segments[2]} />;
  if (route === 'mentor/application') return <MentorApplication />;
  if (
    segments[0] === 'mentor' &&
    segments[1] === 'application' &&
    segments[2] === 'status' &&
    segments.length === 4
  )
    return <MentorApplicationStatus id={segments[3]} />;
  const states: Record<string, [string, string, string, string]> = {
    offline: [
      'You’re offline.',
      'Reconnect to continue your journey. Private information is not stored in the offline cache.',
      '/',
      'Try again',
    ],
    unauthorized: [
      'This space needs permission.',
      'Your account does not have access to this area.',
      '/login',
      'Log in',
    ],
    maintenance: [
      'A short pause for improvements.',
      'The platform is undergoing maintenance. Please try again later.',
      '/',
      'Retry',
    ],
    'setup-saved': [
      'Your place is saved.',
      'Safe setup progress is available in this browser tab. Resume when you’re ready.',
      '/onboarding',
      'Resume setup',
    ],
    'account-pending': [
      'Activation pending.',
      'Your membership requires activation. Contact support for help.',
      '/contact',
      'Contact support',
    ],
    'account-suspended': [
      'Your account is suspended.',
      'Restricted features are unavailable. Contact support to ask about a review.',
      '/contact',
      'Request review',
    ],
    'mentor-pending': [
      'Application awaiting review.',
      'Your mentor permissions remain inactive until verification and approval.',
      '/contact',
      'Contact review team',
    ],
  };
  if (states[route]) {
    const [title, body, href, cta] = states[route];
    return (
      <div className="form-page">
        <h1>{title}</h1>
        <p>{body}</p>
        <ActionLink href={href}>{cta}</ActionLink>
      </div>
    );
  }
  const policy = config.policies.find((item) => slug(item) === route);
  if (policy)
    return (
      <>
        <div className="page-hero">
          <div className="container">
            <span className="eyebrow">YOUR TRUST MATTERS</span>
            <h1>{policy}</h1>
            <p>Version 1.0 · Draft effective date: 14 September 2026</p>
          </div>
        </div>
        <div className="container narrow page-content">
          <Notice>
            This policy is a structured draft for legal and operational review. It is not an approved
            production policy.
          </Notice>
          {route === 'privacy-centre' && <PrivacyControls />}
          <PolicySections route={route} />
          <h2>Questions and requests</h2>
          <p>
            Contact the platform team through the <Link href="/contact">support form</Link>. An approved legal
            entity, postal address, data protection contact, and jurisdiction-specific details must be added
            before launch.
          </p>
        </div>
      </>
    );
  const page = pages[route];
  const info = special[route];
  if (!page && !info) notFound();
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <span className="eyebrow">{page?.eyebrow || 'YOUR NEXT STEP'}</span>
          <h1>{page?.title || info[0]}</h1>
          <p>{page?.intro || info[1]}</p>
        </div>
      </div>
      <div className="container page-content">
        {page && (
          <>
            <div className="content-grid">
              {route === 'about' &&
                config.team.map((member) => (
                  <Card key={member.name}>
                    <h2>{member.name}</h2>
                    <p>{member.role}</p>
                    <p>{member.biography}</p>
                  </Card>
                ))}
              {page.sections.map((section) => (
                <Card key={section.title}>
                  <h2 style={{ fontSize: 27, letterSpacing: '-.5px' }}>{section.title}</h2>
                  <p>{section.text}</p>
                </Card>
              ))}
            </div>
            {route === 'goals' && (
              <div className="category-grid" style={{ marginTop: 30 }}>
                {config.categories.map((item) => (
                  <Link
                    className="category-card"
                    key={item}
                    href={`/register?interest=${encodeURIComponent(item)}`}
                  >
                    {item} ↗
                  </Link>
                ))}
              </div>
            )}
            <div className="actions">
              {page.cta && page.href && <ActionLink href={page.href}>{page.cta}</ActionLink>}
              {route === 'mentorship' && (
                <ActionLink href="/mentor/application" secondary>
                  Become a mentor
                </ActionLink>
              )}
              {route === 'become-a-mentor' && (
                <Link href="/mentor-code-of-conduct">Read the mentor code of conduct</Link>
              )}
            </div>
          </>
        )}
        {route === 'pricing' && <Pricing />}
        {route === 'faq' && <Faq />}
        {route === 'contact' && (
          <div className="narrow" style={{ maxWidth: 620 }}>
            <Contact />
          </div>
        )}
        {route === 'success-stories' && <Stories />}
        {route === 'learning/library' && <Library />}
      </div>
    </>
  );
}
function PolicySections({ route }: { route: string }) {
  const sections: Record<string, [string, string][]> = {
    privacy: [
      [
        'Information and purposes',
        'Account, contact, age, goal, and consent information support participation. The production notice must identify each processing purpose, lawful basis, and recipient.',
      ],
      [
        'Children and guardians',
        'Collect the minimum necessary information. Independently verify guardian authority and record specific consent before activating restricted features.',
      ],
      [
        'Retention, rights, and transfers',
        'Define retention schedules, deletion rules, access and correction processes, processors, international transfer safeguards, and complaint routes before launch.',
      ],
    ],
    terms: [
      [
        'Participation',
        'Members must provide accurate information, respect others, and use the platform responsibly. Eligibility, account activation, and suspension rules require legal approval.',
      ],
      [
        'Goals and services',
        'Members remain responsible for their decisions and actions. The platform must describe service availability, intellectual property, dispute handling, and limitations clearly.',
      ],
      [
        'Commercial terms',
        'Display prices, renewals, cancellation, taxes, and refund conditions before payment. No unapproved fees may be collected.',
      ],
    ],
    safeguarding: [
      [
        'A safe and respectful space',
        'Maintain appropriate boundaries, prohibit harassment and exploitation, and use approved communication channels.',
      ],
      [
        'Protecting younger members',
        'Guardian oversight, consent controls, age-appropriate matching, and mentor screening are required. Restricted features remain disabled while consent or approval is pending.',
      ],
      [
        'Reporting and responding',
        'Report concerns through support. A production safeguarding team must define triage, escalation, confidentiality limits, emergency handling, and response times. If there is immediate danger, contact local emergency services.',
      ],
    ],
    'mentor-code-of-conduct': [
      [
        'Respect and boundaries',
        'Listen without judgement, respect member agency, avoid conflicts of interest, and communicate only through approved channels.',
      ],
      [
        'Professional responsibility',
        'Keep commitments, represent expertise honestly, avoid inappropriate relationships or solicitation, and do not promise outcomes.',
      ],
      [
        'Safeguarding and accountability',
        'Report concerns promptly, cooperate with review, and follow guardian oversight requirements for minors. Breaches may result in restricted access or removal following approved procedures.',
      ],
    ],
    'refund-policy': [
      [
        'Before purchase',
        'Each offer must disclose the price, delivery terms, cancellation conditions, and applicable refund window. These commercial settings are awaiting approval.',
      ],
      [
        'Requesting a refund',
        'Contact support with the transaction reference and reason. Do not send full payment credentials.',
      ],
      [
        'Review and outcome',
        'The production policy must specify processing times, payment method handling, credit adjustments, statutory rights, and appeal routes.',
      ],
    ],
    accessibility: [
      [
        'Our commitment',
        'Design for keyboard navigation, readable text, visible focus, reduced motion, screen readers, and mobile layouts. The target is WCAG 2.2 AA; independent conformance assessment remains required.',
      ],
      [
        'Supported interaction',
        'Use the skip link to reach main content. Menus and dialogs support Escape and focus restoration. Fields have visible labels and errors.',
      ],
      [
        'Report a barrier',
        'Contact support with the page, assistive technology, and task you could not complete. Do not include sensitive account data.',
      ],
    ],
    'privacy-centre': [
      [
        'Control and accountability',
        'You can change optional preferences and request access, correction, export, or deletion. Production identity verification is required before acting on account-level requests.',
      ],
    ],
  };
  return (
    <>
      {sections[route]?.map(([title, text]) => (
        <section key={title} style={{ marginBlock: 35 }}>
          <h2 style={{ fontSize: 28 }}>{title}</h2>
          <p>{text}</p>
        </section>
      ))}
    </>
  );
}
