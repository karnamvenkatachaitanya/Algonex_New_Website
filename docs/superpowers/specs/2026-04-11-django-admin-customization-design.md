# Django Admin Customization Design

**Date:** 2026-04-11
**Status:** Approved
**Approach:** django-unfold theme + custom AdminSite with dashboard

## Goal

Customize the Django admin to make it easy for admins to manage courses, events, user registrations, and media uploads (multiple photos). Replace stock Django admin with a modern themed admin featuring a dashboard, organized sidebar navigation, enhanced list views, and image preview in media inlines.

## Architecture

### 1. Theme & Admin Site Setup

**Package:** `django-unfold`

**Dashboard callback** in `common/admin_site.py`:
- A `dashboard_callback(request, context)` function that injects stats and recent activity into the admin index context
- A custom `templates/admin/index.html` template that extends Unfold's base and renders stat cards, recent activity tables, and quick action links
- Branding configured via UNFOLD settings: `SITE_TITLE`, `SITE_HEADER`

**INSTALLED_APPS ordering** (critical): `"unfold"` must be placed **before** `"django.contrib.admin"` in INSTALLED_APPS for template overrides to work.

**ModelAdmin base class**: All ModelAdmin classes must extend `unfold.admin.ModelAdmin` instead of `django.contrib.admin.ModelAdmin` for Unfold's styling features to work. **Exception:** `accounts.UserAdmin` currently extends `django.contrib.auth.admin.UserAdmin` — it must use `unfold.contrib.auth.admin.UserAdmin` instead, to preserve auth-specific fieldsets, add_user form, and password change functionality.

**Approach note:** Unfold's modern settings-based approach (`UNFOLD` dict in settings.py) handles theming, sidebar navigation, and dashboard without requiring a custom `AdminSite` subclass or `site=` parameter on `@admin.register`. This is simpler and avoids re-registering every model. Standard `@admin.register(Model)` decorators work with Unfold's template overrides.

**Unfold config** in `settings/base.py`:
- `UNFOLD["DASHBOARD_CALLBACK"]` points to the dashboard function in `common/admin_site.py`
- Organized sidebar navigation with Material icons:
  - **Dashboard** (dashboard icon) — link to `/admin/`
  - **Courses** — Courses, Enrollments, Skills, Student Outcomes
  - **Events** — Events, Registrations
  - **Users & Signups** — Users, Signin Profiles, Registration Profiles
  - **Content** — Programs, Jobs, Applications, Case Studies, Tech Tags, Media
  - **Showcase** — Alumni Profiles, Student Projects
  - **Site Config** — Platform Settings, Carousel, Site Banner, Contact Submissions

**URL wiring:** No changes needed — Unfold overrides admin templates via INSTALLED_APPS ordering, using the standard `admin.site.urls`.

### 2. Dashboard

Uses Unfold's `dashboard_callback` function configured in `UNFOLD["DASHBOARD_CALLBACK"]` setting. The callback function returns a list of Unfold component dicts (stat cards, tables, action links) that Unfold renders into the dashboard template.

**Stat Cards (top row):**

| Card | Query | Display |
|------|-------|---------|
| Courses | `Course.objects.count()` | Total with published/draft breakdown |
| Events | `Event.objects.count()` | Total with upcoming/ongoing/past counts |
| Users | `User.objects.count()` | Total with role breakdown |
| Enrollments | `Enrollment.objects.count()` | Total active enrollments |

**Recent Activity Tables:**
- Last 10 event registrations (user, event, status, date)
- Last 10 course enrollments (student, course, status, date)
- Last 5 contact form submissions (name, subject, date)

**Quick Action Links:**
- Add New Course, Add New Event, Add New Program

### 3. ModelAdmin Enhancements

**Note:** All existing inlines (ModuleInline, CourseFAQInline, TestimonialInline, RegistrationInline, ApplicationInline, ScreenshotInline) are preserved. Enhancements are additive.

#### Courses App

**CourseAdmin:**
- `list_display`: name, instructor, level, price, is_published, is_trending, created_at
- `list_filter`: level, is_published, is_trending, skills
- `search_fields`: name, description, instructor__email
- `list_editable`: is_published, is_trending
- Existing inlines preserved: ModuleInline, CourseFAQInline, TestimonialInline

**EnrollmentAdmin:**
- `list_display`: student, course, status, enrolled_at
- `list_filter`: status, course
- `search_fields`: student__email, course__name

**StudentOutcomeAdmin** (already registered — preserve):
- No changes needed, keep existing configuration

**CourseReview** (register — currently missing from admin):
- `list_display`: student, course, rating, created_at
- `list_filter`: rating
- Readonly (no add/edit — student-submitted)

