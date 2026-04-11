# Careers External Job Listings — Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add external job listing support to the existing careers module — new fields on Job model, guard in submit_application, filter/serializer/admin updates.

**Architecture:** Extend the existing `Job` model with `apply_mode` discriminator + external-only fields. No new models, endpoints, or URL patterns. The `JobFilter` handles `apply_mode` filtering; the `submit_application` service rejects external jobs.

**Tech Stack:** Django 5.2, DRF 3.15, django-filter, pytest

**Spec:** `docs/superpowers/specs/2026-04-11-careers-external-listings-design.md`

---

## File Structure

### Modified files

```
careers/models.py       → Add apply_mode, external_link, company_name, company_logo, eligibility_criteria, tags + clean() update
careers/services.py     → Add ExternalJob guard in submit_application
careers/exceptions.py   → Add ExternalJob exception
careers/serializers.py  → Update JobListSerializer, JobDetailSerializer, JobCreateUpdateSerializer
careers/filters.py      → Add apply_mode filter
careers/admin.py        → Add fields to JobAdmin, conditional inlines
careers/tests/test_services.py → Add test for external job guard
careers/tests/test_api.py      → Add tests for external job CRUD, filtering, apply rejection
careers/management/commands/seed_careers.py → Add external job seed data
```

---

## Chunk 1: Model, Service, and Exception Changes

### Task 1: Add ExternalJob Exception

**Files:**
- Modify: `algonex-backend/careers/exceptions.py`

- [ ] **Step 1: Add ExternalJob exception**

Add to end of `algonex-backend/careers/exceptions.py`:
```python
class ExternalJob(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This is an external listing. Apply via the external link."
    default_code = "EXTERNAL_JOB"
```

- [ ] **Step 2: Commit**

```bash
git add careers/exceptions.py
git commit -m "feat(careers): add ExternalJob exception"
```

---

### Task 2: Add New Fields to Job Model

**Files:**
- Modify: `algonex-backend/careers/models.py`

- [ ] **Step 1: Add fields and update clean()**

Add these to the `Job` model in `algonex-backend/careers/models.py`:

After `JOB_TYPE_CHOICES`, add:
```python
    APPLY_MODE_CHOICES = [
        ("internal", "Internal"),
        ("external", "External"),
    ]
```

After `deadline` field, add:
```python
    # Apply mode — internal (resume upload) or external (third-party link)
    apply_mode = models.CharField(
        max_length=10, choices=APPLY_MODE_CHOICES, default="internal", db_index=True
    )

    # External listing fields (only used when apply_mode="external")
    external_link = models.URLField(blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    company_logo = models.ImageField(upload_to="careers/logos/", blank=True, null=True)
    eligibility_criteria = models.TextField(blank=True, help_text="Markdown eligibility for external listings")
    tags = models.TextField(blank=True, help_text="Comma-separated tags, e.g. 'Python, Django, Remote'")
```

Update `clean()` to add external validation:
```python
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.salary_min and self.salary_max and self.salary_min > self.salary_max:
            raise ValidationError("Minimum salary cannot exceed maximum salary.")
        if self.apply_mode == "external":
            if not self.external_link:
                raise ValidationError({"external_link": "External link is required for external listings."})
            if not self.company_name:
                raise ValidationError({"company_name": "Company name is required for external listings."})
```

- [ ] **Step 2: Run makemigrations and migrate**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 manage.py makemigrations careers
python3.11 manage.py migrate
```

- [ ] **Step 3: Run existing tests to confirm backward compatibility**

```bash
python3.11 -m pytest careers/ -v
```
Expected: All existing tests PASS (internal is default).

- [ ] **Step 4: Commit**

```bash
git add careers/models.py careers/migrations/
git commit -m "feat(careers): add apply_mode and external listing fields to Job model"
```

---

### Task 3: Add ExternalJob Guard to Service + Tests

**Files:**
- Modify: `algonex-backend/careers/services.py`
- Modify: `algonex-backend/careers/tests/test_services.py`

- [ ] **Step 1: Write failing test**

Add to `algonex-backend/careers/tests/test_services.py` in `TestSubmitApplication`:
```python
    def test_external_job_raises(self):
        from careers.exceptions import ExternalJob
        job = _create_job(
            title="External Dev",
            apply_mode="external",
            external_link="https://example.com/apply",
            company_name="TCS",
        )
        with self.assertRaises(ExternalJob):
            submit_application(applicant=self.user, job=job, resume=_dummy_resume())
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python3.11 -m pytest careers/tests/test_services.py::TestSubmitApplication::test_external_job_raises -v
```
Expected: FAIL — `ExternalJob` not raised.

- [ ] **Step 3: Add guard to submit_application**

In `algonex-backend/careers/services.py`, update imports:
```python
from .exceptions import AlreadyApplied, JobNotActive, InvalidTransition, ExternalJob
```

Add as the **first check** in `submit_application`, before the `is_active` check:
```python
def submit_application(*, applicant, job, resume, cover_letter=""):
    """Submit an application to an active job."""
    if job.apply_mode == "external":
        raise ExternalJob()

    if not job.is_active:
        raise JobNotActive()
    # ... rest unchanged
