# Frontend: Futuristic Features + Code Quality — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four "wow factor" features to the Algonex frontend — Live Outcomes Ticker, Alumni Wall + Projects Gallery, Skill Assessment Quiz, and Animated Course Roadmap — plus fix code quality gaps (unused deps, error boundaries).

**Architecture:** All new components use the existing patterns: Ant Design components, inline styles with theme tokens from `src/theme/theme.js`, API clients in `src/api/`, Axios via `src/api/client.js`. New routes added to `src/App.jsx`. Two features (Quiz + Roadmap) are pure frontend with zero backend dependency. Two features (Ticker + Alumni) fetch from new APIs but gracefully fall back to mock data when the backend isn't ready.

**Tech Stack:** React 19, Vite 7, Ant Design 5, Tailwind CSS 4, Axios, react-slick

**Spec reference:** `docs/superpowers/specs/2026-04-05-futuristic-website-features-design.md`

**IMPORTANT:** This plan touches ONLY `algonex-frontend/`. It does NOT touch `algonex-backend/` or any DevOps files — a separate plan handles backend work in parallel.

---

## Chunk 1: Code Quality Fixes

### Task 1: Remove Unused Dependencies

**Files:**
- Modify: `algonex-frontend/package.json`

- [ ] **Step 1: Remove unused packages**

```bash
cd algonex-frontend && npm uninstall lucide-react react-icons sass-embedded
```

These packages are installed but never imported anywhere in the project:
- `lucide-react` — Ant Design icons are used instead
- `react-icons` — same reason
- `sass-embedded` — no `.scss` files exist in the project

- [ ] **Step 2: Verify the build still works**

```bash
cd algonex-frontend && npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
cd algonex-frontend && git add package.json package-lock.json
git commit -m "chore(frontend): remove unused dependencies (lucide-react, react-icons, sass-embedded)"
```

---

### Task 2: Add Error Boundary

**Files:**
- Create: `algonex-frontend/src/components/common/ErrorBoundary.jsx`
- Modify: `algonex-frontend/src/App.jsx`

- [ ] **Step 1: Create ErrorBoundary component**

Write `algonex-frontend/src/components/common/ErrorBoundary.jsx`:

```jsx
import { Component } from "react";
import { Button, Result } from "antd";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle="An unexpected error occurred. Please try refreshing the page."
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Wrap Routes in ErrorBoundary in App.jsx**

In `algonex-frontend/src/App.jsx`, add the import:

```jsx
import { ErrorBoundary } from './components/common/ErrorBoundary';
```

Then wrap the `<Routes>` block:

```jsx
<ErrorBoundary>
  <Routes>
    {/* ... all existing routes ... */}
  </Routes>
