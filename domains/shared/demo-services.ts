'use client';
import type {
  AuthService,
  Session,
  SupportService,
  GuardianService,
  MentorService,
  MentorStatus,
} from './contracts';
const key = 'gap-demo-session';
const delay = async () => {
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (!navigator.onLine) throw new Error('You are offline. Reconnect and try again.');
};
export const verification: import('./contracts').VerificationService = {
  async verify(code) {
    await delay();
    if (code !== '123456') throw new Error('The code is incorrect. Try again.');
  },
};
export function readSession(): Session | null {
  try {
    const value = sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as Session) : null;
  } catch {
    return null;
  }
}
export function saveSession(value: Session) {
  sessionStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event('session-change'));
  return value;
}
const create = (email: string, status: Session['status']): Session => ({
  id: crypto.randomUUID(),
  email,
  status,
  role: 'member',
  expiresAt: Date.now() + 3600000,
});
export const auth: AuthService = {
  async register(email) {
    await delay();
    return saveSession(create(email, 'unverified'));
  },
  async login(email) {
    await delay();
    return saveSession(create(email, 'onboarding'));
  },
  async recover() {
    await delay();
  },
  async reset(token) {
    await delay();
    if (token !== 'demo-reset') throw new Error('This reset link is invalid or expired. Request a new link.');
  },
  async verify(code) {
    await verification.verify(code);
    const current = readSession();
    if (!current) throw new Error('Create an account or log in first.');
    return saveSession({
      ...current,
      status: current.status === 'unverified' ? 'onboarding' : current.status,
    });
  },
  async resend() {
    await delay();
  },
  async logout() {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem('gap-onboarding');
    sessionStorage.removeItem('gap-first-goal');
    sessionStorage.removeItem('gap-plan');
    window.dispatchEvent(new Event('session-change'));
  },
};
export const support: SupportService = {
  async submit() {
    await delay();
    return { reference: `DEMO-${crypto.randomUUID().slice(0, 8)}` };
  },
};
export const guardian: GuardianService = {
  async withdraw(consentId) {
    await delay();
    if (consentId !== 'demo-invitation') throw new Error('Consent record not found.');
  },
  async invitation(token) {
    await delay();
    return token === 'demo-invitation'
      ? 'valid'
      : token === 'expired'
        ? 'expired'
        : token === 'used'
          ? 'used'
          : 'invalid';
  },
  async respond(token) {
    await delay();
    if (token !== 'demo-invitation') throw new Error('Invitation is no longer valid.');
  },
};
export const mentors: MentorService = {
  async submit() {
    await delay();
    const result = { id: `DEMO-${crypto.randomUUID().slice(0, 8)}`, status: 'submitted' as const };
    sessionStorage.setItem('gap-mentor-status', JSON.stringify(result));
    return result;
  },
  async status(id) {
    await delay();
    const stored = sessionStorage.getItem('gap-mentor-status');
    if (stored) {
      const saved = JSON.parse(stored) as { id: string; status: MentorStatus };
      if (saved.id === id || id === 'latest')
        return {
          ...saved,
          note: 'Your demo application is awaiting review. No application or files have been sent.',
        };
    }
    const fixtures: Record<string, { status: MentorStatus; note: string }> = {
      draft: { status: 'draft', note: 'Complete and review your application before submitting.' },
      submitted: { status: 'submitted', note: 'Your application has been submitted for review.' },
      'under-review': {
        status: 'under_review',
        note: 'The review team is checking your application and references.',
      },
      'more-information-required': {
        status: 'more_information_required',
        note: 'Please clarify your relevant mentoring experience. Use fictional information in this demo.',
      },
      approved: {
        status: 'approved',
        note: 'Your application has been approved in this fixture. This does not grant real mentor permissions.',
      },
      rejected: {
        status: 'rejected',
        note: 'Your application was not approved. Contact the review team to request the decision details or a review.',
      },
      suspended: {
        status: 'suspended',
        note: 'Mentor participation is suspended. Contact support to request a review. Restricted features remain unavailable.',
      },
    };
    const fixture = fixtures[id.replace(/^demo-/, '')];
    if (fixture && id.startsWith('demo-')) return { id, ...fixture };
    return null;
  },
  async provideInformation(id, response) {
    await delay();
    if (id !== 'demo-more-information-required' || response.trim().length < 20)
      throw new Error('Enter at least 20 characters for the requested response.');
    sessionStorage.setItem('gap-mentor-status', JSON.stringify({ id, status: 'under_review' }));
  },
};