#### Events App

**EventAdmin:**
- `list_display`: title, event_type, start_date, location, capacity, is_published
- `list_filter`: event_type, is_published, start_date
- `search_fields`: title, description
- `list_editable`: is_published
- Existing inlines preserved: RegistrationInline
- Note: `spots_left` omitted from list_display — it's a property causing N+1 queries. Use `capacity` instead.

**RegistrationAdmin:**
- `list_display`: user, event, status, registered_at
- `list_filter`: status, event
- `search_fields`: user__email, event__title

#### Users & Signups

**UserAdmin** (modify existing — already has list_filter and search_fields):
- `list_filter`: role, is_active, date_joined (change: replace `is_staff` with `date_joined`)
- `search_fields`: email, first_name, last_name (already exists, no change)

**SigninProfileAdmin:**
- `list_display`: name, email, phone, college, course_interested, submitted_at
- `list_filter`: course_interested, employment_status
- `search_fields`: name, email, college

**RegistrationProfileAdmin** (preserve existing fields, add to them):
- `list_display`: user, interest_category, program, degree_level, employment_status, college, city, created_at
- `list_filter`: interest_category, degree_level, employment_status
- Preserve existing: `search_fields = ["user__email", "user__first_name", "college", "city"]`, `raw_id_fields = ["user", "program"]`

#### Careers App (preserve existing — enhance list views)

**JobAdmin:** Keep existing fieldsets and ApplicationInline. Add `list_display`, `list_filter`, `search_fields` if not already present.

**ApplicationAdmin:** Keep existing readonly_fields and raw_id_fields.

#### Portfolio App (preserve existing — enhance list views)

**CaseStudyAdmin:** Keep existing ScreenshotInline. Add search/filter if not present.
**TechTagAdmin:** No changes needed.

#### Showcase App (preserve existing)

**AlumniProfileAdmin, StudentProjectAdmin:** Keep existing configuration, just update base class to `unfold.admin.ModelAdmin`.

#### ContactForm App (preserve existing)

**ContactFormAdmin:** Keep existing configuration, update base class.

#### Media (common)

**MediaAdmin (standalone):**
- `list_display`: image_preview, caption, content_type, created_at
- `list_filter`: content_type

### 4. Media Upload (Multiple Photos)

The `Media` model with `GenericForeignKey` and `MediaInline` (`GenericTabularInline`) already exist.

**Enhancements:**
1. **Image preview** — readonly field rendering `<img>` thumbnail (max-height: 80px) in inline rows
2. **Extra rows** — `extra = 3` on MediaInline for 3 empty upload slots by default
3. **Attach MediaInline to:** CourseAdmin, EventAdmin, ProgramAdmin
4. **Ordering** — `ordering = ["order"]` on inline for admin-controlled display order
5. **Change `extra` from 1 to 3** — existing MediaInline has `extra = 1`, update to 3

**Migration needed:** Add `GenericRelation("common.Media")` to Program model (confirmed missing). Course and Event already have it.

## Files Modified

- `common/admin_site.py` — NEW: dashboard_callback function for admin index
- `templates/admin/index.html` — NEW: Custom dashboard template extending Unfold
- `common/admin.py` — Enhance MediaInline with image preview, update MediaAdmin, update base class
- `courses/admin.py` — Enhance CourseAdmin, register CourseReview, update base classes
- `events/admin.py` — Enhance EventAdmin, RegistrationAdmin, update base classes
- `accounts/admin.py` — Modify UserAdmin list_filter, update base class
- `signin/admin.py` — Enhance SigninProfileAdmin, preserve RegistrationProfileAdmin, update base classes
- `careers/admin.py` — Update base classes for JobAdmin, ApplicationAdmin
- `portfolio/admin.py` — Update base classes for CaseStudyAdmin, TechTagAdmin
- `showcase/admin.py` — Update base classes for AlumniProfileAdmin, StudentProjectAdmin
- `contactform/admin.py` — Update base class for ContactFormAdmin
- `config/settings/base.py` — Add `"unfold"` before `"django.contrib.admin"` in INSTALLED_APPS, add UNFOLD config
- `config/urls.py` — No changes needed (Unfold uses template overrides)
- `programs/models.py` — Add `media = GenericRelation("common.Media")` field
- `programs/admin.py` — Add MediaInline, update base class
- `requirements.txt` — Add django-unfold

## Dependencies

- `django-unfold` — Admin theme and dashboard components

## Out of Scope

- Custom React admin panel
- Drag-and-drop media reordering (order by number field is sufficient)
- WYSIWYG rich text editors
- Admin audit logging
