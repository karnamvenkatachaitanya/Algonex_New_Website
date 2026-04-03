# Algonex Platform Redesign — Design Specification

**Date:** 2026-04-03
**Status:** Draft
**Branch:** `stack-page`

## Overview

Transform Algonex from a static learning platform into a full-featured web application with user authentication, dynamic courses, event registrations, career portal, and product showcase — backed by a properly layered Django REST API, Docker deployment, and Playwright E2E tests.

## Decisions Summary

| Area | Choice |
|------|--------|
| User roles | Student, Instructor, Admin |
| Authentication | Email/password + Google/GitHub OAuth (JWT) |
| API framework | Django REST Framework |
| Architecture | Monolithic Django + React SPA, 4-layer pattern |
| Courses | DB-backed + enrollment + instructor management |
| Events | Capacity limits, waitlists, auto-close |
| Careers | Full hiring pipeline with status tracking |
| Products | Case studies (problem/solution/results) |
| Frontend components | Ant Design with centralized theme.js |
| Deployment | Docker (docker-compose) |
| E2E testing | Playwright |
| Database | SQLite (single Gunicorn worker; upgrade to PostgreSQL if concurrent writes become an issue) |

## Architecture

### Approach: Monolithic Django + React SPA

Single Django project with multiple apps. React stays as a separate Vite SPA, communicates via DRF REST API with JWT authentication. Django Admin for content management. CORS configured via `django-cors-headers` — allowed origins set per environment in settings (development: `localhost:5173`, production: the deployed frontend domain). SQLite is acceptable for initial deployment with a single Gunicorn worker; if concurrent writes become a bottleneck, swap to PostgreSQL (only a settings change).

### Backend — 4-Layer Architecture (per app)

Every Django app follows the same layered pattern:

| Layer | File(s) | Responsibility |
|-------|---------|---------------|
| **API** | `views.py`, `serializers.py`, `urls.py` | HTTP boundary — auth, permissions, request/response. Delegates all logic to services. Never contains business rules. |
| **Service** | `services.py` | ALL business logic — pure Python functions, no HTTP concepts. Raises domain exceptions. Testable in isolation. |
| **Selector** | `selectors.py` | ALL read queries — filtering, ordering, annotations. Never mutates state. |
| **Model** | `models.py` | Data shape + DB constraints. Properties for computed fields. No business logic. |

Additional files per app:
- `permissions.py` — custom DRF permissions
- `exceptions.py` — domain exceptions (mapped to HTTP by shared handler)
- `filters.py` — django-filter filtersets
- `admin.py` — Django admin configuration
- `tests/` — `test_services.py`, `test_selectors.py`, `test_api.py`

### Cross-Cutting Concerns

**`common/` shared module:**
- `exception_handler.py` — maps domain exceptions to HTTP responses
- `pagination.py` — standard page-number pagination
- `permissions.py` — base role permissions (`IsStudent`, `IsInstructor`, `IsAdmin`)
- `mixins.py` — `TimestampMixin`, `SlugMixin` for models

**`config/` Django project:**
- `settings/base.py` — shared settings
- `settings/development.py` — DEBUG, SQLite
- `settings/production.py` — security, allowed hosts
- `settings/testing.py` — fast test config
- `urls.py` — API versioning root

### REST API Contract Standards

Every response follows a consistent format:

**Success (list):**
```json
{
  "status": "success",
  "data": {
    "results": [...],
    "count": 12,
    "page": 1,
    "page_size": 10,
    "total_pages": 2
  }
}
```

**Success (detail):**
```json
{
  "status": "success",
  "data": { ... }
}
```

**Error:**
```json
{
  "status": "error",
  "error": {
    "code": "ALREADY_ENROLLED",
    "message": "You are already enrolled in this course."
  }
}
```

