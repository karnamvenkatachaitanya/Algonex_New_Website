# Backend API Integration Guide

> **For the frontend agent:** This document describes all backend API endpoints, auth flow, and response formats.
> The backend is fully built and tested (91 tests passing). Use this to integrate React with Django.

## Base URL

```
Development: http://localhost:8000/api/v1
```

Start the backend: `cd algonex-backend && python3.11 manage.py runserver`

## Authentication

**JWT via `dj-rest-auth` + `djangorestframework-simplejwt`**

### Register
```
POST /api/v1/auth/register/
Body: { "email": "...", "password1": "...", "password2": "...", "first_name": "...", "last_name": "..." }
Response 201: { "access": "jwt...", "refresh": "jwt...", "user": {...} }
```
Note: `username` is NOT required — auto-generated from email.

### Login
```
POST /api/v1/auth/login/
Body: { "email": "...", "password": "..." }
Response 200: { "access": "jwt_access_token", "refresh": "jwt_refresh_token", "user": {...} }
```

### Token Refresh
```
POST /api/v1/auth/token/refresh/
Body: { "refresh": "jwt_refresh_token" }
Response 200: { "access": "new_access_token" }
```

### Get/Update Profile
```
GET  /api/v1/auth/user/          → user object
PATCH /api/v1/auth/user/         → update first_name, last_name, phone, bio (email and role are read-only)
Header: Authorization: Bearer <access_token>
```

### OAuth (Google/GitHub)
```
POST /api/v1/auth/google/   Body: { "code": "<authorization_code>" }
POST /api/v1/auth/github/   Body: { "code": "<authorization_code>" }
Response: same as login (access + refresh tokens)
```
OAuth flow: redirect to provider → get code → POST code to backend → receive JWT tokens.
Use `state=google` or `state=github` param in redirect URL to identify provider in callback.

### Password Reset
```
POST /api/v1/auth/password/reset/          Body: { "email": "..." }
POST /api/v1/auth/password/reset/confirm/  Body: { "uid": "...", "token": "...", "new_password1": "...", "new_password2": "..." }
POST /api/v1/auth/password/change/         Body: { "old_password": "...", "new_password1": "...", "new_password2": "..." }  (authenticated)
```

## User Object Shape

```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",       // "student" | "instructor" | "admin"
  "phone": "",
  "avatar": null,
  "bio": "",
  "date_joined": "2026-04-03T10:30:00Z"
}
```

## Response Format (all endpoints)

**Success (single object):**
```json
{ "status": "success", "data": { ... } }
```

**Success (list, paginated):**
```json
{
  "status": "success",
  "data": {
    "results": [...],
    "count": 42,
    "page": 1,
    "page_size": 10,
    "total_pages": 5
  }
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
    "details": { "email": ["Enter a valid email address."] }
  }
}
```

## Courses API

### List Courses (public)
```
GET /api/v1/courses/
Query params: ?level=beginner&is_trending=true&search=python&page=1
Response: paginated list of CourseListSerializer
```

### Course Detail (public)
```
GET /api/v1/courses/<slug>/
Response: full course with modules, topics, skills, FAQs, testimonials
Includes: "is_enrolled": true/false (if authenticated)
```

### Enroll (authenticated)
```
POST /api/v1/courses/<slug>/enroll/
Response 201: enrollment object
Error 409: ALREADY_ENROLLED
Error 400: COURSE_NOT_PUBLISHED
```

### My Enrollments (authenticated)
```
GET /api/v1/enrollments/
Response: paginated list of enrollments with course info
```

### Drop Enrollment (authenticated)
```
POST /api/v1/enrollments/<id>/drop/
Response 200: { "status": "success", "data": { "message": "Enrollment dropped." } }
```

### Create Course (instructor/admin)
```
POST /api/v1/courses/
Body: { "name": "...", "description": "...", "duration": "...", "price": "...", ... }
Response 201: created course (always starts as draft, is_published=false)
```

