export const pages: Record<
  string,
  {
    eyebrow: string;
    title: string;
    intro: string;
    sections: { title: string; text: string }[];
    cta?: string;
    href?: string;
  }
> = {
  about: {
    eyebrow: 'OUR PURPOSE',
    title: 'Potential deserves a path.',
    intro: 'We bring goals, practical learning, and human support into one connected journey.',
    sections: [
      {
        title: 'Our mission',
        text: 'Help people turn meaningful ambitions into measurable progress through action, reflection, and mentorship.',
      },
      {
        title: 'Our vision',
        text: 'A future where everyone has the tools and support to shape their next chapter.',
      },
      {
        title: 'What we value',
        text: 'Agency, steady progress, inclusion, integrity, and safety guide the experience. Success should be defined by the member, with support that respects their context.',
      },
      {
        title: 'Our story and people',
        text: 'This platform is being built around a simple idea: progress improves when learning and accountability work together. Verified leadership biographies and organisational details will be published after approval.',
      },
    ],
    cta: 'Get in touch',
    href: '/contact',
  },
  'how-it-works': {
    eyebrow: 'YOUR JOURNEY',
    title: 'A goal is a beginning. Let’s build the path.',
    intro:
      'Discover, register, verify, and complete age and consent checks. Then turn intention into action.',
    sections: [
      {
        title: '01 · Set a goal and build a plan',
        text: 'Choose a meaningful outcome, a measurable target, and a realistic date. Divide it into milestones and recurring actions.',
      },
      {
        title: '02 · Learn and take action',
        text: 'Use relevant resources and practise new skills. Capture evidence of the work you do.',
      },
      {
        title: '03 · Track and receive mentorship',
        text: 'See progress over time. Members own the actions; mentors offer guidance; guardians oversee age-appropriate participation for minors.',
      },
      {
        title: '04 · Evaluate and adjust',
        text: 'Regular evaluations compare progress with your plan. When a goal is at risk, review obstacles, adjust actions, and request support.',
      },
      {
        title: '05 · Achieve and begin again',
        text: 'Record your achievement, reflect on what helped, and carry the learning into your next goal.',
      },
    ],
    cta: 'Start your journey',
    href: '/register',
  },
  goals: {
    eyebrow: 'FIND YOUR DIRECTION',
    title: 'Make room for what matters.',
    intro: 'A meaningful goal gives your everyday effort a direction.',
    sections: [
      {
        title: 'Make it SMART',
        text: 'Be specific about your outcome. Decide how to measure it. Make it achievable, relevant to your life, and time-bound.',
      },
      {
        title: 'Build milestones and actions',
        text: 'Milestones mark meaningful stages. Recurring actions make the next step clear and manageable.',
      },
      {
        title: 'Keep evidence, evaluate, celebrate',
        text: 'Save reflections and supporting work. Evaluate your progress at regular intervals, adjust when needed, and record what you achieve.',
      },
    ],
    cta: 'Create your first goal',
    href: '/register',
  },
  mentorship: {
    eyebrow: 'GROW WITH SUPPORT',
    title: 'Your journey. A little more perspective.',
    intro: 'A mentor listens, asks thoughtful questions, and helps you identify your next practical step.',
    sections: [
      {
        title: 'Thoughtful matching',
        text: 'Goals, expertise, language, availability, and safeguarding requirements inform matching. A match should fit both the member and mentor.',
      },
      {
        title: 'Conversations with a purpose',
        text: 'Prepare an update, reflect on progress, discuss obstacles, and agree actions. Review those actions at the next session.',
      },
      {
        title: 'Clear boundaries',
        text: 'Use approved communication channels, respect confidentiality limits, and report concerns through support. Mentorship does not replace professional medical, legal, or financial advice.',
      },
      {
        title: 'Support for younger members',
        text: 'Guardian consent, age-appropriate matching, and oversight are required before restricted participation. Guardians can review and withdraw consent.',
      },
    ],
    cta: 'Find support',
    href: '/contact',
  },
  learning: {
    eyebrow: 'KNOWLEDGE INTO ACTION',
    title: 'Learn with a purpose.',
    intro: 'Make learning part of the goal you’re working towards.',
    sections: [
      {
        title: 'Resources for different ways of learning',
        text: 'The library supports articles, video, audio, downloadable guides, practical exercises, and structured courses.',
      },
      {
        title: 'Linked to your goals',
        text: 'Recommendations connect materials to your interests and action plan. Track completion, reflect on key ideas, and put them into practice.',
      },
      {
        title: 'Learning Credits',
        text: 'Some approved materials may require Learning Credits. Costs, eligibility, validity, and refund terms must be visible before access is confirmed.',
      },
    ],
    cta: 'Browse library',
    href: '/learning/library',
  },
  'become-a-mentor': {
    eyebrow: 'SHARE YOUR EXPERIENCE',
    title: 'Help someone find their next step.',
    intro: 'Bring your expertise, curiosity, and a commitment to responsible mentorship.',
    sections: [
      {
        title: 'Who should apply',
        text: 'People with relevant experience, the ability to listen, reliable availability, and a commitment to supportive, respectful conversations.',
      },
      {
        title: 'Verification and review',
        text: 'Submit your background, expertise, references, availability, and supporting documents. Applications require identity, reference, and safeguarding review before approval.',
      },
      {
        title: 'Safeguarding comes first',
        text: 'Follow approved communication rules, maintain appropriate boundaries, and report concerns. Read and accept the mentor code of conduct.',
      },
    ],
    cta: 'Start application',
    href: '/mentor/application',
  },
  help: {
    eyebrow: 'HERE TO HELP',
    title: 'Find a way forward.',
    intro: 'Get answers about your account, goals, membership, and mentorship.',
    sections: [
      {
        title: 'Account access',
        text: 'Use password recovery if you cannot sign in. Verification codes can be resent from the verification page.',
      },
      {
        title: 'Safety and privacy',
        text: 'Contact support to report a concern or make a privacy request. Do not include identity documents or sensitive personal information in a general contact message.',
      },
    ],
    cta: 'Contact support',
    href: '/contact',
  },
};