**Validation error:**
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input.",
    "details": {
      "email": ["Enter a valid email address."]
    }
  }
}
```

**Contract rules:**
- Every response has `"status"`: `"success"` | `"error"`
- Success data always in `"data"` key
- Lists always paginated with `count`, `page`, `total_pages`
- Errors have machine-readable `"code"` + human `"message"`
- Validation errors include `"details"` per field
- Nested relations use serializer nesting (not bare IDs)
- Dates in ISO 8601: `"2026-04-03T10:30:00Z"`
- Slug used for lookups (not numeric IDs in URLs)
- All endpoints versioned under `/api/v1/`
- HTTP status codes: 200, 201, 400, 401, 403, 404, 409

### API Versioning

All endpoints under `/api/v1/`:
- `/api/v1/auth/`
- `/api/v1/courses/`
- `/api/v1/events/`
- `/api/v1/careers/`
- `/api/v1/portfolio/`
- `/api/v1/contact/` (existing `contactform` app — already built, no changes needed beyond adding versioned URL prefix)

---

## Sub-Project 1: Authentication & User System (`accounts` app)

### Models

**User** (extends `AbstractUser`):
- `email` — unique, used as login identifier
- `username` — auto-generated from email
- `first_name`, `last_name` — CharField
- `role` — choices: `student` | `instructor` | `admin` (default: `student`)
- `phone` — optional CharField
- `avatar` — optional ImageField
- `bio` — optional TextField
- `is_active`, `date_joined` — standard Django fields

**SocialAccount** — managed by `django-allauth` (no custom code):
- `user` FK → User
- `provider` — `google` | `github`
- `uid`, `extra_data`

### API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/auth/register/` | Sign up with email + password | No |
| POST | `/api/v1/auth/login/` | Login, returns JWT access + refresh | No |
| POST | `/api/v1/auth/token/refresh/` | Refresh expired access token | No |
| POST | `/api/v1/auth/logout/` | Blacklist refresh token | Yes |
| POST | `/api/v1/auth/google/` | Google OAuth callback | No |
| POST | `/api/v1/auth/github/` | GitHub OAuth callback | No |
| GET | `/api/v1/auth/user/` | Get current user profile | Yes |
| PATCH | `/api/v1/auth/user/` | Update profile | Yes |
| POST | `/api/v1/auth/password/change/` | Change password | Yes |
| POST | `/api/v1/auth/password/reset/` | Request password reset email | No |
| POST | `/api/v1/auth/password/reset/confirm/` | Confirm reset with token + new password | No |

### Auth Flow

**Email/password:**
1. POST `/api/v1/auth/login/` with credentials
2. Django validates, returns `{access, refresh}` tokens
3. React stores access token in memory, refresh in httpOnly cookie
4. Access token sent in `Authorization: Bearer <token>` header
5. Auto-refresh when access token expires (via axios interceptor)

**Google/GitHub OAuth:**
1. User clicks "Sign in with Google/GitHub"
2. Redirect to provider consent screen
3. Provider redirects back with authorization code
4. React sends code to `/api/v1/auth/google/` or `/github/`
5. Django exchanges code for user info via provider API
6. Creates/links User + SocialAccount
7. Returns JWT tokens, same flow from here

### Role-Based Permissions

| Action | Student | Instructor | Admin |
|--------|---------|------------|-------|
| Browse courses/events | Yes | Yes | Yes |
| Enroll in courses | Yes | Yes | Yes |
| Register for events | Yes | Yes | Yes |
| Apply for careers | Yes | Yes | Yes |
| Create/edit own courses | No | Yes | Yes |
| Manage events | No | No | Yes |
| Manage career listings | No | No | Yes |
| Review applications | No | No | Yes |
| Manage all users/content | No | No | Yes |

New users default to `student`. Admins promote via Django Admin.

### Libraries

- `dj-rest-auth` — login/register/token endpoints
- `django-allauth` — Google/GitHub OAuth
- `djangorestframework-simplejwt` — JWT tokens
- `axios` — API client with interceptors for token refresh
- React Context (`AuthContext`) — user state, tokens, role

### Frontend Pages

- `/signin` — email/password + Google/GitHub OAuth buttons
- `/signup` — registration form + OAuth buttons
- `/profile` — edit name, bio, avatar, phone

---

## Sub-Project 2: Courses System (`courses` app)

### Models

**Course:**
- `instructor` FK → User
- `name`, `slug` (unique), `description`
- `image` (card), `banner` (detail page) — ImageField
- `level` — choices: `beginner` | `intermediate` | `advanced`
- `prior_knowledge` — TextField
- `duration` — CharField (e.g., "3 months")
- `price` — DecimalField
- `discount` — IntegerField (percentage)
- `is_trending`, `is_published` — BooleanField
- `created_at`, `updated_at` — auto

