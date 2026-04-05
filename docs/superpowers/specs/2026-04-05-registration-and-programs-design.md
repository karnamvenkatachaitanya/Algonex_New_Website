# Registration System & Programs Module — Design Spec

**Date:** 2026-04-05
**Status:** Approved

## Overview

Two features:
1. **Progressive Registration System** — anonymous users register for training programs via a two-step form, creating a password-less account. They can set a password later via email link.
2. **Programs Module** — browse-only listings for fellowships and internships, similar to courses/events.

## Goals

- Minimal friction registration for anonymous users (no password required)
- Capture rich profile data: address, education, employment, training interests
- Support linking registrations to specific fellowship/internship programs
- Two-step login flow that handles both password and password-less accounts
- Browse-only program listings with admin CRUD

## Non-Goals

- Direct application flow on programs (no resume upload, no application pipeline)
- Payment/billing for programs
- Program enrollment tracking beyond registration interest

## Security Considerations

- **Email enumeration:** Both `/register/step1/` and `/auth/check-email/` reveal whether an email exists. This is inherent to the two-step login design. Mitigate with DRF throttling (e.g., 5 requests/minute per IP on these endpoints).
- **Step 1 → Step 2 binding:** Step 2 accepts `email` and creates/updates profile for that user without authentication. This is accepted risk for the low-friction registration use case. Step 2 uses `update_or_create` semantics (not destructive overwrite). For users with `has_usable_password: true`, profile updates still work but the frontend shows a "login to manage your data" suggestion.
- **No `user_id` in responses:** Registration endpoints never expose internal user IDs. Responses use `is_new` and `has_password` flags only.
- **Rate limiting:** Apply DRF throttle classes to: `/register/step1/`, `/register/step2/`, `/auth/check-email/`, `/auth/send-setup-email/`.

---

## Data Models

### `RegistrationProfile` (extends `signin` app, replaces `SigninProfile`)

OneToOneField to User. Stores all registration-specific data.

- `__str__`: `f"{user.email} - {interest_category}"`
- `Meta.ordering`: `["-created_at"]`

```
RegistrationProfile (TimestampMixin)
├── user              → OneToOneField(User, related_name="registration_profile")
│
├── Address
│   ├── street_address   (TextField, blank=True)
│   ├── city             (CharField, max_length=100)
│   ├── state            (CharField, max_length=100)
│   ├── country          (CharField, max_length=100, default="India")
│   ├── pincode          (CharField, max_length=10, blank=True)
│
├── Education
│   ├── college          (CharField, max_length=255)
│   ├── branch           (CharField, max_length=100)  — e.g., CSE, ECE
│   ├── degree_level     (CharField, choices: diploma/bachelors/masters/phd/other)
│   ├── graduation_year  (PositiveIntegerField)
│   ├── current_year     (CharField, max_length=20, blank=True)  — e.g., "3rd year"
│
├── Employment
│   ├── employment_status   (CharField, choices: student/employed/freelancer/unemployed)
│   ├── years_of_experience (PositiveIntegerField, default=0)
│
├── Training Interest
│   ├── interest_category    (CharField, choices: fellowship/internship/workshop/course/other)
│   ├── program              (ForeignKey → Program, null=True, blank=True)
│   ├── specific_interests   (TextField, blank=True)
│
├── Meta
│   ├── terms_agreed    (BooleanField, default=False)
│   ├── created_at      (from TimestampMixin)
│   ├── updated_at      (from TimestampMixin)
```

### `Program` (new `programs` app)

