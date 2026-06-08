/**
 * Skill Assessment Quiz configuration.
 *
 * IMPORTANT: The scoring matrix keys MUST match actual Course.slug values
 * from the database. Verify by running:
 *   python3.11 manage.py seed_courses
 * Then check Course.objects.values_list('slug', flat=True)
 *
 * Current slugs: python-full-stack, mern-stack, data-analyst, java-full-stack
 */

export const QUIZ_QUESTIONS = [
  {
    id: "background",
    title: "What's your background?",
    subtitle: "This helps us understand where you're starting from",
    options: [
      { key: "fresher", label: "Fresher", description: "Just graduated or still studying" },
      { key: "professional", label: "Working Professional", description: "Currently employed in any field" },
      { key: "switcher", label: "Career Switcher", description: "Looking to move into tech" },
      { key: "student", label: "Student", description: "Currently pursuing a degree" },
    ],
  },
  {
    id: "experience",
    title: "How much coding experience do you have?",
    subtitle: "Be honest — there's no wrong answer",
    options: [
      { key: "none", label: "None", description: "Never written code before" },
      { key: "basics", label: "Some Basics", description: "Done a tutorial or two" },
      { key: "comfortable", label: "Comfortable", description: "Can build small projects" },
      { key: "advanced", label: "Advanced", description: "Built production apps" },
    ],
  },
  {
    id: "interest",
    title: "What excites you most?",
    subtitle: "Pick the area that sounds most interesting",
    options: [
      { key: "web", label: "Building Websites & Apps", description: "Frontend, backend, full-stack" },
      { key: "data", label: "Working with Data", description: "Analytics, dashboards, insights" },
      { key: "enterprise", label: "Enterprise Systems", description: "Large-scale, robust applications" },
      { key: "unsure", label: "Not Sure Yet", description: "I want to explore options" },
    ],
  },
  {
    id: "goal",
    title: "What's your primary goal?",
    subtitle: "What do you want to achieve in the next 6 months?",
    options: [
      { key: "first_job", label: "First Tech Job", description: "Land my first role in tech" },
      { key: "upskill", label: "Upskill for Promotion", description: "Level up in current career" },
      { key: "switch", label: "Switch to Tech", description: "Transition from another field" },
      { key: "freelance", label: "Freelance / Startup", description: "Work independently or build something" },
    ],
  },
];

/**
 * Scoring matrix: each answer adds points to course scores.
 * Higher total = better fit.
 */
export const SCORING = {
  background: {
    fresher: { "python-full-stack": 3, "mern-stack": 2, "data-analyst": 2 },
    professional: { "python-full-stack": 2, "mern-stack": 2, "data-analyst": 3 },
    switcher: { "python-full-stack": 3, "mern-stack": 3, "data-analyst": 2 },
    student: { "python-full-stack": 3, "mern-stack": 3, "data-analyst": 2 },
  },
  experience: {
    none: { "python-full-stack": 3, "mern-stack": 2, "data-analyst": 3 },
    basics: { "python-full-stack": 3, "mern-stack": 3, "data-analyst": 2 },
    comfortable: { "python-full-stack": 2, "mern-stack": 3, "data-analyst": 2 },
    advanced: { "python-full-stack": 1, "mern-stack": 2, "data-analyst": 3 },
  },
  interest: {
    web: { "python-full-stack": 3, "mern-stack": 3, "data-analyst": 0 },
    data: { "python-full-stack": 1, "mern-stack": 0, "data-analyst": 3 },
    enterprise: { "python-full-stack": 1, "mern-stack": 0, "data-analyst": 1 },
    unsure: { "python-full-stack": 2, "mern-stack": 2, "data-analyst": 2 },
  },
  goal: {
    first_job: { "python-full-stack": 3, "mern-stack": 3, "data-analyst": 2 },
    upskill: { "python-full-stack": 2, "mern-stack": 2, "data-analyst": 3 },
    switch: { "python-full-stack": 3, "mern-stack": 2, "data-analyst": 2 },
    freelance: { "python-full-stack": 2, "mern-stack": 3, "data-analyst": 2 },
  },
};

/**
 * Course metadata for the result screen.
 * Keys must match scoring matrix keys (and Course.slug in DB).
 */
export const COURSE_META = {
  "python-full-stack": {
    name: "Python Full Stack Development",
    tagline: "The most versatile path into tech",
    duration: "12 weeks",
    price: 24999,
    highlights: ["Django + React", "REST APIs", "Deployment"],
  },
  "mern-stack": {
    name: "MERN Stack Development",
    tagline: "Build modern web apps from scratch",
    duration: "10 weeks",
    price: 22999,
    highlights: ["MongoDB + Express", "React + Node.js", "Real-time apps"],
  },
  "data-analyst": {
    name: "Data Analyst",
    tagline: "Turn data into decisions",
    duration: "8 weeks",
    price: 19999,
    highlights: ["Python + Pandas", "SQL + Power BI", "Machine Learning basics"],
  },
};

/**
 * Calculate quiz result from user answers.
 * @param {Object} answers - { background: "fresher", experience: "none", ... }
 * @returns {{ slug: string, score: number }} - Recommended course slug and score
 */
export function calculateResult(answers) {
  const scores = {};

  for (const [questionId, answerKey] of Object.entries(answers)) {
    const questionScoring = SCORING[questionId];
    if (!questionScoring || !questionScoring[answerKey]) continue;

    for (const [courseSlug, points] of Object.entries(questionScoring[answerKey])) {
      scores[courseSlug] = (scores[courseSlug] || 0) + points;
    }
  }

  // Find highest-scoring course. Ties broken by order in COURSE_META.
  const courseOrder = Object.keys(COURSE_META);
  let bestSlug = courseOrder[0];
  let bestScore = 0;

  for (const slug of courseOrder) {
    if ((scores[slug] || 0) > bestScore) {
      bestScore = scores[slug] || 0;
      bestSlug = slug;
    }
  }

  return { slug: bestSlug, score: bestScore };
}
