# Futuristic Website Features — Design Spec

## Context

Algonex is a Bangalore-based tech training institute competing in a crowded market where most competitors have near-identical websites (hero banner, course cards, testimonials carousel, contact form). The goal is to add **website-level features** that:

1. **Wow prospective students** — stand out at first glance from every other training institute
2. **Demonstrate real outcomes** — prove that students actually get jobs and learn to build things

These features build on the existing React 19 + Vite + Ant Design frontend and Django 5 + DRF backend. The target audience is a broad mix: college students, working professionals, career switchers, and complete beginners.

---

## Feature 1: Live Outcomes Ticker

### Purpose
Replace static "95% placement rate" claims with a living, scrolling feed of real student achievements that creates urgency and credibility.

### Placement
- **Homepage**: Horizontal ticker bar below the hero section, above course cards
- **Course detail pages** (optional): Filtered to show outcomes from that specific course

### Backend

**New model** in `courses` app (alongside `Testimonial`, which serves a similar purpose):

```python
class StudentOutcome(TimestampMixin):
    class AchievementType(models.TextChoices):
        PLACED = "placed", "Placed"
        PROMOTED = "promoted", "Promoted"
        FREELANCING = "freelancing", "Freelancing"
        PROJECT_LAUNCHED = "project_launched", "Project Launched"

    student_name = models.CharField(max_length=100)  # "Rahul S." — first name + last initial
    achievement_type = models.CharField(max_length=30, choices=AchievementType.choices)
    company_name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=100, blank=True)
    package_range = models.CharField(max_length=50, blank=True)  # "6-8 LPA"
    course = models.ForeignKey("courses.Course", on_delete=models.CASCADE, related_name="outcomes")
    achieved_at = models.DateField()
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-achieved_at"]

    def __str__(self):
        return f"{self.student_name} - {self.get_achievement_type_display()} at {self.company_name}"
```

**Architecture:** Follow the existing 4-layer pattern — add `courses/selectors.py` functions for outcome queries (e.g., `get_published_outcomes(course_slug=None)`) and `courses/services.py` for write ops if needed. Views call selectors, not querysets directly.

**API endpoints:**
- `GET /api/v1/outcomes/` — list published outcomes (paginated, page_size=20, filterable by course slug)
- No auth required (public data)

**Response format** (follows existing envelope pattern):
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "id": 1,
        "student_name": "Rahul S.",
        "achievement_type": "placed",
        "company_name": "Infosys",
        "role": "Full Stack Developer",
        "package_range": "6-8 LPA",
        "course": { "name": "Python Full Stack", "slug": "python-full-stack" },
        "achieved_at": "2026-03-15"
      }
    ],
    "count": 42, "page": 1, "page_size": 20, "total_pages": 3
  }
}
```

### Frontend

- **Infinite horizontal scroll** using CSS animation (`translateX` keyframes) — no JS scroll needed
- Each ticker item: small avatar placeholder + text: *"Rahul S. placed at Infosys as Full Stack Developer — 3 days ago"*
- Relative time display using simple date math (no library needed)
- Click item → opens a small Ant Design `Modal` with fuller details
- **Responsive**: On mobile (< 768px), switches to a vertically scrolling mini-feed (2-3 visible items)
- **Fallback**: If API returns empty, show existing testimonials data from `constants/constant.js`
- **Styling**: Dark background strip (`#0a1628`), cyan accent border-bottom, white text, company names in `#00B4D8`

**Frontend states:**
- **Loading**: Skeleton pulse animation (thin horizontal bar)
- **Empty/Error**: Falls back to existing testimonials from `constants/constant.js`

### Key files to modify
- New: `algonex-frontend/src/components/OutcomesTicker.jsx`
- Modified: `algonex-frontend/src/components/Pages/Home.jsx` (add ticker below hero)
- New: `algonex-frontend/src/api/outcomes.js`
- Modified: `algonex-backend/courses/models.py` (add `StudentOutcome` model)
- Modified: `algonex-backend/courses/selectors.py` (add outcome selectors)
- New: `algonex-backend/courses/serializers/outcome_serializers.py` (or add to existing)
- Modified: `algonex-backend/courses/urls.py` (add outcomes endpoint)
- Modified: `algonex-backend/courses/admin.py` (register StudentOutcome with list_display, list_filter, search_fields)

