# Careers — External Job Listings Design Spec

**Date:** 2026-04-11
**Status:** Approved

## Overview

Extend the existing careers module to support **external job listings** — third-party opportunities that admins curate for students. External jobs link out to the company's application page instead of using the internal resume-upload pipeline.

The existing internal hiring system (Application model, pipeline, resume upload) remains fully intact for Algonex's own job postings.

## Goals

- Admins can create external job listings with a company name, logo, apply link, eligibility, and tags
- Students browse external opportunities in a dedicated "Opportunities" tab
- Clicking "Apply" on an external job opens the third-party link in a new tab — no login required
- Internal hiring ("Work with Us" tab) continues to work exactly as before
- Single Job model, single API, minimal changes

## Non-Goals

- Tracking applications to external jobs
- Scraping or syncing jobs from third-party sources
- Changing the Application model or hiring pipeline

---

## Model Changes

### Existing `Job` model — new fields added

All new fields are optional/blank-able to maintain backward compatibility with existing internal jobs.

```
Job (existing model — additions only)
│
├── apply_mode              (CharField, max_length=10, choices: "internal"/"external", default="internal", db_index=True)
│
├── External-only fields
│   ├── external_link       (URLField, blank=True)
│   ├── company_name        (CharField, max_length=255, blank=True)
│   ├── company_logo        (ImageField, upload_to="careers/logos/", blank=True, null=True)
│   ├── eligibility_criteria (TextField, blank=True)  — supports Markdown
│
├── Tags (usable by both modes)
│   └── tags                (TextField, blank=True)  — comma-separated, e.g. "Python, Django, Remote"
```

### Validation rules

- If `apply_mode="external"` → `external_link` required, `company_name` required
- If `apply_mode="internal"` → `external_link` and `company_name` ignored (can be blank)
- `submit_application` service rejects applications to external jobs with error code `EXTERNAL_JOB`
- Existing internal jobs default to `apply_mode="internal"` — no migration data changes needed

**Validation lives in two places:**
- `Job.clean()` — model-level validation for admin/shell safety. Raises `ValidationError` if `apply_mode="external"` and `external_link` or `company_name` is blank.
- `JobCreateUpdateSerializer.validate()` — API-level validation with proper DRF error formatting.

**`company_logo` validation:** Accept common image formats (JPEG, PNG, WebP), max 2MB. Pillow is already in requirements.

### What stays unchanged

- `Application` model — untouched
- `submit_application()` service — adds one guard check for `apply_mode`
- `transition_application()` service — untouched
- All existing tests pass without modification (internal is the default)

---

## API Changes

### Modified endpoints