```
Program (TimestampMixin, SlugMixin)
├── Basic
│   ├── title                (CharField, max_length=255)
│   ├── description          (TextField)  — Markdown
│   ├── image                (ImageField, blank=True)
│   ├── banner               (ImageField, blank=True)
│   ├── program_type         (CharField, choices: fellowship/internship)
│
├── Details
│   ├── duration             (CharField, max_length=50)  — e.g., "3 months"
│   ├── stipend              (CharField, max_length=100, blank=True)  — e.g., "₹15,000/month"
│   ├── location             (CharField, max_length=255)
│   ├── is_remote            (BooleanField, default=False)
│
├── Eligibility
│   ├── eligibility_criteria (TextField)  — Markdown
│   ├── min_degree_level     (CharField, choices, blank=True)
│   ├── eligible_branches    (TextField, blank=True)  — comma-separated
│
├── Dates
│   ├── application_deadline (DateField)
│   ├── start_date           (DateField)
│   ├── end_date             (DateField)
│
├── Capacity & Status
│   ├── capacity             (PositiveIntegerField)
│   ├── is_published         (BooleanField, default=False)
│   ├── is_featured          (BooleanField, default=False)
│
├── Properties (computed)
│   ├── is_accepting         → application_deadline >= today
│   ├── spots_left           → capacity - registration_count
│
├── Meta
│   ├── __str__              → f"{title} ({program_type})"
│   ├── ordering             → ["-is_featured", "application_deadline"]
```

**`registration_count` definition:** `RegistrationProfile.objects.filter(program=self).count()`. Since RegistrationProfile is OneToOne with User, each user can only have one registration — no double-counting.

**`eligible_branches` note:** Stored as comma-separated text for simplicity (SQLite compatibility in dev). Can be migrated to JSONField or M2M if branch-based filtering becomes a requirement.

---

## API Endpoints

### Registration (no auth required)