---

## Feature 2: Alumni Wall + Student Projects Gallery

### Purpose
Provide searchable, filterable proof of outcomes (Alumni Wall) and tangible proof of skills learned (Projects Gallery). These answer the two biggest prospective student questions: "Will I get a job?" and "Will I actually build things?"

### Placement
- **Dedicated page**: `/alumni` — contains both Alumni Wall and Projects Gallery as tabbed or sectioned content
- **Homepage**: "Featured Alumni" row (6-8 cards) + "Student Projects" row (3-4 cards) with CTAs to full pages
- **Course detail pages**: "What our students build" section showing 3-4 projects from that course

### Backend

**New `showcase` app** (houses both alumni profiles and student projects — related domain, avoids app sprawl):

```python
class AlumniProfile(TimestampMixin):
    name = models.CharField(max_length=100)
    avatar = models.ImageField(upload_to="alumni/avatars/", blank=True)
    course = models.ForeignKey("courses.Course", on_delete=models.CASCADE, related_name="alumni")
    batch_year = models.PositiveIntegerField()
    current_company = models.CharField(max_length=100)
    current_role = models.CharField(max_length=100)
    linkedin_url = models.URLField(blank=True)
    short_quote = models.CharField(max_length=300, blank=True)
    package_range = models.CharField(max_length=50, blank=True)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-batch_year", "name"]

    def __str__(self):
        return f"{self.name} - {self.current_role} at {self.current_company}"


class StudentProject(TimestampMixin, SlugMixin):
    title = models.CharField(max_length=200)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to="projects/thumbnails/")
    student_name = models.CharField(max_length=100)
    course = models.ForeignKey("courses.Course", on_delete=models.CASCADE, related_name="student_projects")
    batch_year = models.PositiveIntegerField()
    tech_tags = models.ManyToManyField("courses.Skill", blank=True)
    demo_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-batch_year", "title"]

    def __str__(self):
        return f"{self.title} by {self.student_name}"
```

**Architecture:** Include `showcase/selectors.py` (queryset logic for filtering/searching) and `showcase/services.py` (write operations). Views call selectors, not querysets directly.

**Note:** `Pillow` must be in requirements (check if already installed for existing `ImageField` usage on Course/Event models).

**API endpoints:**
- `GET /api/v1/alumni/` — list published alumni (paginated, page_size=20, filter by course, batch_year, company; search by name/company)
- `GET /api/v1/alumni/featured/` — featured alumni only (no pagination, returns all featured items — expected <10)
- `GET /api/v1/projects/` — list published projects (paginated, page_size=20, filter by course, tech_tags)
- `GET /api/v1/projects/featured/` — featured projects only (no pagination)
- `GET /api/v1/projects/{slug}/` — project detail
- No auth required (public data)

**Alumni list returns all fields** (no separate detail endpoint needed). The frontend modal uses list data directly — no extra API call on click.

