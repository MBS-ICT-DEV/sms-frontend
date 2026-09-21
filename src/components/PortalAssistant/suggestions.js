/*
  Role-aware copy for the MBS Portal Assistant.

  These strings only shape the UI (greeting, placeholder, suggested prompts).
  They are NOT a security mechanism — the backend remains the authority on
  what a user is allowed to see or do.
*/

const GREETINGS = {
  developer: 'Hello. How can I help you with the school system today?',
  admin: 'Hello. Ask me about students, classes, attendance, or fees.',
  principal: 'Hello. Ask me about learners, teachers, classes, or results.',
  hoa: 'Hello. Ask me about attendance, classes, learners, or staff.',
  hr: 'Hello. Ask me about staff and teacher information.',
  secretary: 'Hello. Ask me about students, attendance, or fees.',
  teacher: 'Hello. Ask me about your classes, students, or assignments.',
  student: 'Hello. Ask me about your results, fees, or attendance.',
};

const PLACEHOLDERS = {
  developer: 'Ask about school statistics...',
  admin: 'Ask about students, attendance, fees...',
  principal: 'Ask about learners, teachers, results...',
  hoa: 'Ask about attendance, staff, classes...',
  hr: 'Ask about staff members...',
  secretary: 'Ask about students, attendance, fees...',
  teacher: 'Ask about your classes or students...',
  student: 'Ask about your results or fees...',
};

// Suggested prompts are grouped by portal role. Each entry is a short label
// plus the actual message that gets sent to the backend.
const SUGGESTIONS = {
  developer: [
    'Show me the current school statistics.',
    'How many students are in the school?',
    'Show me the available classes.',
  ],
  admin: [
    'How many students are currently in JSS 2?',
    "Show today's attendance.",
    'Show outstanding fees.',
  ],
  principal: [
    'Show me the current school statistics.',
    'How many students are in the school?',
    'Show the available classes.',
  ],
  hoa: [
    "Show today's attendance.",
    'Show the available classes.',
    'Show teacher information.',
  ],
  hr: ['Show teacher information.', 'Find a staff member.'],
  secretary: ['Find a student.', 'Show students in Primary 5.', "Show today's attendance."],
  teacher: [
    'Show my assigned classes.',
    "Show today's attendance.",
    'Show my students.',
    'Create an assignment.',
  ],
  student: [
    'Show my results.',
    'What are my outstanding fees?',
    'Show my attendance.',
    'Show my profile.',
  ],
};

const DEFAULT_ROLE = 'student';

export function getAssistantGreeting(role) {
  return GREETINGS[role] || GREETINGS[DEFAULT_ROLE];
}

export function getAssistantPlaceholder(role) {
  return PLACEHOLDERS[role] || PLACEHOLDERS[DEFAULT_ROLE];
}

export function getAssistantSuggestions(role) {
  return SUGGESTIONS[role] || SUGGESTIONS[DEFAULT_ROLE];
}