```

- [ ] **Step 4: Run test to verify it passes**

```bash
python3.11 -m pytest careers/tests/test_services.py -v
```
Expected: All PASS including new test.

- [ ] **Step 5: Commit**

```bash
git add careers/services.py careers/tests/test_services.py
git commit -m "feat(careers): reject applications to external jobs in submit_application"
```

---

## Chunk 2: Serializer, Filter, Admin, and View Tests

### Task 4: Update Serializers

**Files:**
- Modify: `algonex-backend/careers/serializers.py`

- [ ] **Step 1: Update JobListSerializer**

Add new fields to `JobListSerializer.Meta.fields`:
```python
class JobListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id", "title", "slug", "department", "job_type", "location",
            "is_remote", "salary_min", "salary_max", "deadline", "created_at",
            "apply_mode", "company_name", "company_logo", "tags",
        ]
```

- [ ] **Step 2: Update JobDetailSerializer**

Add new fields:
```python
class JobDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id", "title", "slug", "department", "job_type", "location",
            "is_remote", "description", "requirements",
            "salary_min", "salary_max", "deadline", "created_at",
            "apply_mode", "external_link", "company_name", "company_logo",
            "eligibility_criteria", "tags",
        ]
```

- [ ] **Step 3: Update JobCreateUpdateSerializer with conditional validation**

```python
class JobCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "title", "department", "job_type", "location", "is_remote",
            "description", "requirements", "salary_min", "salary_max",
            "is_active", "deadline",
            "apply_mode", "external_link", "company_name", "company_logo",
            "eligibility_criteria", "tags",
        ]

    def validate(self, data):
        apply_mode = data.get("apply_mode", "internal")
        if apply_mode == "external":
            if not data.get("external_link"):
                raise serializers.ValidationError({"external_link": "Required for external listings."})
            if not data.get("company_name"):
                raise serializers.ValidationError({"company_name": "Required for external listings."})
        return data
```

- [ ] **Step 4: Commit**

```bash
git add careers/serializers.py
git commit -m "feat(careers): add external listing fields to serializers with conditional validation"
```

---

### Task 5: Update Filter

**Files:**
- Modify: `algonex-backend/careers/filters.py`

- [ ] **Step 1: Add apply_mode filter**

```python
import django_filters
from .models import Job


class JobFilter(django_filters.FilterSet):
    department = django_filters.ChoiceFilter(choices=Job.DEPARTMENT_CHOICES)
    job_type = django_filters.ChoiceFilter(choices=Job.JOB_TYPE_CHOICES)
    is_remote = django_filters.BooleanFilter()
    search = django_filters.CharFilter(field_name="title", lookup_expr="icontains")
    apply_mode = django_filters.ChoiceFilter(choices=Job.APPLY_MODE_CHOICES)

    class Meta:
        model = Job
        fields = ["department", "job_type", "is_remote", "apply_mode"]
```

- [ ] **Step 2: Commit**

```bash
git add careers/filters.py
git commit -m "feat(careers): add apply_mode filter to JobFilter"
```

---

### Task 6: Update Admin

**Files:**
- Modify: `algonex-backend/careers/admin.py`

- [ ] **Step 1: Update JobAdmin**

Replace `algonex-backend/careers/admin.py`:
```python
from django.contrib import admin
from .models import Job, Application


