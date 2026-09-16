import type { Material, MaterialType } from './contracts';
/** Authored demonstration content; none of these prices are a published commercial offer. */
const types: MaterialType[] = [
  'Article',
  'PDF',
  'Video',
  'Audio',
  'Worksheet',
  'Template',
  'Quiz',
  'Mini-course',
  'Assessment',
  'External resource',
];
export const demoMaterials: Material[] = types.map((type, index) => ({
  id: `demo-${type.toLowerCase().replaceAll(' ', '-')}`,
  title: `${type === 'Article' ? 'Turn an outcome into your next action' : type === 'Mini-course' ? 'Build a sustainable weekly plan' : `${type}: planning meaningful progress`}`,
  description:
    'An authored demonstration resource for practising goal planning. Content and commercial settings require publication approval before launch.',
  author: 'Platform demonstration library',
  type,
  duration: type === 'Mini-course' ? 20 : 5,
  level: 'Beginner',
  category: index % 2 ? 'Personal Development' : 'Technology',
  goalsSupported: ['Build consistent habits', 'Plan a practical project'],
  priceMinor: type === 'Mini-course' ? 10000 : 0,
  creditsCost: type === 'Mini-course' ? 100 : 0,
  currency: 'KES',
  featured: index < 3,
  published: true,
  downloadAllowed: type === 'Worksheet' || type === 'Template',
  preview:
    'Choose one outcome that matters to you. Name the smallest action you can take this week and decide how you will know it is complete.',
  lessons: [
    {
      id: 'outcome',
      title: 'Name the outcome',
      body: 'Write one sentence describing the result you want. Choose a measure you can observe, such as a published page, a completed practice session or a finished project. Separate the outcome from the activity: an outcome tells you what changed; an activity describes the work you did.',
    },
    ...(type === 'Mini-course'
      ? [
          {
            id: 'action',
            title: 'Make the next action manageable',
            body: 'Choose a small action with a clear starting point. Give it a date and an amount of time. If it repeatedly goes unfinished, review its size or schedule. Record what you learned so the next plan reflects your actual circumstances.',
          },
        ]
      : []),
  ],
  questions: ['Quiz', 'Assessment', 'Mini-course'].includes(type)
    ? [
        {
          id: 'q1',
          prompt: 'Which action has the clearest completion condition?',
          options: [
            'Get better at everything',
            'Spend 20 minutes drafting one portfolio page',
            'Think about a project sometime',
          ],
          answer: 1,
          explanation: 'A specific task and a time boundary make it easier to start and record completion.',
        },
      ]
    : [],
  reviewsEnabled: false,
  certificateEnabled: type === 'Mini-course',
}));