**Response format** (follows existing envelope):
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "id": 1, "name": "Priya M.", "avatar": "/media/alumni/avatars/priya.jpg",
        "course": { "name": "Python Full Stack", "slug": "python-full-stack" },
        "batch_year": 2025, "current_company": "TCS", "current_role": "Backend Developer",
        "linkedin_url": "https://linkedin.com/in/priya", "short_quote": "Changed my career",
        "package_range": "6-8 LPA"
      }
    ],
    "count": 35, "page": 1, "page_size": 20, "total_pages": 2
  }
}
```

**Admin config:**
- `AlumniProfile`: list_display=(name, current_company, course, batch_year, is_featured, is_published), list_filter=(course, batch_year, is_featured, is_published), search_fields=(name, current_company)
- `StudentProject`: list_display=(title, student_name, course, batch_year, is_featured, is_published), list_filter=(course, batch_year, is_featured, is_published), search_fields=(title, student_name)

### Frontend — Alumni Wall

- **Grid layout**: Ant Design `Row`/`Col` with cards (responsive: 4 cols desktop, 2 tablet, 1 mobile)
- **Filter bar**: `Select` dropdowns for Course, Batch Year, Company + Search input
- **Card design**: Avatar (or initials fallback), name, role @ company, course tag, batch year badge
- **Click to expand**: Ant Design `Modal` with full details, quote, LinkedIn link (opens in new tab)
- **Homepage preview**: Horizontal scrollable row using `react-slick` (already installed)

### Frontend — Projects Gallery

- **Grid layout**: Cards with thumbnail, title, tech stack `Tag` components, student name
- **Filter**: By course, tech stack
- **Click**: Navigate to project detail page with full description, demo/GitHub links
- **Course detail integration**: "What our students build" section — 3-4 `Card` components

**Frontend states:**
- **Loading**: Ant Design `Spin` or skeleton cards
- **Empty (no results for filter)**: "No alumni found matching your filters" with reset button
- **Error**: Graceful message with retry button

### Key files to create/modify
- New: `algonex-frontend/src/pages/alumni/AlumniPage.jsx` (main page with wall + projects tabs)
- New: `algonex-frontend/src/pages/alumni/ProjectDetailPage.jsx`
- New: `algonex-frontend/src/components/alumni/AlumniCard.jsx`
- New: `algonex-frontend/src/components/alumni/ProjectCard.jsx`
- New: `algonex-frontend/src/api/alumni.js`
- Modified: `algonex-frontend/src/components/Pages/Home.jsx` (add featured rows)
- Modified: `algonex-frontend/src/pages/courses/CourseDetailPage.jsx` (add projects section)
- Modified: `algonex-frontend/src/App.jsx` (add routes)
- New: `algonex-backend/showcase/` app (models, selectors, services, views, serializers, urls, admin)
- Modified: `algonex-backend/config/urls.py`
- Modified: `algonex-backend/config/settings/base.py` (add `showcase` to INSTALLED_APPS)

---

## Feature 3: Skill Assessment Quiz

### Purpose
Replace passive course browsing with personalized guidance. A 4-step interactive quiz recommends the best course based on the visitor's background, experience, interests, and goals.

### Placement
- **Homepage**: Prominent CTA button in hero or features section — *"Find Your Perfect Course →"*
- **Navbar**: Optional link/button
- **Opens as**: Full-screen modal or dedicated route `/quiz`

### Backend
**None required.** The quiz logic runs entirely in the frontend. The questions, answer options, and scoring matrix are defined in a constants file. The recommendation maps to existing courses via `course.slug`.

### Frontend

**Quiz flow (4 screens + result):**

```
Screen 1: "What's your background?"
  Options: Fresher | Working Professional | Career Switcher | Student

Screen 2: "How much coding experience do you have?"
  Options: None | Some basics | Comfortable | Advanced

Screen 3: "What excites you most?"
  Options: Building websites & apps | Working with data | Enterprise systems | Not sure yet

Screen 4: "What's your primary goal?"
  Options: First tech job | Upskill for promotion | Switch to tech | Freelance/startup