**GET /api/v1/careers/**

New filter param: `?apply_mode=internal|external`

Response adds new fields to each job object:
- `apply_mode` (string)
- `company_name` (string, empty for internal)
- `company_logo` (URL or null)
- `tags` (string)

**GET /api/v1/careers/:slug/**

Response adds:
- `apply_mode`, `external_link`, `company_name`, `company_logo`, `eligibility_criteria`, `tags`

**POST /api/v1/careers/:slug/apply/**

Now rejects external jobs:
```json
{
  "status": "error",
  "error": {
    "code": "EXTERNAL_JOB",
    "message": "This is an external listing. Apply via the external link."
  }
}
```
Status: 400

**POST/PATCH /api/v1/careers/ (admin)**

Accepts all new fields. Conditional validation enforced via serializer `validate()` method.

### No new endpoints

The existing `JobViewSet` and `JobFilter` are extended — no new views or URL patterns.

### Filter changes

`JobFilter` gains one new filter:
```
apply_mode = django_filters.ChoiceFilter(choices=[("internal", "Internal"), ("external", "External")])
```

### Serializer changes

| Serializer | New fields added |
|-----------|-----------------|
| `JobListSerializer` | `apply_mode`, `company_name`, `company_logo`, `tags` |
| `JobDetailSerializer` | `apply_mode`, `external_link`, `company_name`, `company_logo`, `eligibility_criteria`, `tags` |
| `JobCreateUpdateSerializer` | All new fields + `validate()` for conditional requirements |

---

## Service Changes

### `submit_application()` — one guard added

Before checking if the job is active, check:
```python
if job.apply_mode == "external":
    raise ExternalJob()
```

New exception in `careers/exceptions.py`:
```python
class ExternalJob(APIException):
    status_code = 400
    default_detail = "This is an external listing. Apply via the external link."
    default_code = "EXTERNAL_JOB"
```

### Everything else unchanged

- `transition_application()` — no change
- All selectors unchanged — `get_active_jobs()` returns all active jobs. The `apply_mode` filtering is handled by `JobFilter` (django-filter) in the view layer, NOT by the selector. Do not add `apply_mode` filtering to the selector.

---

## Frontend Changes

### JobListPage — two-tab layout

```
Tab 1: "Opportunities" (default)  → GET /careers/?apply_mode=external
Tab 2: "Work with Us"             → GET /careers/?apply_mode=internal
```

- Ant Design `Tabs` component for switching
- Same filters (search, department, job type) apply to both tabs
- External job cards show: company_logo, title, company_name, tags, location, job_type, deadline
- Internal job cards: existing design unchanged

### JobDetailPage — mode-aware

```
If apply_mode == "external":
  - Show company logo + company name in header
  - Description + eligibility_criteria sections (NOT requirements)
  - "Apply on [Company Name]" button → window.open(external_link, "_blank")
  - No login required

If apply_mode == "internal":
  - Existing behavior unchanged
  - Description + requirements sections (NOT eligibility_criteria)
  - "Apply Now" → resume upload modal
  - Requires authentication

Note: Internal jobs use `requirements`, external jobs use `eligibility_criteria`. Both are TextField/markdown but serve different audiences — `requirements` is for job qualifications, `eligibility_criteria` is for student eligibility.
```

### MyApplicationsPage — unchanged

Only shows internal applications. No changes needed.

### Routes — unchanged

```
/careers         → JobListPage (with tabs)
/careers/:slug   → JobDetailPage (adapts to apply_mode)
/my-applications → MyApplicationsPage
```

### API module changes

`careers.js` — no new functions needed. Existing `list(params)` and `detail(slug)` work with the new `apply_mode` filter param.

---

## Admin Changes

### Job admin — updated

- `list_display` adds: `apply_mode`, `company_name`
- `list_filter` adds: `apply_mode`
- Form groups external-only fields under a collapsible "External Listing" fieldset
- Override `get_inlines()` to exclude `ApplicationInline` when `apply_mode="external"` (applications are meaningless for external jobs)

---

## Seed Data

Add 3-4 sample external job listings to the existing `seed_careers` command:

```
- "Frontend Developer" at TCS (external, full_time)
- "Data Science Intern" at Infosys (external, internship)
- "Cloud Engineer" at Wipro (external, full_time)
- "UI/UX Designer" at Zoho (external, contract)
```

---

## Testing Strategy

- **Model:** Validation for conditional required fields (external_link + company_name when external)
- **Services:** `submit_application` rejects external jobs
- **Views:** Filter by `apply_mode`, create external job via admin API, retrieve with new fields
- **Backward compatibility:** All existing tests pass unchanged (internal is default)

---

## Backend ↔ Frontend Communication

### Backend Status

| Component | Status | Notes |
|-----------|--------|-------|
| Model migration (new fields) | done | |
| Serializer updates | done | |
| Filter update | done | |
| Service guard (ExternalJob) | done | |
| Admin updates | done | |
| Seed data | done | |
| Tests | done | |

### Frontend Status

| Component | Status | Notes |
|-----------|--------|-------|
| JobListPage tabs | pending | |
| JobDetailPage mode-aware | pending | |
| Card component for external jobs | pending | |

### Error Codes

| Endpoint | Error Code | When |
|----------|-----------|------|
| `POST /careers/:slug/apply/` | `EXTERNAL_JOB` | Trying to apply to an external listing |