**POST /api/v1/register/step1/**

Creates or finds a User by email. No password set.

**Implementation note:** Use `User.objects.create_user(email=email, password=None, ...)` to ensure `has_usable_password()` returns `False`. The existing `UserManager.create_user` calls `set_password(None)` which sets an unusable password hash — this is the desired behavior.

**Username uniqueness:** `UserManager.create_user` generates username from `email.split("@")[0]`. To handle collisions (e.g., `john@gmail.com` vs `john@yahoo.com`), the `register_step1` service must catch `IntegrityError` on username and append a numeric suffix (e.g., `john`, `john1`, `john2`).

```
Request:  { first_name, last_name, email, phone }
Response:
  New user     → 201: { status: "success", data: { is_new: true } }
  Existing (no pwd) → 200: { status: "success", data: { is_new: false, has_password: false } }
  Existing (has pwd) → 200: { status: "success", data: { is_new: false, has_password: true,
                               message: "Account exists. Login to manage your data." } }
```

**POST /api/v1/register/step2/**

Creates or updates RegistrationProfile for the user identified by email.

```
Request: {
  email,
  street_address, city, state, country, pincode,
  college, branch, degree_level, graduation_year, current_year,
  employment_status, years_of_experience,
  interest_category, program_slug (optional), specific_interests,
  terms_agreed
}
Response: 201/200: { status: "success", data: { registered: true } }
```

### URL Routing

Add to `config/urls.py`:
```
path("api/v1/register/", include("signin.urls")),
path("api/v1/programs/", include("programs.urls")),
```

New auth endpoints added to `accounts/urls.py`:
```
path("check-email/", CheckEmailView.as_view()),
path("send-setup-email/", SendSetupEmailView.as_view()),
path("set-password/", SetPasswordView.as_view()),
```

### Two-Step Login (new auth endpoints)

**POST /api/v1/auth/check-email/**
```
Request:  { email }
Response: { exists: true/false, has_password: true/false }
```

**POST /api/v1/auth/send-setup-email/**
```
Request:  { email }
Response: { status: "success", message: "Password setup email sent" }
Logic: Only works for users with no usable password. Uses Django's PasswordResetTokenGenerator.
```

**POST /api/v1/auth/set-password/**
```
Request:  { token, uid, password, confirm_password }
Response: { status: "success" }
Logic: Validates token, sets password. User can now login normally.
```

**POST /api/v1/auth/login/** — existing endpoint, unchanged.

### Programs (public read, admin write)

```
GET    /api/v1/programs/           → List published (filter: type, featured, search)
GET    /api/v1/programs/:slug/     → Detail with registration_count, spots_left
POST   /api/v1/programs/           → Create (admin only)
PATCH  /api/v1/programs/:slug/     → Update (admin only)
DELETE /api/v1/programs/:slug/     → Delete (admin only)
```

**ProgramListSerializer:** title, slug, program_type, image, duration, stipend, location, is_remote, application_deadline, start_date, is_featured, registration_count, is_accepting

**ProgramDetailSerializer:** all list fields + description, banner, eligibility_criteria, min_degree_level, eligible_branches, end_date, capacity, spots_left

**Pagination:** Uses `StandardPagination` (10 items/page) from `common.pagination`, same as all other list endpoints.

---

## Auth Flow

### Two-Step Login (Frontend)

1. User enters email → `POST /auth/check-email/`
2. If `has_password: true` → show password field → `POST /auth/login/`
3. If `has_password: false` → show "Send password setup email" button → `POST /auth/send-setup-email/`
4. User receives email with link: `/set-password?token=<token>&uid=<uid>`
5. User sets password → `POST /auth/set-password/` → redirect to login

### Registration (Frontend)

1. **Step 1 form:** first_name, last_name, email, phone → `POST /register/step1/`
   - If response shows `has_password: true` → show info banner: "You have an account. Login to manage your data." (user can still continue)
2. **Step 2 form:** address, education, employment, training interest → `POST /register/step2/`
   - If arrived from program page (`/register?program=<slug>`), program is pre-selected
3. Success page: "Registration complete! Set up a password to access your account later."

### Entry Points

- Direct: `/register` page
- From program page: "Register for this program" → `/register?program=<slug>`
- Navbar/CTA: "Get Started" links to `/register`

---

## App Structure

### `programs/` (new app, follows 4-layer pattern)

```
programs/
├── models.py           → Program
├── views.py            → ProgramViewSet
├── services.py         → create_program, update_program
├── selectors.py        → get_published_programs, get_program_detail
├── serializers.py      → ProgramListSerializer, ProgramDetailSerializer
├── permissions.py      → reuse IsAdmin from common
├── urls.py
├── admin.py
├── filters.py          → ProgramFilter (by type, featured)
├── tests/
│   ├── test_models.py
│   ├── test_services.py
│   ├── test_selectors.py
│   └── test_views.py
└── management/commands/
    └── seed_programs.py
```

### Changes to Existing Code

| Area | Change |
|------|--------|
| `signin/models.py` | Replace `SigninProfile` with `RegistrationProfile` (OneToOne → User) |
| `signin/views.py` | New `RegisterStep1View`, `RegisterStep2View` |
| `signin/services.py` | New: `register_step1()`, `register_step2()` |
| `signin/serializers.py` | New: `Step1Serializer`, `Step2Serializer` |
| `accounts/views.py` | New: `CheckEmailView`, `SendSetupEmailView`, `SetPasswordView` |
| `accounts/serializers.py` | New: `CheckEmailSerializer`, `SetPasswordSerializer` |
| `config/urls.py` | Add `programs` URLs, new registration and auth endpoints |
| `config/settings/base.py` | Add `programs` to `INSTALLED_APPS` |

### Frontend Changes

| Area | Change |
|------|--------|
| `App.jsx` | Add routes: `/register`, `/programs`, `/programs/:slug`, `/set-password` |
| `src/api/` | New: `programs.js`, `registration.js` |
| `src/pages/` | New: `RegisterPage.jsx` (two-step form), `SetPasswordPage.jsx` |
| `src/pages/programs/` | New: `ProgramListPage.jsx`, `ProgramDetailPage.jsx` |
| `src/pages/auth/LoginPage.jsx` | Modify for two-step email-first flow |
| `src/components/Navbar/` | Add "Programs" nav link, update "Get Started" CTA |

---

## Migration Plan

The existing `SigninProfile` model is a standalone model (no FK to User). The migration strategy:

1. **Keep `SigninProfile` as-is** — do not drop the table. Existing data remains accessible.
2. **Create `RegistrationProfile`** as a new model alongside it in the `signin` app.
3. **Optional management command** (`migrate_signin_profiles`) — matches existing `SigninProfile` records by email to User records, creates `RegistrationProfile` entries where possible. Run manually; not part of the Django migration.
4. **Deprecate `SigninProfile`** — remove the old view/serializer endpoints. The model stays until data is confirmed migrated.

## Email Configuration

The `send-setup-email` endpoint requires email sending capability. Required settings:

```python
# config/settings/base.py
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"  # or console for dev
DEFAULT_FROM_EMAIL = "noreply@algonex.com"
```

For development, use `django.core.mail.backends.console.EmailBackend` (prints to stdout).

**Email template content:**
- Subject: "Set up your Algonex password"
- Body: Brief message with a link to `{FRONTEND_URL}/set-password?token={token}&uid={uid_b64}`
- Token generated via Django's `PasswordResetTokenGenerator`, which auto-invalidates once password is set.
- Token expiry: controlled by `PASSWORD_RESET_TIMEOUT` setting (default 3 days).

## Testing Strategy

- **Models:** Field validation, computed properties, OneToOne relationship
- **Services:** `register_step1` (new user, existing user, existing with password), `register_step2` (create, update)
- **Selectors:** Filtering, annotations (registration_count), ordering
- **Views:** Full API integration tests for all endpoints, permission checks
- **Auth:** Token generation, expiry, password set flow, check-email edge cases

---

## Backend ↔ Frontend Communication

Backend and frontend are being implemented in parallel by separate agents. Use this section to coordinate.

### API Contract (source of truth)

All endpoint contracts are defined above in the "API Endpoints" section. Both agents must follow these exactly. If either agent needs to change a contract, update this spec first.

### Backend Status

| Component | Status | Notes |
|-----------|--------|-------|
| `programs` app (models, views, services, selectors) | done | |
| `signin` registration (RegistrationProfile, step1/step2 views) | done | |
| `accounts` auth (check-email, send-setup-email, set-password) | done | |
| Email configuration | done | console backend for dev |
| URL routing | done | |
| Tests | done | |
| Seed data (`seed_programs`) | done | |

### Frontend Status

| Component | Status | Notes |
|-----------|--------|-------|
| Registration page (two-step form) | pending | |
| Programs list/detail pages | pending | |
| Login page (two-step email-first) | pending | |
| Set password page | pending | |
| API modules (registration.js, programs.js) | pending | |

### Open Questions / Decisions Log

_Add items here when either agent needs input from the other._

| Date | From | Question | Resolution |
|------|------|----------|------------|
| | | | |

### Response Format Reference

All API responses follow the project standard:
```json
// Success
{ "status": "success", "data": { ... } }

// Error
{ "status": "error", "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

### Error Codes (for frontend to handle)

| Endpoint | Error Code | When |
|----------|-----------|------|
| `POST /register/step1/` | `INVALID_EMAIL` | Email format invalid |
| `POST /register/step2/` | `USER_NOT_FOUND` | Email from step1 doesn't exist |
| `POST /register/step2/` | `TERMS_NOT_AGREED` | terms_agreed is false |
| `POST /auth/check-email/` | `INVALID_EMAIL` | Email format invalid |
| `POST /auth/send-setup-email/` | `USER_NOT_FOUND` | Email doesn't exist |
| `POST /auth/send-setup-email/` | `PASSWORD_ALREADY_SET` | User already has a password |
| `POST /auth/set-password/` | `INVALID_TOKEN` | Token expired or invalid |
| `POST /auth/set-password/` | `PASSWORD_MISMATCH` | password != confirm_password |
