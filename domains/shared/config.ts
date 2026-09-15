export const config = {
  name: 'Goal Achievement Platform',
  shortName: 'Goal Achievement',
  locale: 'en-KE',
  country: 'KE',
  currency: 'KES',
  timezone: 'Africa/Nairobi',
  adultAge: 18,
  demo: true,
  googleAuth: false,
  newsletter: false,
  membershipActivationRequired: false,
  phonePlaceholder: '+254 712 345 678',
  countries: ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Other'],
  languages: ['English', 'Kiswahili'],
  impactMetrics: [] as { label: string; value: string; source: string }[],
  partners: [] as { name: string; href: string }[],
  socialLinks: [] as { name: string; href: string }[],
  team: [] as { name: string; role: string; biography: string }[],
  plans: [
    {
      id: 'foundation',
      name: 'Your starting point',
      price: 0,
      period: 'registration',
      description: 'Make space for what you want to achieve.',
      features: ['Create your profile', 'Discover goal categories', 'Build your first goal'],
    },
    {
      id: 'membership',
      name: 'Grow with support',
      price: null,
      period: 'membership',
      description: 'A connected journey of learning and mentorship.',
      features: ['Guided action plans', 'Goal-linked learning', 'Mentorship and evaluations'],
    },
  ],
  categories: [
    'Education',
    'Career',
    'Business',
    'Finance',
    'Personal development',
    'Leadership',
    'Health and fitness',
    'Technology',
    'Skills',
    'Community service',
  ],
  policies: [
    'Privacy',
    'Terms',
    'Safeguarding',
    'Mentor code of conduct',
    'Refund policy',
    'Privacy centre',
    'Accessibility',
  ],
  lifecycle: [
    'Set a goal',
    'Build a plan',
    'Take action',
    'Learn',
    'Track progress',
    'Get mentored',
    'Evaluate',
    'Achieve',
  ],
};
export const slug = (value: string) => value.toLowerCase().replaceAll(' ', '-');
export const money = (value: number) =>
  config.currency === 'KES'
    ? `KSh ${new Intl.NumberFormat(config.locale, { maximumFractionDigits: 0 }).format(value)}`
    : new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency }).format(value);
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat(config.locale, { dateStyle: 'medium', timeZone: config.timezone }).format(
    new Date(date),
  );
export const copy = { en: { start: 'Start your journey', continue: 'Continue', save: 'Save and exit' } };
export interface Analytics {
  track(
    event: 'registration_started' | 'onboarding_completed' | 'mentor_submitted',
    properties?: Record<string, string>,
  ): void;
}
export const analytics: Analytics = {
  track() {
    /* Connect only after analytics consent. */
  },
};