**Module:**
- `course` FK → Course
- `title`, `description`
- `order` — PositiveIntegerField

**Topic:**
- `module` FK → Module
- `title`, `description`
- `order` — PositiveIntegerField

**Skill:**
- `name` — unique CharField
- M2M with Course (shared across courses)

**Enrollment:**
- `student` FK → User
- `course` FK → Course
- `enrolled_at` — auto
- `status` — choices: `active` | `completed` | `dropped` (drop endpoint: POST `/api/v1/enrollments/:id/drop/`)
- `unique_together: (student, course)`

**CourseFAQ:**
- `course` FK → Course
- `question`, `answer`
- `order` — PositiveIntegerField

**Testimonial:**
- `course` FK → Course
- `name`, `role` — CharField
- `image` — ImageField
- `rating` — IntegerField (1-5)
- `text` — TextField

### API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/courses/` | List published courses (filter by level, trending) | No |
| GET | `/api/v1/courses/:slug/` | Course detail (modules, topics, skills, FAQs, testimonials) | No |
| POST | `/api/v1/courses/:slug/enroll/` | Enroll in a course | Student+ |
| GET | `/api/v1/enrollments/` | List my enrolled courses | Student+ |
| POST | `/api/v1/courses/` | Create a new course (draft) | Instructor+ |
| PATCH | `/api/v1/courses/:slug/` | Update own course | Instructor (owner) |
| POST | `/api/v1/courses/:slug/modules/` | Add module to own course | Instructor (owner) |
| POST | `/api/v1/modules/:id/topics/` | Add topic to own module | Instructor (owner) |
| DELETE | `/api/v1/courses/:slug/` | Delete any course | Admin |

### Service Layer Logic

**`create_course(instructor, data)`:**
1. Verify user has instructor or admin role
2. Auto-generate slug from name
3. Create course with `is_published=False` (draft)
4. Return course

**`update_course(course, instructor, data)`:**
1. Verify `course.instructor == instructor` (ownership check) or user is admin
2. Validate updated fields
3. Save and return course

**`publish_course(course, instructor)`:**
1. Verify ownership or admin role
2. Verify course has at least one module with at least one topic
3. Set `is_published=True`

**`enroll_student(student, course)`:**
1. Verify course is published
2. Verify student not already enrolled
3. Create Enrollment with `active` status

**`drop_enrollment(enrollment)`:**
1. Set enrollment status to `dropped`

### Permissions

Instructor ownership is enforced via a custom `IsInstructorOwner` permission: checks `course.instructor == request.user`. Admins bypass this check. Applied to all write endpoints on courses, modules, and topics.

### Data Migration

A Django management command (`python manage.py seed_courses`) imports the 4 existing courses from `constant.js` data into the database. Frontend components stay the same — only the data source changes from import to API call.

### Frontend Changes