</ErrorBoundary>
```

- [ ] **Step 3: Verify build**

```bash
cd algonex-frontend && npm run build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd algonex-frontend && git add src/components/common/ErrorBoundary.jsx src/App.jsx
git commit -m "feat(frontend): add ErrorBoundary component to catch React rendering errors"
```

---

## Chunk 2: Skill Assessment Quiz (Pure Frontend)

### Task 3: Quiz Configuration

**Files:**
- Create: `algonex-frontend/src/constants/quizConfig.js`

- [ ] **Step 1: Create quiz config with questions and scoring matrix**

Write `algonex-frontend/src/constants/quizConfig.js`:

```javascript
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
    fresher:      { "python-full-stack": 3, "mern-stack": 2, "data-analyst": 2, "java-full-stack": 1 },
    professional: { "python-full-stack": 2, "mern-stack": 2, "data-analyst": 3, "java-full-stack": 3 },
    switcher:     { "python-full-stack": 3, "mern-stack": 3, "data-analyst": 2, "java-full-stack": 1 },
    student:      { "python-full-stack": 3, "mern-stack": 3, "data-analyst": 2, "java-full-stack": 2 },
  },
  experience: {
    none:        { "python-full-stack": 3, "mern-stack": 2, "data-analyst": 3, "java-full-stack": 1 },
    basics:      { "python-full-stack": 3, "mern-stack": 3, "data-analyst": 2, "java-full-stack": 2 },
    comfortable: { "python-full-stack": 2, "mern-stack": 3, "data-analyst": 2, "java-full-stack": 3 },
    advanced:    { "python-full-stack": 1, "mern-stack": 2, "data-analyst": 3, "java-full-stack": 3 },
  },
  interest: {
    web:        { "python-full-stack": 3, "mern-stack": 3, "data-analyst": 0, "java-full-stack": 2 },
    data:       { "python-full-stack": 1, "mern-stack": 0, "data-analyst": 3, "java-full-stack": 1 },
    enterprise: { "python-full-stack": 1, "mern-stack": 0, "data-analyst": 1, "java-full-stack": 3 },
    unsure:     { "python-full-stack": 2, "mern-stack": 2, "data-analyst": 2, "java-full-stack": 2 },
  },
  goal: {
    first_job: { "python-full-stack": 3, "mern-stack": 3, "data-analyst": 2, "java-full-stack": 2 },
    upskill:   { "python-full-stack": 2, "mern-stack": 2, "data-analyst": 3, "java-full-stack": 3 },
    switch:    { "python-full-stack": 3, "mern-stack": 2, "data-analyst": 2, "java-full-stack": 1 },
    freelance: { "python-full-stack": 2, "mern-stack": 3, "data-analyst": 2, "java-full-stack": 1 },
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
  "java-full-stack": {
    name: "Java Full Stack Development",
    tagline: "Enterprise-grade development skills",
    duration: "14 weeks",
    price: 29999,
    highlights: ["Spring Boot", "Microservices", "Angular/React"],
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
```

- [ ] **Step 2: Commit**

```bash
cd algonex-frontend && git add src/constants/quizConfig.js
git commit -m "feat(quiz): add quiz questions, scoring matrix, and result calculator"
```

---

### Task 4: Quiz Component

**Files:**
- Create: `algonex-frontend/src/components/quiz/SkillQuiz.jsx`

- [ ] **Step 1: Write the quiz component**

Write `algonex-frontend/src/components/quiz/SkillQuiz.jsx`:

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Progress, Tag, Row, Col } from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { QUIZ_QUESTIONS, COURSE_META, calculateResult } from "../../constants/quizConfig";

function QuizStep({ question, selectedKey, onSelect }) {
  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 8, textAlign: "center" }}>
        {question.title}
      </h2>
      <p style={{ color: "#666", fontSize: 16, textAlign: "center", marginBottom: 32 }}>
        {question.subtitle}
      </p>
      <Row gutter={[16, 16]} justify="center">
        {question.options.map((opt) => {
          const isSelected = selectedKey === opt.key;
          return (
            <Col key={opt.key} xs={24} sm={12}>
              <div
                onClick={() => onSelect(opt.key)}
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: isSelected ? "2px solid #00B4D8" : "2px solid #e8e8e8",
                  background: isSelected ? "#EBFBFF" : "white",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  height: "100%",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "#00B4D8";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "#e8e8e8";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    border: isSelected ? "2px solid #00B4D8" : "2px solid #ccc",
                    background: isSelected ? "#00B4D8" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {isSelected && <CheckCircleOutlined style={{ color: "white", fontSize: 14 }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#2c3e50" }}>{opt.label}</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{opt.description}</div>
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

function QuizResult({ slug, score }) {
  const navigate = useNavigate();
  const meta = COURSE_META[slug];
  if (!meta) return null;

  const maxPossible = QUIZ_QUESTIONS.length * 3;
  const matchPercent = Math.round((score / maxPossible) * 100);

  return (
    <div style={{ textAlign: "center", animation: "scaleIn 0.4s ease" }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%", background: "#EBFBFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
      }}>
        <TrophyOutlined style={{ fontSize: 36, color: "#00B4D8" }} />
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 8 }}>
        Your Perfect Course
      </h2>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Based on your answers, we recommend:
      </p>

      <div style={{
        maxWidth: 480, margin: "0 auto", padding: 32, borderRadius: 20,
        border: "2px solid #00B4D8", background: "#EBFBFF",
      }}>
        <Tag color="cyan" style={{ marginBottom: 12, fontSize: 13 }}>{matchPercent}% match</Tag>
        <h3 style={{ fontSize: 24, fontWeight: 700, color: "#2c3e50", marginBottom: 4 }}>
          {meta.name}
        </h3>
        <p style={{ color: "#666", marginBottom: 16 }}>{meta.tagline}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ color: "#888" }}>{meta.duration}</span>
          <span style={{ color: "#888" }}>{"\u20b9"}{meta.price.toLocaleString("en-IN")}</span>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
          {meta.highlights.map((h) => (
            <Tag key={h} style={{ background: "rgba(0,180,216,0.1)", border: "1px solid rgba(0,180,216,0.3)", color: "#0891b2" }}>
              {h}
            </Tag>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Button type="primary" size="large" onClick={() => navigate(`/courses/${slug}`)}>
            View Course Details <ArrowRightOutlined />
          </Button>
          <Button size="large" onClick={() => navigate("/allcourses")}>
            See All Courses
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SkillQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const totalSteps = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[currentStep];

  const handleSelect = (key) => {
    setAnswers((prev) => ({ ...prev, [question.id]: key }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setResult(calculateResult(answers));
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
  };

  if (result) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", padding: "48px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
          <QuizResult slug={result.slug} score={result.score} />
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Button type="link" onClick={handleRestart}>Retake Quiz</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", padding: "48px 24px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", width: "100%" }}>
        <Progress
          percent={((currentStep + 1) / totalSteps) * 100}
          showInfo={false}
          strokeColor="#00B4D8"
          style={{ marginBottom: 8 }}
        />
        <div style={{ textAlign: "center", color: "#999", fontSize: 13, marginBottom: 32 }}>
          Step {currentStep + 1} of {totalSteps}
        </div>

        <QuizStep
          question={question}
          selectedKey={answers[question.id]}
          onSelect={handleSelect}
        />

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          <Button
            onClick={handleBack}
            disabled={currentStep === 0}
            icon={<ArrowLeftOutlined />}
          >
            Back
          </Button>
          <Button
            type="primary"
            onClick={handleNext}
            disabled={!answers[question.id]}
          >
            {currentStep < totalSteps - 1 ? "Next" : "See My Result"} <ArrowRightOutlined />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CSS animations to index.css**

Append to `algonex-frontend/src/index.css`:

```css
/* Quiz animations */
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 3: Add route in App.jsx**

In `algonex-frontend/src/App.jsx`:

Add import:
```jsx
import SkillQuiz from './components/quiz/SkillQuiz';
```

Add route after the `/register` route (inside the `{/* Public */}` section):
```jsx
<Route path="/quiz" element={<SkillQuiz />} />
```

- [ ] **Step 4: Verify build**

```bash
cd algonex-frontend && npm run build
```
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
cd algonex-frontend && git add src/components/quiz/ src/constants/quizConfig.js src/App.jsx src/index.css
git commit -m "feat(quiz): add skill assessment quiz with scoring engine and result screen"
```

---

## Chunk 3: Animated Course Roadmap (Pure Frontend)

### Task 5: CourseRoadmap Component

**Files:**
- Create: `algonex-frontend/src/components/courses/CourseRoadmap.jsx`
- Modify: `algonex-frontend/src/pages/courses/CourseDetailPage.jsx`

- [ ] **Step 1: Write the roadmap component**

Write `algonex-frontend/src/components/courses/CourseRoadmap.jsx`:

```jsx
import { useState } from "react";
import { Tag } from "antd";
import {
  CheckCircleOutlined,
  BookOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";

const MILESTONES = {
  2: "First Project",
  4: "Portfolio Ready",
};

function RoadmapNode({ module, index, total, isExpanded, onToggle }) {
  const isLeft = index % 2 === 0;
  const milestone = MILESTONES[index + 1];
  const topicCount = module.topics?.length || 0;

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: isLeft ? "flex-start" : "flex-end",
      position: "relative",
      paddingBottom: index < total - 1 ? 32 : 0,
    }}>
      {/* Connecting line */}
      {index < total - 1 && (
        <div style={{
          position: "absolute",
          left: "50%",
          top: 40,
          bottom: 0,
          width: 2,
          background: "linear-gradient(180deg, #00B4D8 0%, rgba(0,180,216,0.2) 100%)",
          transform: "translateX(-50%)",
          zIndex: 0,
        }} />
      )}

      {/* Node content */}
      <div style={{
        width: "48%",
        marginLeft: isLeft ? "2%" : "50%",
        position: "relative",
        zIndex: 1,
      }}
        className="roadmap-node-responsive"
      >
        {/* Number badge */}
        <div style={{
          position: "absolute",
          left: isLeft ? "auto" : -24,
          right: isLeft ? -24 : "auto",
          top: 8,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #00B4D8, #0891b2)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 18,
          boxShadow: "0 4px 12px rgba(0,180,216,0.3)",
          zIndex: 2,
        }}
          className="roadmap-badge-responsive"
        >
          {index + 1}
        </div>

        {/* Card */}
        <div
          onClick={onToggle}
          style={{
            background: "white",
            borderRadius: 16,
            border: isExpanded ? "2px solid #00B4D8" : "1px solid #e8e8e8",
            padding: 20,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: isExpanded ? "0 4px 16px rgba(0,180,216,0.1)" : "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#2c3e50", margin: 0 }}>
              {module.title}
            </h4>
            {isExpanded ? <UpOutlined style={{ color: "#999" }} /> : <DownOutlined style={{ color: "#999" }} />}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, color: "#888", fontSize: 13 }}>
            <span><BookOutlined /> {topicCount} topic{topicCount !== 1 ? "s" : ""}</span>
          </div>

          {milestone && (
            <Tag color="gold" style={{ marginTop: 8 }}>
              <CheckCircleOutlined /> {milestone}
            </Tag>
          )}

          {/* Expandable topics */}
          <div style={{
            maxHeight: isExpanded ? 500 : 0,
            overflow: "hidden",
            transition: "max-height 0.3s ease",
            marginTop: isExpanded ? 16 : 0,
          }}>
            {module.description && (
              <p style={{ color: "#666", fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                {module.description}
              </p>
            )}
            {module.topics?.map((topic, i) => (
              <div key={topic.id || i} style={{
                padding: "8px 0",
                borderTop: i === 0 ? "1px solid #f0f0f0" : "none",
                borderBottom: "1px solid #f0f0f0",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <CheckCircleOutlined style={{ color: "#00B4D8", fontSize: 12 }} />
                <span style={{ color: "#555", fontSize: 13 }}>{topic.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseRoadmap({ modules = [] }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (modules.length === 0) return null;

  const totalTopics = modules.reduce((sum, m) => sum + (m.topics?.length || 0), 0);

  return (
    <div>
      {/* Summary bar */}
      <div style={{
        display: "flex", gap: 24, flexWrap: "wrap",
        padding: "16px 24px", borderRadius: 12,
        background: "#EBFBFF", marginBottom: 32,
        justifyContent: "center",
      }}>
        <span style={{ color: "#0891b2", fontWeight: 600 }}>
          {modules.length} module{modules.length !== 1 ? "s" : ""}
        </span>
        <span style={{ color: "#888" }}>|</span>
        <span style={{ color: "#0891b2", fontWeight: 600 }}>
          {totalTopics}+ topics
        </span>
      </div>

      {/* Roadmap nodes */}
      <div style={{ position: "relative", padding: "0 24px" }} className="roadmap-container">
        {modules.map((module, index) => (
          <RoadmapNode
            key={module.id || index}
            module={module}
            index={index}
            total={modules.length}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add responsive CSS for roadmap**

Append to `algonex-frontend/src/index.css`:

```css
/* Roadmap responsive: single column on mobile */
@media (max-width: 768px) {
  .roadmap-node-responsive {
    width: 90% !important;
    margin-left: 10% !important;
  }
  .roadmap-badge-responsive {
    left: -36px !important;
    right: auto !important;
  }
}
```

- [ ] **Step 3: Integrate into CourseDetailPage**

In `algonex-frontend/src/pages/courses/CourseDetailPage.jsx`:

Add import near the top:
```jsx
import CourseRoadmap from "../../components/courses/CourseRoadmap";
```

Find the existing modules `<Collapse>` section (search for "Curriculum" or "Module"). **Replace** the `<Collapse>` with the roadmap:

```jsx
{course.modules && course.modules.length > 0 && (
  <div style={{ marginTop: 48 }}>
    <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 24, textAlign: "center" }}>
      Your Learning Path
    </h2>
    <CourseRoadmap modules={course.modules} />
  </div>
)}
```

**Note:** Read the existing CourseDetailPage first to find the exact location. The roadmap replaces the static Collapse list of modules. Keep everything else (testimonials, FAQs, enrollment button) intact.

- [ ] **Step 4: Verify build**

```bash
cd algonex-frontend && npm run build
```
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
cd algonex-frontend && git add src/components/courses/CourseRoadmap.jsx src/pages/courses/CourseDetailPage.jsx src/index.css
git commit -m "feat(courses): add animated course roadmap with zig-zag layout and expandable modules"
```

---

## Chunk 4: Live Outcomes Ticker

### Task 6: Outcomes API Client + Ticker Component

**Files:**
- Create: `algonex-frontend/src/api/outcomes.js`
- Create: `algonex-frontend/src/components/OutcomesTicker.jsx`
- Modify: `algonex-frontend/src/components/Pages/Home.jsx`

- [ ] **Step 1: Create API client**

Write `algonex-frontend/src/api/outcomes.js`:

```javascript
import apiClient from "./client";

export const outcomesAPI = {
  list: (params) => apiClient.get("/outcomes/", { params }),
};
```

- [ ] **Step 2: Write the ticker component with mock data fallback**

Write `algonex-frontend/src/components/OutcomesTicker.jsx`:

```jsx
import { useState, useEffect } from "react";
import { Modal, Spin } from "antd";
import { outcomesAPI } from "../api/outcomes";

const MOCK_OUTCOMES = [
  { id: 1, student_name: "Rahul S.", achievement_type: "placed", company_name: "Infosys", role: "Full Stack Developer", package_range: "6-8 LPA", course: { name: "Python Full Stack", slug: "python-full-stack" }, achieved_at: "2026-04-08" },
  { id: 2, student_name: "Priya M.", achievement_type: "placed", company_name: "TCS", role: "Backend Developer", package_range: "6-8 LPA", course: { name: "Python Full Stack", slug: "python-full-stack" }, achieved_at: "2026-04-06" },
  { id: 3, student_name: "Vikram D.", achievement_type: "promoted", company_name: "Accenture", role: "Senior React Developer", package_range: "10-12 LPA", course: { name: "MERN Stack", slug: "mern-stack" }, achieved_at: "2026-04-04" },
  { id: 4, student_name: "Sneha R.", achievement_type: "placed", company_name: "Deloitte", role: "Data Analyst", package_range: "8-10 LPA", course: { name: "Data Analyst", slug: "data-analyst" }, achieved_at: "2026-04-09" },
  { id: 5, student_name: "Arjun P.", achievement_type: "placed", company_name: "Amazon", role: "Business Analyst", package_range: "12-15 LPA", course: { name: "Data Analyst", slug: "data-analyst" }, achieved_at: "2026-04-01" },
  { id: 6, student_name: "Divya L.", achievement_type: "freelancing", company_name: "", role: "Python Freelancer", package_range: "", course: { name: "Python Full Stack", slug: "python-full-stack" }, achieved_at: "2026-04-10" },
  { id: 7, student_name: "Meera T.", achievement_type: "placed", company_name: "Freshworks", role: "Backend Engineer", package_range: "8-10 LPA", course: { name: "Python Full Stack", slug: "python-full-stack" }, achieved_at: "2026-04-05" },
  { id: 8, student_name: "Sanjay V.", achievement_type: "placed", company_name: "Flipkart", role: "Frontend Engineer", package_range: "10-12 LPA", course: { name: "MERN Stack", slug: "mern-stack" }, achieved_at: "2026-04-03" },
];

const ACHIEVEMENT_LABELS = {
  placed: "placed at",
  promoted: "promoted at",
  freelancing: "started freelancing as",
  project_launched: "launched a project as",
};

function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

function TickerItem({ outcome, onClick }) {
  const label = ACHIEVEMENT_LABELS[outcome.achievement_type] || "achieved at";
  const detail = outcome.company_name || outcome.role;

  return (
    <span
      onClick={() => onClick(outcome)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 20px",
        whiteSpace: "nowrap",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      <span style={{ color: "white", fontWeight: 600 }}>{outcome.student_name}</span>
      <span style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
      {detail && <span style={{ color: "#00B4D8", fontWeight: 600 }}>{detail}</span>}
      {outcome.role && outcome.company_name && (
        <span style={{ color: "rgba(255,255,255,0.6)" }}>as {outcome.role}</span>
      )}
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
        — {relativeTime(outcome.achieved_at)}
      </span>
      <span style={{ color: "rgba(255,255,255,0.15)", padding: "0 8px" }}>|</span>
    </span>
  );
}

export default function OutcomesTicker() {
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    outcomesAPI.list({ page_size: 20 })
      .then((res) => {
        const results = res.data?.data?.results || res.data?.results || [];
        setOutcomes(results.length > 0 ? results : MOCK_OUTCOMES);
      })
      .catch(() => setOutcomes(MOCK_OUTCOMES))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ background: "#0a1628", padding: "12px 0", textAlign: "center" }}>
        <Spin size="small" />
      </div>
    );
  }

  if (outcomes.length === 0) return null;

  // Duplicate items to create seamless loop
  const tickerItems = [...outcomes, ...outcomes];
  const animDuration = outcomes.length * 4;

  return (
    <>
      {/* Desktop: horizontal scroll */}
      <div className="ticker-horizontal" style={{
        background: "#0a1628",
        borderBottom: "2px solid rgba(0,180,216,0.3)",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          display: "inline-flex",
          animation: `tickerScroll ${animDuration}s linear infinite`,
          whiteSpace: "nowrap",
        }}>
          {tickerItems.map((o, i) => (
            <TickerItem key={`${o.id}-${i}`} outcome={o} onClick={setSelected} />
          ))}
        </div>
      </div>

      {/* Mobile: vertical mini-feed (3 items) */}
      <div className="ticker-mobile" style={{
        background: "#0a1628",
        borderBottom: "2px solid rgba(0,180,216,0.3)",
        padding: "12px 16px",
        display: "none",
      }}>
        {outcomes.slice(0, 3).map((o) => {
          const label = ACHIEVEMENT_LABELS[o.achievement_type] || "achieved at";
          return (
            <div key={o.id} onClick={() => setSelected(o)} style={{
              padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.7)",
            }}>
              <span style={{ color: "white", fontWeight: 600 }}>{o.student_name}</span>{" "}
              {label} <span style={{ color: "#00B4D8", fontWeight: 600 }}>{o.company_name || o.role}</span>{" "}
              <span style={{ color: "rgba(255,255,255,0.4)" }}>— {relativeTime(o.achieved_at)}</span>
            </div>
          );
        })}
      </div>

      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        centered
        width={400}
      >
        {selected && (
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "#EBFBFF",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 24, fontWeight: 700, color: "#00B4D8",
            }}>
              {selected.student_name.charAt(0)}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{selected.student_name}</h3>
            {selected.role && <p style={{ color: "#666", marginBottom: 4 }}>{selected.role}</p>}
            {selected.company_name && (
              <p style={{ color: "#00B4D8", fontWeight: 600, marginBottom: 8 }}>{selected.company_name}</p>
            )}
            {selected.package_range && (
              <p style={{ color: "#888", marginBottom: 8 }}>{selected.package_range}</p>
            )}
            <p style={{ color: "#888", fontSize: 13 }}>
              {selected.course?.name} — {relativeTime(selected.achieved_at)}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
```

- [ ] **Step 3: Add ticker CSS animation**

Append to `algonex-frontend/src/index.css`:

```css
/* Outcomes ticker */
@keyframes tickerScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
/* Mobile: vertical mini-feed instead of horizontal scroll */
@media (max-width: 768px) {
  .ticker-horizontal { display: none !important; }
  .ticker-mobile { display: block !important; }
}
@media (min-width: 769px) {
  .ticker-mobile { display: none !important; }
}
```

- [ ] **Step 4: Add ticker to Home.jsx — right after the Hero carousel**

In `algonex-frontend/src/components/Pages/Home.jsx`:

Add import:
```jsx
import OutcomesTicker from "../OutcomesTicker";
```

Insert the ticker component right after the hero carousel closing `</div>` (line ~605 — after the ArrowButton components) and before the "Trending Courses" section:

```jsx
      {/* Outcomes Ticker */}
      <OutcomesTicker />

      {/* Trending Courses */}
```

- [ ] **Step 5: Verify build**

```bash
cd algonex-frontend && npm run build
```
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
cd algonex-frontend && git add src/api/outcomes.js src/components/OutcomesTicker.jsx src/components/Pages/Home.jsx src/index.css
git commit -m "feat(home): add live outcomes ticker with API integration and mock data fallback"
```

---

## Chunk 5: Alumni Wall + Student Projects Gallery

### Task 7: Alumni/Projects API Clients

**Files:**
- Create: `algonex-frontend/src/api/alumni.js`

- [ ] **Step 1: Create API client**

Write `algonex-frontend/src/api/alumni.js`:

```javascript
import apiClient from "./client";

export const alumniAPI = {
  list: (params) => apiClient.get("/alumni/", { params }),
  featured: () => apiClient.get("/alumni/featured/"),
};

export const projectsAPI = {
  list: (params) => apiClient.get("/projects/", { params }),
  featured: () => apiClient.get("/projects/featured/"),
  detail: (slug) => apiClient.get(`/projects/${slug}/`),
};
```

- [ ] **Step 2: Commit**

```bash
cd algonex-frontend && git add src/api/alumni.js
git commit -m "feat(alumni): add API clients for alumni and student projects"
```

---

### Task 8: Alumni Page

**Files:**
- Create: `algonex-frontend/src/pages/alumni/AlumniPage.jsx`
- Modify: `algonex-frontend/src/App.jsx`

- [ ] **Step 1: Create the alumni page directory**

```bash
mkdir -p algonex-frontend/src/pages/alumni
```

- [ ] **Step 2: Write the alumni page with both sections**

Write `algonex-frontend/src/pages/alumni/AlumniPage.jsx`:

```jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Row, Col, Input, Select, Tag, Modal, Button, Spin, Empty, Segmented } from "antd";
import {
  SearchOutlined,
  LinkedinOutlined,
  ArrowRightOutlined,
  GithubOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { alumniAPI, projectsAPI } from "../../api/alumni";

// --- Mock data for when backend APIs aren't ready ---
const MOCK_ALUMNI = [
  { id: 1, name: "Priya M.", avatar: "", course: { name: "Python Full Stack", slug: "python-full-stack" }, batch_year: 2025, current_company: "TCS", current_role: "Backend Developer", linkedin_url: "", short_quote: "Algonex gave me the skills to land my dream job.", package_range: "6-8 LPA" },
  { id: 2, name: "Rahul S.", avatar: "", course: { name: "Python Full Stack", slug: "python-full-stack" }, batch_year: 2025, current_company: "Infosys", current_role: "Full Stack Developer", linkedin_url: "", short_quote: "The hands-on projects made all the difference.", package_range: "5-7 LPA" },
  { id: 3, name: "Ananya K.", avatar: "", course: { name: "MERN Stack", slug: "mern-stack" }, batch_year: 2025, current_company: "Wipro", current_role: "Frontend Developer", linkedin_url: "", short_quote: "I went from zero coding to employed in 4 months.", package_range: "5-6 LPA" },
  { id: 4, name: "Sneha R.", avatar: "", course: { name: "Data Analyst", slug: "data-analyst" }, batch_year: 2025, current_company: "Deloitte", current_role: "Data Analyst", linkedin_url: "", short_quote: "The analytics curriculum is world-class.", package_range: "8-10 LPA" },
  { id: 5, name: "Arjun P.", avatar: "", course: { name: "Data Analyst", slug: "data-analyst" }, batch_year: 2024, current_company: "Amazon", current_role: "Business Analyst", linkedin_url: "", short_quote: "Algonex helped me transition from ops to analytics.", package_range: "12-15 LPA" },
  { id: 6, name: "Sanjay V.", avatar: "", course: { name: "MERN Stack", slug: "mern-stack" }, batch_year: 2024, current_company: "Flipkart", current_role: "Frontend Engineer", linkedin_url: "", short_quote: "The MERN curriculum is spot-on for the industry.", package_range: "10-12 LPA" },
];

const MOCK_PROJECTS = [
  { id: 1, title: "ShopEasy E-Commerce", slug: "shopeasy-e-commerce", thumbnail: "", student_name: "Rahul S.", course: { name: "Python Full Stack", slug: "python-full-stack" }, batch_year: 2025, tech_tags: [{ id: 1, name: "Python" }, { id: 2, name: "Django" }, { id: 3, name: "React" }], is_featured: true, description: "A full-stack e-commerce platform with cart, checkout, and admin dashboard.", demo_url: "", github_url: "" },
  { id: 2, title: "TaskFlow Project Manager", slug: "taskflow-project-manager", thumbnail: "", student_name: "Ananya K.", course: { name: "MERN Stack", slug: "mern-stack" }, batch_year: 2025, tech_tags: [{ id: 3, name: "React" }, { id: 4, name: "Node.js" }, { id: 5, name: "MongoDB" }], is_featured: true, description: "Real-time project management tool with Kanban boards and team chat.", demo_url: "", github_url: "" },
  { id: 3, title: "Sales Analytics Dashboard", slug: "sales-analytics-dashboard", thumbnail: "", student_name: "Sneha R.", course: { name: "Data Analyst", slug: "data-analyst" }, batch_year: 2025, tech_tags: [{ id: 1, name: "Python" }, { id: 6, name: "Pandas" }], is_featured: true, description: "Interactive dashboard for sales data visualization with predictive analytics.", demo_url: "", github_url: "" },
];

function AlumniCard({ alumni, onClick }) {
  const initials = alumni.name.split(" ").map((n) => n[0]).join("");
  return (
    <div
      onClick={() => onClick(alumni)}
      style={{
        background: "white", borderRadius: 16, border: "1px solid #e8e8e8",
        padding: 24, cursor: "pointer", transition: "all 0.2s", height: "100%",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00B4D8"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,180,216,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e8e8"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "#EBFBFF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 700, color: "#00B4D8", flexShrink: 0,
        }}>
          {alumni.avatar ? <img src={alumni.avatar} alt={alumni.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : initials}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, color: "#2c3e50" }}>{alumni.name}</div>
          <div style={{ color: "#888", fontSize: 13 }}>{alumni.current_role}</div>
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#00B4D8", marginBottom: 8 }}>
        {alumni.current_company}
      </div>
      {alumni.package_range && (
        <Tag color="green" style={{ marginBottom: 8 }}>{alumni.package_range}</Tag>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tag>{alumni.course?.name}</Tag>
        <Tag>Batch {alumni.batch_year}</Tag>
      </div>
      {alumni.short_quote && (
        <p style={{ color: "#888", fontSize: 13, fontStyle: "italic", marginTop: 12, lineHeight: 1.5 }}>
          "{alumni.short_quote}"
        </p>
      )}
    </div>
  );
}

function ProjectCard({ project }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/alumni/projects/${project.slug}`)}
      style={{
        background: "white", borderRadius: 16, border: "1px solid #e8e8e8",
        overflow: "hidden", cursor: "pointer", transition: "all 0.2s", height: "100%",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00B4D8"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,180,216,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e8e8"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{
        height: 160, background: "#f0f0f0",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#ccc", fontSize: 48,
      }}>
        {project.thumbnail ? <img src={project.thumbnail} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "\u{1F4BB}"}
      </div>
      <div style={{ padding: 20 }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, color: "#2c3e50", marginBottom: 8 }}>{project.title}</h4>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>by {project.student_name}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {project.tech_tags?.slice(0, 4).map((t) => (
            <Tag key={t.id} style={{ background: "rgba(0,180,216,0.1)", border: "1px solid rgba(0,180,216,0.2)", color: "#0891b2" }}>{t.name}</Tag>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Tag>{project.course?.name}</Tag>
        </div>
      </div>
    </div>
  );
}

export default function AlumniPage() {
  const [tab, setTab] = useState("alumni");
  const [alumni, setAlumni] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      alumniAPI.list({ page_size: 50 }),
      projectsAPI.list({ page_size: 50 }),
    ]).then(([alumniRes, projectsRes]) => {
      const alumniData = alumniRes.status === "fulfilled"
        ? (alumniRes.value.data?.data?.results || alumniRes.value.data?.results || [])
        : [];
      const projectData = projectsRes.status === "fulfilled"
        ? (projectsRes.value.data?.data?.results || projectsRes.value.data?.results || [])
        : [];
      setAlumni(alumniData.length > 0 ? alumniData : MOCK_ALUMNI);
      setProjects(projectData.length > 0 ? projectData : MOCK_PROJECTS);
    }).finally(() => setLoading(false));
  }, []);

  const filteredAlumni = alumni.filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.current_company.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjects = projects.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.student_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#f8fafc", minHeight: "80vh" }}>
      {/* Header */}
      <section style={{
        background: "linear-gradient(135deg, #0c1222 0%, #0a2540 50%, #0e3a5e 100%)",
        padding: "64px 24px", textAlign: "center",
      }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, color: "white", marginBottom: 8 }}>
          Our Community
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
          Meet the alumni who transformed their careers and the projects they built
        </p>
      </section>

      {/* Controls */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { label: `Alumni (${alumni.length})`, value: "alumni" },
              { label: `Projects (${projects.length})`, value: "projects" },
            ]}
            size="large"
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder={tab === "alumni" ? "Search by name or company..." : "Search by title or student..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
            allowClear
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : tab === "alumni" ? (
          filteredAlumni.length === 0 ? (
            <Empty description="No alumni found" />
          ) : (
            <Row gutter={[24, 24]}>
              {filteredAlumni.map((a) => (
                <Col key={a.id} xs={24} sm={12} lg={8} xl={6}>
                  <AlumniCard alumni={a} onClick={setSelected} />
                </Col>
              ))}
            </Row>
          )
        ) : (
          filteredProjects.length === 0 ? (
            <Empty description="No projects found" />
          ) : (
            <Row gutter={[24, 24]}>
              {filteredProjects.map((p) => (
                <Col key={p.id} xs={24} sm={12} lg={8}>
                  <ProjectCard project={p} />
                </Col>
              ))}
            </Row>
          )
        )}
      </div>

      {/* Alumni detail modal */}
      <Modal open={!!selected} onCancel={() => setSelected(null)} footer={null} centered width={420}>
        {selected && (
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", background: "#EBFBFF",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 28, fontWeight: 700, color: "#00B4D8",
            }}>
              {selected.avatar ? <img src={selected.avatar} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : selected.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{selected.name}</h3>
            <p style={{ color: "#666", marginBottom: 4 }}>{selected.current_role}</p>
            <p style={{ color: "#00B4D8", fontWeight: 600, marginBottom: 8 }}>{selected.current_company}</p>
            {selected.package_range && <Tag color="green">{selected.package_range}</Tag>}
            {selected.short_quote && (
              <p style={{ color: "#888", fontStyle: "italic", marginTop: 16, lineHeight: 1.6 }}>
                "{selected.short_quote}"
              </p>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <Tag>{selected.course?.name}</Tag>
              <Tag>Batch {selected.batch_year}</Tag>
            </div>
            {selected.linkedin_url && (
              <Button type="link" icon={<LinkedinOutlined />} href={selected.linkedin_url} target="_blank" style={{ marginTop: 12 }}>
                LinkedIn Profile
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: Add route in App.jsx**

Add import:
```jsx
import AlumniPage from './pages/alumni/AlumniPage';
```

Add routes in the `{/* Public */}` section:
```jsx
<Route path="/alumni" element={<AlumniPage />} />
```

- [ ] **Step 4: Add "Alumni" link to Navbar**

In `algonex-frontend/src/components/Navbar.jsx`, find the nav items array and add an "Alumni" entry. Look for the existing items like "Courses", "Programs", etc. and add after "About":

```jsx
{ to: "/alumni", label: "Alumni" },
```

- [ ] **Step 5: Verify build**

```bash
cd algonex-frontend && npm run build
```
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
cd algonex-frontend && git add src/api/alumni.js src/pages/alumni/ src/App.jsx src/components/Navbar.jsx
git commit -m "feat(alumni): add alumni wall and student projects gallery with search and filters"
```

---

### Task 8b: Project Detail Page

**Files:**
- Create: `algonex-frontend/src/pages/alumni/ProjectDetailPage.jsx`
- Modify: `algonex-frontend/src/App.jsx`

- [ ] **Step 1: Write the project detail page**

Write `algonex-frontend/src/pages/alumni/ProjectDetailPage.jsx`:

```jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Tag, Button, Spin, Empty } from "antd";
import {
  ArrowLeftOutlined,
  GithubOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { projectsAPI } from "../../api/alumni";

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsAPI.detail(slug)
      .then((res) => {
        const data = res.data?.data || res.data;
        setProject(data);
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: 80 }}>
        <Empty description="Project not found">
          <Link to="/alumni">
            <Button type="primary">Back to Alumni</Button>
          </Link>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "80vh" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        <Link to="/alumni" style={{ color: "#00B4D8", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <ArrowLeftOutlined /> Back to Alumni
        </Link>

        {project.thumbnail && (
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 32 }}>
            <img src={project.thumbnail} alt={project.title} style={{ width: "100%", maxHeight: 400, objectFit: "cover" }} />
          </div>
        )}

        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#2c3e50", marginBottom: 8 }}>
          {project.title}
        </h1>
        <p style={{ color: "#888", fontSize: 16, marginBottom: 24 }}>
          by {project.student_name} — {project.course?.name}, Batch {project.batch_year}
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {project.tech_tags?.map((t) => (
            <Tag key={t.id} style={{ background: "rgba(0,180,216,0.1)", border: "1px solid rgba(0,180,216,0.2)", color: "#0891b2" }}>
              {t.name}
            </Tag>
          ))}
        </div>

        <div style={{
          background: "white", borderRadius: 16, border: "1px solid #e8e8e8",
          padding: 32, marginBottom: 32, lineHeight: 1.8, color: "#555",
        }}>
          {project.description}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {project.demo_url && (
            <Button type="primary" icon={<LinkOutlined />} href={project.demo_url} target="_blank" size="large">
              Live Demo
            </Button>
          )}
          {project.github_url && (
            <Button icon={<GithubOutlined />} href={project.github_url} target="_blank" size="large">
              View Code
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add route in App.jsx**

Add import:
```jsx
import ProjectDetailPage from './pages/alumni/ProjectDetailPage';
```

Add route after the `/alumni` route:
```jsx
<Route path="/alumni/projects/:slug" element={<ProjectDetailPage />} />
```

- [ ] **Step 3: Verify build**

```bash
cd algonex-frontend && npm run build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd algonex-frontend && git add src/pages/alumni/ProjectDetailPage.jsx src/App.jsx
git commit -m "feat(alumni): add project detail page with demo/github links"
```

---

## Chunk 6: Homepage Integration + Quiz CTA

### Task 9: Add Quiz CTA and Featured Alumni to Homepage

**Files:**
- Modify: `algonex-frontend/src/components/Pages/Home.jsx`

- [ ] **Step 1: Add quiz CTA section to Home.jsx**

In `algonex-frontend/src/components/Pages/Home.jsx`, add a quiz CTA section between the "Why Algonex" features section and the final CTA section.

Add the import at the top:
```jsx
import { Link } from "react-router-dom";
// (Link is likely already imported)
```

Insert this new section after the "Why Algonex" section closing `</section>` (around line 672) and before the final "Ready to Start" CTA:

```jsx
      {/* Quiz CTA */}
      <section style={{ padding: "64px 24px", background: "#EBFBFF" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50", marginBottom: 12 }}>
            Not sure which course is right for you?
          </h2>
          <p style={{ color: "#666", fontSize: 16, marginBottom: 28, lineHeight: 1.6 }}>
            Take our 60-second quiz and get a personalized recommendation based on your background,
            interests, and career goals.
          </p>
          <Link to="/quiz">
            <Button type="primary" size="large" style={{ height: 50, fontSize: 16, borderRadius: 8 }}>
              Find Your Perfect Course <ArrowRightOutlined />
            </Button>
          </Link>
        </div>
      </section>
```

- [ ] **Step 2: Verify build**

```bash
cd algonex-frontend && npm run build
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd algonex-frontend && git add src/components/Pages/Home.jsx
git commit -m "feat(home): add skill assessment quiz CTA section"
```

---

## Chunk 7: Final Verification

### Task 10: Full Build + Visual Check

- [ ] **Step 1: Clean install and build**

```bash
cd algonex-frontend && rm -rf node_modules && npm install && npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run linter**

```bash
cd algonex-frontend && npm run lint
```
Expected: No errors (warnings OK).

- [ ] **Step 3: Dev server smoke test**

```bash
cd algonex-frontend && npm run dev &
sleep 3
```

Verify these pages load without errors:
- `http://localhost:5173/` — Home page with ticker + quiz CTA
- `http://localhost:5173/quiz` — Quiz with 4 steps + result
- `http://localhost:5173/courses/python-full-stack` — Course detail with roadmap
- `http://localhost:5173/alumni` — Alumni wall + projects gallery

```bash
kill %1
```

- [ ] **Step 4: Check for any loose ends**

Review changed files for:
- No `console.log` statements left in
- No unused imports
- No hardcoded API URLs (should use apiClient)
- No missing error handling on API calls

- [ ] **Step 5: Final commit if any cleanup needed**

```bash
cd algonex-frontend && git status
# If clean, no commit needed. Otherwise:
git add -A && git commit -m "chore(frontend): final cleanup after futuristic features implementation"
```

---

## Summary of New Files Created

| File | Purpose |
|------|---------|
| `src/components/common/ErrorBoundary.jsx` | React error boundary |
| `src/constants/quizConfig.js` | Quiz questions, scoring, course metadata |
| `src/components/quiz/SkillQuiz.jsx` | 4-step skill assessment quiz |
| `src/components/courses/CourseRoadmap.jsx` | Animated zig-zag module roadmap |
| `src/api/outcomes.js` | Outcomes ticker API client |
| `src/components/OutcomesTicker.jsx` | Scrolling outcomes ticker |
| `src/api/alumni.js` | Alumni + projects API client |
| `src/pages/alumni/AlumniPage.jsx` | Alumni wall + projects gallery |
| `src/pages/alumni/ProjectDetailPage.jsx` | Student project detail with demo/github links |

## Files Modified

| File | Change |
|------|--------|
| `src/App.jsx` | Added ErrorBoundary, quiz + alumni routes |
| `src/index.css` | Added quiz + roadmap + ticker CSS animations |
| `src/components/Pages/Home.jsx` | Added OutcomesTicker + quiz CTA |
| `src/components/Navbar.jsx` | Added Alumni nav link |
| `src/pages/courses/CourseDetailPage.jsx` | Replaced module Collapse with CourseRoadmap |
| `package.json` | Removed unused deps |