class ApplicationInline(admin.TabularInline):
    model = Application
    extra = 0
    readonly_fields = ("applied_at", "updated_at")


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("title", "apply_mode", "department", "job_type", "location", "is_remote", "is_active", "company_name")
    list_filter = ("apply_mode", "department", "job_type", "is_active", "is_remote")
    search_fields = ("title", "description", "company_name")
    prepopulated_fields = {"slug": ("title",)}

    fieldsets = (
        (None, {
            "fields": (
                "title", "slug", "apply_mode", "department", "job_type",
                "location", "is_remote", "description", "requirements",
                "salary_min", "salary_max", "is_active", "deadline", "tags",
            ),
        }),
        ("External Listing", {
            "classes": ("collapse",),
            "fields": ("external_link", "company_name", "company_logo", "eligibility_criteria"),
            "description": "Only used when Apply Mode is 'External'.",
        }),
    )

    def get_inlines(self, request, obj=None):
        if obj and obj.apply_mode == "external":
            return []
        return [ApplicationInline]


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("applicant", "job", "status", "applied_at")
    list_filter = ("status",)
    search_fields = ("applicant__email", "job__title")
    readonly_fields = ("applied_at", "updated_at")
```

- [ ] **Step 2: Commit**

```bash
git add careers/admin.py
git commit -m "feat(careers): update admin with external listing fieldset and conditional inlines"
```

---

### Task 7: View Integration Tests for External Jobs

**Files:**
- Modify: `algonex-backend/careers/tests/test_api.py`

- [ ] **Step 1: Add external job test helpers and tests**

Add these test classes to `algonex-backend/careers/tests/test_api.py`. First read the existing file to understand the helper function pattern, then add at the bottom:

```python
class TestExternalJobListing(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.external_job = Job.objects.create(
            title="Frontend Dev at TCS",
            department="engineering",
            job_type="full_time",
            location="Mumbai",
            description="Build UIs",
            requirements="React, JS",
            is_active=True,
            apply_mode="external",
            external_link="https://careers.tcs.com/frontend",
            company_name="TCS",
            tags="React, JavaScript, Frontend",
        )
        self.internal_job = Job.objects.create(
            title="Internal Dev",
            department="engineering",
            job_type="full_time",
            location="Hyderabad",
            description="Build things",
            requirements="Python",
            is_active=True,
            apply_mode="internal",
        )

    def test_list_all_jobs(self):
        response = self.client.get("/api/v1/careers/")
        results = response.json()["data"]["results"]
        self.assertEqual(len(results), 2)

    def test_filter_external_only(self):
        response = self.client.get("/api/v1/careers/?apply_mode=external")
        results = response.json()["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["apply_mode"], "external")
        self.assertEqual(results[0]["company_name"], "TCS")

    def test_filter_internal_only(self):
        response = self.client.get("/api/v1/careers/?apply_mode=internal")
        results = response.json()["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["apply_mode"], "internal")

    def test_external_detail_has_link(self):
        response = self.client.get(f"/api/v1/careers/{self.external_job.slug}/")
        data = response.json()["data"]
        self.assertEqual(data["external_link"], "https://careers.tcs.com/frontend")
        self.assertEqual(data["company_name"], "TCS")
        self.assertEqual(data["tags"], "React, JavaScript, Frontend")

    def test_apply_to_external_rejected(self):
        user = User.objects.create_user(email="student@test.com", password="pass123")
        self.client.force_authenticate(user)
        resume = SimpleUploadedFile("resume.pdf", b"fake pdf", content_type="application/pdf")
        response = self.client.post(
            f"/api/v1/careers/{self.external_job.slug}/apply/",
            {"resume": resume},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "EXTERNAL_JOB")


class TestExternalJobAdmin(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.com", password="pass123", role="admin"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_create_external_job(self):
        response = self.client.post("/api/v1/careers/", {
            "title": "Data Analyst at Infosys",
            "department": "engineering",
            "job_type": "internship",
            "location": "Bangalore",
            "description": "Analyze data",
            "requirements": "SQL, Python",
            "apply_mode": "external",
            "external_link": "https://careers.infosys.com/data",
            "company_name": "Infosys",
            "tags": "SQL, Python, Data",
        })
        self.assertEqual(response.status_code, 201)

    def test_create_external_missing_link_rejected(self):
        response = self.client.post("/api/v1/careers/", {
            "title": "Missing Link Job",
            "department": "engineering",
            "job_type": "full_time",
            "location": "Remote",
            "description": "Test",
            "requirements": "Test",
            "apply_mode": "external",
            "company_name": "SomeCompany",
            # external_link missing
        })
        self.assertEqual(response.status_code, 400)

    def test_create_external_missing_company_rejected(self):
        response = self.client.post("/api/v1/careers/", {
            "title": "Missing Company Job",
            "department": "engineering",
            "job_type": "full_time",
            "location": "Remote",
            "description": "Test",
            "requirements": "Test",
            "apply_mode": "external",
            "external_link": "https://example.com",
            # company_name missing
        })
        self.assertEqual(response.status_code, 400)
```

Note: You need to ensure `User` and `SimpleUploadedFile` are imported at the top of the test file (they likely already are from existing tests).

- [ ] **Step 2: Run all career tests**

```bash
python3.11 -m pytest careers/ -v
```
Expected: All PASS (existing + new).

- [ ] **Step 3: Commit**

```bash
git add careers/tests/test_api.py
git commit -m "test(careers): add external job listing integration tests"
```

---

## Chunk 3: Seed Data and Final Integration

### Task 8: Add External Jobs to Seed Command

**Files:**
- Modify: `algonex-backend/careers/management/commands/seed_careers.py`

- [ ] **Step 1: Read the existing seed command**

Read `algonex-backend/careers/management/commands/seed_careers.py` to understand the structure.

- [ ] **Step 2: Add external job seed data**

Add these entries to the `JOBS` list (or equivalent) in the seed command:
```python
    {
        "title": "Frontend Developer",
        "department": "engineering",
        "job_type": "full_time",
        "location": "Mumbai",
        "is_remote": False,
        "description": "## About the Role\n\nBuild user-facing web applications using React and modern JavaScript...",
        "requirements": "3+ years React experience",
        "apply_mode": "external",
        "external_link": "https://careers.tcs.com/frontend-dev",
        "company_name": "TCS",
        "tags": "React, JavaScript, Frontend",
        "eligibility_criteria": "## Eligibility\n\n- B.Tech/MCA in CS or related\n- Strong JavaScript fundamentals",
    },
    {
        "title": "Data Science Intern",
        "department": "engineering",
        "job_type": "internship",
        "location": "Bangalore",
        "is_remote": True,
        "description": "## About the Role\n\nWork on real-world data science projects with mentorship...",
        "requirements": "Python, pandas basics",
        "apply_mode": "external",
        "external_link": "https://careers.infosys.com/data-intern",
        "company_name": "Infosys",
        "tags": "Python, Data Science, ML",
        "eligibility_criteria": "## Eligibility\n\n- Currently pursuing B.Tech/M.Tech\n- Basic Python and statistics",
    },
    {
        "title": "Cloud Engineer",
        "department": "engineering",
        "job_type": "full_time",
        "location": "Hyderabad",
        "is_remote": False,
        "description": "## About the Role\n\nDesign and manage cloud infrastructure on AWS...",
        "requirements": "AWS, Docker, Kubernetes",
        "apply_mode": "external",
        "external_link": "https://careers.wipro.com/cloud-engineer",
        "company_name": "Wipro",
        "tags": "AWS, DevOps, Cloud",
        "eligibility_criteria": "## Eligibility\n\n- B.Tech in CS/IT\n- Linux and networking basics",
    },
    {
        "title": "UI/UX Designer",
        "department": "design",
        "job_type": "contract",
        "location": "Chennai",
        "is_remote": True,
        "description": "## About the Role\n\nCreate beautiful, user-centered designs for enterprise products...",
        "requirements": "Figma, design systems",
        "apply_mode": "external",
        "external_link": "https://careers.zoho.com/ux-designer",
        "company_name": "Zoho",
        "tags": "UI/UX, Figma, Design",
        "eligibility_criteria": "## Eligibility\n\n- Any degree with design portfolio\n- Proficiency in Figma or Sketch",
    },
```

Ensure the seed command handles the new fields (it should since `Job.objects.create(**data)` passes all kwargs). The existing idempotent check (`filter(title=...)`) ensures no duplicates.

- [ ] **Step 3: Run seed command**

```bash
python3.11 manage.py seed_careers
```
Expected: 4 new external jobs created.

- [ ] **Step 4: Commit**

```bash
git add careers/management/commands/seed_careers.py
git commit -m "feat(careers): add external job listings to seed data"
```

---

### Task 9: Full Integration Test Run

- [ ] **Step 1: Run the full test suite**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest -v
```
Expected: All tests pass (existing 153 + new careers tests).

- [ ] **Step 2: Update spec backend status**

Update the Backend Status table in `docs/superpowers/specs/2026-04-11-careers-external-listings-design.md` — change all "pending" to "done".

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-11-careers-external-listings-design.md
git commit -m "docs: update careers external listings spec backend status to complete"
```