**Updated pages:** `/stack/:slug` (fetch from API), `/allcourses`, `/courses`, Home (trending from API)
**New pages:** `/my-courses` (student's enrolled courses)
**New components:** `EnrollButton`, API-driven data via `useCourses()` and `useCourse(slug)` hooks

---

## Sub-Project 3: Events & Registrations (`events` app)

### Models

**Event:**
- `title`, `slug` (unique), `description`
- `image` — ImageField
- `event_type` — choices: `workshop` | `webinar` | `hackathon` | `meetup`
- `location` — CharField (or "Online")
- `meeting_link` — optional URLField (for online events, visible only to confirmed registrants)
- `start_date`, `end_date` — DateTimeField
- `capacity` — PositiveIntegerField
- `is_published` — BooleanField
- `created_at` — auto
- Computed properties: `spots_left`, `is_full`, `status` (upcoming/ongoing/past)

**Registration:**
- `event` FK → Event
- `user` FK → User
- `status` — choices: `confirmed` | `waitlisted` | `cancelled`
- `registered_at` — auto
- `unique_together: (event, user)`

### API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/events/` | List events (filter: upcoming, type, past) | No |
| GET | `/api/v1/events/:slug/` | Event detail (spots_left, user's registration status) | No |
| POST | `/api/v1/events/:slug/register/` | Register (auto-confirms or waitlists) | Yes |
| POST | `/api/v1/events/:slug/cancel/` | Cancel registration (promotes waitlist) | Yes |
| GET | `/api/v1/registrations/` | My event registrations | Yes |
| POST | `/api/v1/events/` | Create event | Admin |
| PATCH | `/api/v1/events/:slug/` | Update event | Admin |
| GET | `/api/v1/events/:slug/attendees/` | List all registrations for an event | Admin |

### Service Layer Logic

**`register_for_event(user, event)`:**
1. Verify event is upcoming and published
2. Verify user not already registered (excluding cancelled)
3. If `spots_left > 0` → status = `confirmed`
4. If full → status = `waitlisted`

**`cancel_registration(registration)`:**
1. Set status to `cancelled`
2. Find oldest waitlisted registration for this event
3. Promote to `confirmed`

**Auto-close:** Past events reject new registrations.

### Frontend Pages

- `/events` — card grid with type filters, shows spots remaining or "FULL — Waitlist"
- `/events/:slug` — detail page with banner, info, Register/Waitlist button
- `/my-events` — student's registered events

---

## Sub-Project 4: Careers & Hiring Pipeline (`careers` app)

### Models

**Job:**
- `title`, `slug` (unique)
- `department` — choices: `engineering` | `design` | `marketing` | `operations`
- `job_type` — choices: `full_time` | `part_time` | `internship` | `contract`
- `location` — CharField
- `is_remote` — BooleanField
- `description`, `requirements` — TextField
- `salary_min`, `salary_max` — optional DecimalField
- `is_active` — BooleanField
- `posted_at` — auto
- `deadline` — optional DateField

**Application:**
- `job` FK → Job
- `applicant` FK → User
- `resume` — FileField (PDF only, max 5MB, stored in `media/resumes/`)
- `cover_letter` — TextField
- `status` — choices: `applied` | `reviewed` | `interview` | `hired` | `rejected`
- `admin_notes` — TextField (internal, never exposed to applicants)
- `applied_at`, `updated_at` — auto
- `unique_together: (job, applicant)`

### Hiring Pipeline State Machine

```
applied → reviewed → interview → hired
   ↘         ↘          ↘
          rejected (can happen at any stage)
```

Valid transitions enforced in the service layer:
- `applied` → `reviewed`, `rejected`
- `reviewed` → `interview`, `rejected`
- `interview` → `hired`, `rejected`
- `hired` → (terminal)
- `rejected` → (terminal)

### API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/careers/` | List active jobs (filter: department, type, remote) | No |
| GET | `/api/v1/careers/:slug/` | Job detail | No |
| POST | `/api/v1/careers/:slug/apply/` | Submit application (resume + cover letter) | Yes |
| GET | `/api/v1/applications/` | My applications + statuses | Yes |
| POST | `/api/v1/careers/` | Create job listing | Admin |
| PATCH | `/api/v1/careers/:slug/` | Update job listing | Admin |
| GET | `/api/v1/careers/:slug/applications/` | List applications for a job | Admin |
| PATCH | `/api/v1/applications/:id/` | Update application status + admin notes | Admin |

### Frontend Pages

- `/careers` — job board with department/type/remote filters
- `/careers/:slug` — job detail + "Apply Now" form (resume upload + cover letter)
- `/my-applications` — track all applications with pipeline progress bar (using antd `Steps`)

---

## Sub-Project 5: Products / Case Studies (`portfolio` app)

### Models

**CaseStudy:**
- `title`, `slug` (unique), `client_name`
- `thumbnail` (card image), `banner` (detail page) — ImageField
- `summary` — CharField (short blurb for cards)
- `problem`, `solution`, `results` — TextField (the core narrative)
- `industry` — CharField (e.g., `edtech`, `fintech`, `healthcare`)
- `is_featured`, `is_published` — BooleanField
- `published_at` — DateField

**TechTag:**
- `name` — unique CharField
- M2M with CaseStudy (reusable tech stack labels)

**Screenshot:**
- `case_study` FK → CaseStudy
- `image` — ImageField
- `caption` — optional CharField
- `order` — PositiveIntegerField

### API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/v1/portfolio/` | List published case studies (filter: industry, tech) | No |
| GET | `/api/v1/portfolio/:slug/` | Case study detail (problem, solution, results, screenshots) | No |

All CRUD managed via Django Admin with inline Screenshot management.

### Frontend Pages

- `/products` — grid of case study cards with industry/tech filters
- `/products/:slug` — detail page with Problem/Solution/Results narrative, screenshot gallery (antd `Image.PreviewGroup`), tech stack tags

---

## Frontend Architecture

### Theme System (`src/theme/theme.js`)

Single source of truth for all design tokens:

**Ant Design tokens (`theme.antd`):**
- `colorPrimary: "#00B4D8"` — controls all antd components globally
- Component-level overrides for Button, Card, Menu, Tag
- Feeds into `ConfigProvider` wrapping the entire app

**Frontend data fetching:** Custom hooks use `useEffect` + `useState` for simplicity. No external caching library (React Query/SWR) initially — can be added later if performance demands it.

**Custom tokens:**
- `colors` — primary palette, text colors, backgrounds, status colors, pipeline colors
- `spacing` — xs(4) through xxl(48) scale
- `breakpoints` — mobile(480), tablet(768), desktop(1024), wide(1400)
- `shadows` — card, cardHover, nav
- `radius` — sm(8) through full(9999)

**SCSS sync:** A build script (`generateScssVars.js`) exports theme tokens as SCSS variables (`_variables.scss`) so both systems stay consistent.

### Ant Design Component Usage

| Feature | Ant Design Component | Used In |
|---------|---------------------|---------|
| Course/Event/Job cards | `Card`, `Card.Meta` | All listing pages |
| Forms (login, signup, apply) | `Form`, `Input`, `Button`, `Upload` | Auth, Careers |
| Filter chips | `Segmented` or `Radio.Group` | All listing pages |
| Skill/tech tags | `Tag` | Course detail, Case studies |
| FAQ accordion | `Collapse` | Course detail |
| Course modules | `Collapse` (nested) | Course detail |
| Pipeline tracker | `Steps` | My Applications |
| Event spots indicator | `Badge`, `Tag` | Event cards/detail |
| Navigation | `Menu` + custom layout | Navbar |
| Pagination | `Pagination` | All list pages |
| Notifications | `message`, `notification` | Global |
| Loading states | `Skeleton`, `Spin` | All data pages |
| Screenshot gallery | `Image`, `Image.PreviewGroup` | Case study detail |
| User avatar | `Avatar`, `Dropdown` | Navbar |
| Testimonials | `Carousel` | Course detail (replaces react-slick) |
| Confirm dialogs | `Modal.confirm` | Cancel, drop actions |

Custom SCSS is only used for page-level layouts, hero banners, and section backgrounds.

### Frontend File Structure

```
algonex-frontend/src/
├── theme/
│   ├── theme.js              # single source of truth
│   ├── generateScssVars.js   # build script: theme.js → _variables.scss
│   └── _variables.scss       # auto-generated
├── api/
│   ├── client.js             # axios instance + JWT interceptors
│   ├── auth.js               # auth endpoints
│   ├── courses.js            # course endpoints
│   ├── events.js             # event endpoints
│   ├── careers.js            # career endpoints
│   └── portfolio.js          # portfolio endpoints
├── hooks/
│   ├── useAuth.js            # login, logout, register, user state
│   ├── useCourses.js         # course data + enrollment actions
│   ├── useEvents.js          # event data + registration actions
│   ├── useCareers.js         # jobs + application actions
│   └── usePortfolio.js       # case study data
├── context/
│   └── AuthContext.jsx       # user state + role + tokens
├── components/
│   ├── common/               # ProtectedRoute, RoleGate, PageHeader, EmptyState
│   ├── layout/               # Navbar, Footer, PageLayout
│   ├── courses/              # CourseCard, ModuleCollapse, SkillTags, EnrollButton
│   ├── events/               # EventCard, SpotsIndicator, RegisterButton
│   ├── careers/              # JobCard, ApplicationForm, PipelineSteps
│   └── portfolio/            # CaseStudyCard, ScreenshotGallery
├── pages/
│   ├── Home.jsx
│   ├── courses/              # CourseListPage, CourseDetailPage, MyCoursesPage
│   ├── events/               # EventListPage, EventDetailPage, MyEventsPage
│   ├── careers/              # JobListPage, JobDetailPage, MyApplicationsPage
│   ├── portfolio/            # CaseStudyListPage, CaseStudyDetailPage
│   ├── auth/                 # LoginPage, SignupPage, ProfilePage
│   └── static/               # AboutPage, ContactPage
├── routes/
│   └── index.jsx             # centralized route config with role guards
├── styles/
│   └── global.scss           # imports _variables.scss, page-level layouts only
├── App.jsx                   # ConfigProvider + AuthProvider + Router
└── main.jsx
```

---

## Sub-Project 6: Infrastructure

### Backend File Structure

```
algonex-backend/
├── Dockerfile
├── requirements.txt
├── manage.py
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── common/
│   ├── exception_handler.py
│   ├── pagination.py
│   ├── permissions.py
│   └── mixins.py
├── accounts/
│   ├── models.py, services.py, selectors.py
│   ├── serializers.py, views.py, urls.py
│   ├── permissions.py, exceptions.py, admin.py
│   └── tests/
├── courses/
│   ├── models.py, services.py, selectors.py
│   ├── serializers.py, views.py, urls.py
│   ├── permissions.py, exceptions.py, filters.py, admin.py
│   ├── management/commands/seed_courses.py
│   └── tests/
├── events/
│   ├── models.py, services.py, selectors.py
│   ├── serializers.py, views.py, urls.py
│   ├── permissions.py, exceptions.py, filters.py, admin.py
│   └── tests/
├── careers/
│   ├── models.py, services.py, selectors.py
│   ├── serializers.py, views.py, urls.py
│   ├── permissions.py, exceptions.py, filters.py, admin.py
│   └── tests/
├── portfolio/
│   ├── models.py, selectors.py
│   ├── serializers.py, views.py, urls.py
│   ├── admin.py
│   └── tests/
└── contactform/              # existing
```

### Docker Setup

**`docker-compose.yml` — 3 services:**
- `frontend` — Node/Vite dev server (dev) or Nginx serving built assets (prod)
- `backend` — Gunicorn + Django
- `nginx` — reverse proxy routing `/api/` and `/admin/` → backend, everything else → frontend

**Volumes:**
- SQLite file mounted as Docker volume for persistence
- Media files (resumes, images) in shared volume between backend + nginx

**Environment:** `.env` file for secrets (Django secret key, OAuth client IDs/secrets, allowed hosts)

### Testing

**Backend:** `pytest` + `pytest-django` + DRF's `APIClient`
- `test_services.py` — unit tests for business logic (no HTTP)
- `test_selectors.py` — unit tests for queries
- `test_api.py` — integration tests for endpoints

**Frontend E2E:** Playwright
- Auth flows (signup, login, OAuth mock, logout)
- Course browsing + enrollment
- Event registration + waitlist
- Career application submission
- Case study viewing
- Cross-role permission tests

**CI:** `docker-compose -f docker-compose.test.yml up` runs all tests.

---

## Build Order

Each sub-project gets its own implementation plan, branch, and review cycle:

1. **Auth & Users** — foundation, everything depends on it. Includes initial Django project scaffolding (config/, common/, requirements.txt, settings split)
2. **Courses** — revamp existing data, connect to DB
3. **Events & Registrations** — builds on auth
4. **Careers & Pipeline** — independent but needs auth
5. **Products/Case Studies** — mostly read-only showcase
6. **Infrastructure** — Docker, Playwright, polish (layered progressively)

## Key Libraries

### Backend
- `djangorestframework` — REST API
- `dj-rest-auth` — auth endpoints
- `django-allauth` — OAuth providers
- `djangorestframework-simplejwt` — JWT tokens
- `django-filter` — query parameter filtering
- `django-cors-headers` — CORS for frontend
- `Pillow` — image handling
- `pytest`, `pytest-django` — testing

### Frontend
- `react` 19.x, `react-router-dom` 7.x — SPA routing
- `antd` 5.x — UI component library
- `axios` — HTTP client
- `@ant-design/icons` — icon set (replaces lucide-react + react-icons)
- `sass-embedded` — SCSS compilation
- `playwright` — E2E testing
