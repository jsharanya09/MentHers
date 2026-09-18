// All questionnaire content lives here so it can be edited without touching the UI code.
//
// Question types: 'text' | 'email' | 'textarea' | 'single' | 'multi'
// `label`, `hint` and `placeholder` can be a string, or an object keyed by role
// ({ mentee: '...', mentor: '...' }) to show different wording per role.

const TOPIC_OPTIONS = [
  { value: 'software', label: 'Software engineering' },
  { value: 'data-ai', label: 'Data & AI' },
  { value: 'product', label: 'Product management' },
  { value: 'design', label: 'Design & UX' },
  { value: 'business', label: 'Business & entrepreneurship' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare & science' },
  { value: 'marketing', label: 'Marketing & communications' },
  { value: 'other', label: 'Something else' },
]

export const STEPS = [
  {
    id: 'about',
    title: 'Let’s start with you',
    questions: [
      {
        id: 'role',
        type: 'single',
        label: 'What brings you to MentHers?',
        required: true,
        options: [
          {
            value: 'mentee',
            label: 'I’m looking for a mentor',
            description: 'Get guidance, feedback and support from someone who’s been there.',
          },
          {
            value: 'mentor',
            label: 'I want to be a mentor',
            description: 'Share your experience and help someone grow.',
          },
        ],
      },
      { id: 'name', type: 'text', label: 'Full name', required: true, autoComplete: 'name' },
      {
        id: 'email',
        type: 'email',
        label: 'Email address',
        hint: 'We’ll only use this to tell you about your match.',
        required: true,
        autoComplete: 'email',
      },
    ],
  },
  {
    id: 'background',
    title: 'Your background',
    questions: [
      {
        id: 'stage',
        type: 'single',
        label: 'Where are you in your career?',
        required: true,
        options: [
          { value: 'student', label: 'Student' },
          { value: 'early', label: 'Early career (0–3 years)' },
          { value: 'mid', label: 'Mid career (4–10 years)' },
          { value: 'senior', label: 'Senior (10+ years)' },
        ],
      },
      {
        id: 'fields',
        type: 'multi',
        label: {
          mentee: 'Which areas are you most interested in?',
          mentor: 'Which areas do you have experience in?',
        },
        hint: 'Pick up to 3.',
        required: true,
        max: 3,
        options: TOPIC_OPTIONS,
      },
    ],
  },
  {
    id: 'goals',
    title: 'Goals and skills',
    questions: [
      {
        id: 'skills',
        type: 'multi',
        label: {
          mentee: 'What do you want to get better at?',
          mentor: 'What can you help others with?',
        },
        hint: 'Pick up to 4.',
        required: true,
        max: 4,
        options: [
          { value: 'career-planning', label: 'Career planning' },
          { value: 'interviews', label: 'Interviews & job search' },
          { value: 'technical', label: 'Technical skills' },
          { value: 'leadership', label: 'Leadership' },
          { value: 'networking', label: 'Networking' },
          { value: 'confidence', label: 'Confidence & speaking up' },
          { value: 'work-life', label: 'Work–life balance' },
          { value: 'switching', label: 'Changing careers' },
        ],
      },
      {
        id: 'goals',
        type: 'textarea',
        label: {
          mentee: 'What do you hope to achieve in the next 6–12 months?',
          mentor: 'What draws you to mentoring?',
        },
        placeholder: {
          mentee: 'For example: land my first internship, move into a leadership role…',
          mentor: 'For example: I wish I’d had a mentor when I was starting out…',
        },
        required: true,
        maxLength: 500,
      },
    ],
  },
  {
    id: 'style',
    title: 'How you like to work',
    questions: [
      {
        id: 'frequency',
        type: 'single',
        label: 'How often would you like to meet?',
        required: true,
        options: [
          { value: 'weekly', label: 'Weekly' },
          { value: 'biweekly', label: 'Every two weeks' },
          { value: 'monthly', label: 'Monthly' },
        ],
      },
      {
        id: 'format',
        type: 'multi',
        label: 'Which meeting formats work for you?',
        hint: 'Pick all that apply.',
        required: true,
        options: [
          { value: 'video', label: 'Video call' },
          { value: 'chat', label: 'Messaging' },
          { value: 'in-person', label: 'In person' },
        ],
      },
      {
        id: 'approach',
        type: 'single',
        label: 'What kind of conversations do you prefer?',
        required: true,
        options: [
          { value: 'structured', label: 'Structured', description: 'An agenda and clear goals each time.' },
          { value: 'casual', label: 'Casual', description: 'Open, free-flowing chats.' },
          { value: 'hands-on', label: 'Hands-on', description: 'Working on real projects together.' },
        ],
      },
      {
        id: 'timezone',
        type: 'text',
        label: 'Timezone or location',
        hint: 'Optional. Helps us find someone you can actually schedule with.',
        placeholder: 'e.g. Eastern Time, London',
      },
    ],
  },
]