### Modules & Topics (instructor/admin, course owner)
```
GET/POST /api/v1/courses/<slug>/modules/
GET/PATCH/DELETE /api/v1/courses/<slug>/modules/<id>/
GET/POST /api/v1/modules/<id>/topics/
GET/PATCH/DELETE /api/v1/modules/<module_id>/topics/<id>/
```

## Events API

### List Events (public)
```
GET /api/v1/events/
Query params: ?event_type=workshop&upcoming=true
Response: paginated events with spots_left, status (upcoming/ongoing/past)
```

### Event Detail (public)
```
GET /api/v1/events/<slug>/
Response: full event detail
- "meeting_link": only shown to confirmed registrants (null otherwise)
- "user_registration_status": "confirmed" | "waitlisted" | null
```

### Register for Event (authenticated)
```
POST /api/v1/events/<slug>/register/
Response 201: { status: "confirmed" } or { status: "waitlisted" }
Error 409: ALREADY_REGISTERED
Error 400: EVENT_NOT_OPEN (past or unpublished)
```

### Cancel Registration (authenticated)
```
POST /api/v1/events/<slug>/cancel/
Response 200: cancels and auto-promotes next waitlisted person
```

### My Event Registrations (authenticated)
```
GET /api/v1/event-registrations/
Response: paginated list of registrations
```

## Careers API

### List Jobs (public)
```
GET /api/v1/careers/
Query params: ?department=engineering&job_type=full_time&is_remote=true
Response: paginated jobs
```

### Job Detail (public)
```
GET /api/v1/careers/<slug>/
Response: full job with description, requirements, salary range
```

### Apply (authenticated, multipart/form-data)
```
POST /api/v1/careers/<slug>/apply/
Body: resume (file, PDF), cover_letter (text, optional)
Content-Type: multipart/form-data
Response 201: application with status "applied"
Error 409: ALREADY_APPLIED
Error 400: JOB_NOT_ACTIVE
```

### My Applications (authenticated)
```
GET /api/v1/applications/
Response: list of applications with status (applied/reviewed/interview/hired/rejected)
Note: admin_notes is NEVER included in this response
```

## Portfolio API

### List Case Studies (public)
```
GET /api/v1/portfolio/
Query params: ?industry=edtech&tech=React
Response: paginated case studies with tech_tags
```

### Case Study Detail (public)
```
GET /api/v1/portfolio/<slug>/
Response: full case study with problem, solution, results, screenshots, tech_tags
```

## Frontend Routes ↔ Backend Endpoints

| Frontend Route | Backend Endpoint | Auth? |
|---------------|-----------------|-------|
| `/signin` | POST `/auth/login/` | No |
| `/signup` | POST `/auth/register/` | No |
| `/auth/callback` | POST `/auth/google/` or `/auth/github/` | No |
| `/profile` | GET/PATCH `/auth/user/` | Yes |
| `/courses` or `/allcourses` | GET `/courses/` | No |
| `/stack/:slug` | GET `/courses/:slug/` | No |
| `/my-courses` | GET `/enrollments/` | Yes |
| `/events` | GET `/events/` | No |
| `/events/:slug` | GET `/events/:slug/` | No |
| `/my-events` | GET `/event-registrations/` | Yes |
| `/careers` | GET `/careers/` | No |
| `/careers/:slug` | GET `/careers/:slug/` | No |
| `/my-applications` | GET `/applications/` | Yes |
| `/products` | GET `/portfolio/` | No |
| `/products/:slug` | GET `/portfolio/:slug/` | No |

## Seeding Test Data

```bash
cd algonex-backend
python3.11 manage.py migrate
python3.11 manage.py seed_courses    # Creates 4 sample courses
python3.11 manage.py createsuperuser  # Create admin user
```

## CORS

Development CORS is configured for `http://localhost:5173` (Vite default).
Set `VITE_API_URL=http://localhost:8000/api/v1` in `algonex-frontend/.env`.