```

**Scoring matrix** (in `constants/quizConfig.js`):

Each answer adds points to course scores:
```javascript
const SCORING = {
  background: {
    fresher:     { python_full_stack: 3, mern_stack: 2, data_analytics: 2, java_full_stack: 1 },
    professional: { python_full_stack: 2, mern_stack: 2, data_analytics: 3, java_full_stack: 3 },
    // ... etc
  },
  // ... per question
};
```

Highest-scoring course wins. Ties broken by course order preference.

**Result screen:**
- Recommended course card with personalized message
- Brief "why this fits you" explanation (templated based on answers)
- Course stats: duration, price, placement rate
- CTA buttons: "View Course Details" / "Enroll Now"
- Secondary: "Not convinced? See all courses →"

**UX design:**
- One question per screen with large, clickable option cards (not radio buttons)
- Progress bar at top (Step 1 of 4)
- Smooth slide transition between steps (CSS transitions — no `framer-motion` needed for this)
- Back button to revisit previous answers
- Result page: subtle celebratory animation (CSS scale-up + fade-in)

**Note:** The scoring matrix keys must match actual `Course.slug` values from the database. Verify slugs by running `python3.11 manage.py seed_courses` and checking the output, or querying `Course.objects.values_list('slug', flat=True)`.

### Key files to create
- New: `algonex-frontend/src/components/quiz/SkillQuiz.jsx` (main quiz component)
- New: `algonex-frontend/src/components/quiz/QuizStep.jsx` (reusable step layout)
- New: `algonex-frontend/src/components/quiz/QuizResult.jsx` (result display)
- New: `algonex-frontend/src/constants/quizConfig.js` (questions, options, scoring matrix)
- Modified: `algonex-frontend/src/components/Pages/Home.jsx` (add quiz CTA)
- Modified: `algonex-frontend/src/App.jsx` (add `/quiz` route if standalone page)

---

## Feature 4: Animated Course Roadmap

### Purpose
Replace the static module bullet list on course detail pages with an interactive visual learning path that makes the curriculum feel like a journey, not a list.

### Placement
- **Course detail page**: Replaces or enhances the current curriculum/modules section

### Backend
**None required.** Uses existing `Module` and `Topic` data from the courses API.

### Frontend

**Layout:**
- **Desktop (≥ 768px)**: Zig-zag layout — modules alternate left and right, connected by animated lines
- **Mobile (< 768px)**: Single-column vertical timeline

**Each module node:**
- Module number badge (circular, cyan background)
- Module title
- Topic count + estimated duration
- Click/tap to expand: reveals topic list, description, skills gained
- Milestone badges on key nodes — hardcoded in frontend config keyed by module order index (e.g., `{ 2: "First Project", 4: "Portfolio Ready" }`). No backend change needed.

**Connecting lines:**
- CSS `::before`/`::after` pseudo-elements creating vertical/diagonal lines between nodes
- Subtle animated gradient pulse (cyan → transparent) flowing down the path using CSS `@keyframes`

**Summary bar at top:**
- "12 weeks • 5 modules • 25+ topics" — computed from the module/topic data

**Implementation approach:**
- Pure CSS + React state — no SVG or canvas library needed
- CSS Grid or Flexbox for the zig-zag positioning
- CSS `max-height` transitions for expand/collapse (no `framer-motion` — keep bundle lean)
- Ant Design `Tag` for skill badges within expanded modules

### Key files to create/modify
- New: `algonex-frontend/src/components/courses/CourseRoadmap.jsx` (main roadmap component)
- New: `algonex-frontend/src/components/courses/RoadmapNode.jsx` (individual module node)
- Modified: `algonex-frontend/src/pages/courses/CourseDetailPage.jsx` (integrate roadmap)
- New: CSS module or Tailwind classes for roadmap styling

---

## Verification Plan

### Backend
1. Add `StudentOutcome` model to `courses` app, create `showcase` app with `AlumniProfile` + `StudentProject`
2. Register in `INSTALLED_APPS` and run migrations
3. Add admin interfaces with proper list_display, list_filter, search_fields
4. Create seed data management command: `python3.11 manage.py seed_showcase` (seeds 15+ outcomes, 10+ alumni, 5+ projects)
5. Run `python3.11 -m pytest -v` — all existing 91 tests pass + new tests:
   - Model creation tests for each new model
   - Serializer tests
   - Endpoint tests: list, filter, featured, public access (no auth needed)
6. Test endpoints: `curl http://localhost:8000/api/v1/outcomes/`, `/alumni/`, `/alumni/featured/`, `/projects/`, `/projects/featured/`

### Frontend
1. Build each feature component in isolation
2. Integrate into existing pages (Home, CourseDetail)
3. Add new routes (`/alumni`, `/quiz`, `/projects/{slug}`)
4. Test responsive behavior at mobile/tablet/desktop breakpoints
5. Test with API data and with fallback (backend off)
6. Run `npm run build` — no errors
7. Visual review of all 4 features in the browser

### Integration
1. Start backend: `cd algonex-backend && python3.11 manage.py runserver`
2. Start frontend: `cd algonex-frontend && npm run dev`
3. Verify: Homepage shows ticker + featured alumni + featured projects + quiz CTA
4. Verify: Course detail page shows roadmap + student projects
5. Verify: `/alumni` page loads with filters working
6. Verify: `/quiz` flow completes and recommends correct course
7. Verify: All existing features still work (regression check)
