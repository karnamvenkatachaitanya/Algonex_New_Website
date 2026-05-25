# Backend: Showcase Features + DevOps — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add StudentOutcome, AlumniProfile, and StudentProject models/APIs to the backend, fix ContactForm gaps, and set up CI/CD + Caddy for production deployment.

**Architecture:** Follows the existing 4-layer pattern (views -> services -> selectors -> models). New `showcase` app for alumni/projects. StudentOutcome lives in the `courses` app (alongside Testimonial). All endpoints are public read-only. Admin manages data via Django admin. TDD throughout.

**Tech Stack:** Django 5.2, DRF 3.15, pytest, factory-boy, GitHub Actions, Caddy 2, Docker Compose

**Spec reference:** `docs/superpowers/specs/2026-04-05-futuristic-website-features-design.md`

**IMPORTANT:** This plan touches ONLY `algonex-backend/`, root DevOps files, and docs. It does NOT touch `algonex-frontend/` at all — a separate plan handles frontend work in parallel.

---

## Chunk 1: StudentOutcome Model + API

### Task 1: StudentOutcome Model

**Files:**
- Modify: `algonex-backend/courses/models.py`
- Modify: `algonex-backend/courses/admin.py`

- [ ] **Step 1: Add StudentOutcome model to courses/models.py**

Append after the `Testimonial` class (line 163):

```python
class StudentOutcome(TimestampMixin, models.Model):
    """Published student achievement for the outcomes ticker."""

    class AchievementType(models.TextChoices):
        PLACED = "placed", "Placed"
        PROMOTED = "promoted", "Promoted"
        FREELANCING = "freelancing", "Freelancing"
        PROJECT_LAUNCHED = "project_launched", "Project Launched"

    student_name = models.CharField(max_length=100)
    achievement_type = models.CharField(max_length=30, choices=AchievementType.choices)
    company_name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=100, blank=True)
    package_range = models.CharField(max_length=50, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="outcomes")
    achieved_at = models.DateField()
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-achieved_at"]

    def __str__(self):
        return f"{self.student_name} - {self.get_achievement_type_display()} at {self.company_name}"
```

- [ ] **Step 2: Register StudentOutcome in admin**

In `algonex-backend/courses/admin.py`, add the import and registration:

```python
# Add StudentOutcome to the import from .models
from .models import Course, Module, Topic, Skill, Enrollment, CourseFAQ, Testimonial, StudentOutcome

# Add after EnrollmentAdmin class:
@admin.register(StudentOutcome)
class StudentOutcomeAdmin(admin.ModelAdmin):
    list_display = ("student_name", "achievement_type", "company_name", "course", "achieved_at", "is_published")
    list_filter = ("achievement_type", "course", "is_published")
    search_fields = ("student_name", "company_name", "role")
    list_editable = ("is_published",)
```

- [ ] **Step 3: Create and run migration**

Run:
```bash
cd algonex-backend && python3.11 manage.py makemigrations courses
```
Expected: Migration file created for StudentOutcome.

```bash
cd algonex-backend && python3.11 manage.py migrate
```
Expected: Migration applied successfully.

- [ ] **Step 4: Run existing tests to confirm no regression**

Run: `cd algonex-backend && python3.11 -m pytest -v`
Expected: All 91 existing tests PASS.

- [ ] **Step 5: Commit**

```bash
cd algonex-backend && git add courses/models.py courses/admin.py courses/migrations/
git commit -m "feat(courses): add StudentOutcome model and admin registration"
```

---

### Task 2: StudentOutcome Tests

**Files:**
- Create: `algonex-backend/courses/tests/test_outcomes.py`

- [ ] **Step 1: Write model + API tests**

```python
import pytest
from datetime import date, timedelta
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from courses.models import Course, StudentOutcome


class TestStudentOutcomeModel(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            email="instructor@test.com", password="testpass123", role="instructor"
        )
        self.course = Course.objects.create(
            instructor=self.instructor,
            name="Python Full Stack",
            description="Learn Python",
            duration="12 weeks",
            price=24999,
            is_published=True,
        )

    def test_create_outcome(self):
        outcome = StudentOutcome.objects.create(
            student_name="Rahul S.",
            achievement_type="placed",
            company_name="Infosys",
            role="Full Stack Developer",
            package_range="6-8 LPA",
            course=self.course,
            achieved_at=date.today(),
            is_published=True,
        )
        assert outcome.student_name == "Rahul S."
        assert str(outcome) == "Rahul S. - Placed at Infosys"

    def test_ordering_by_achieved_at_desc(self):
        StudentOutcome.objects.create(
            student_name="A", achievement_type="placed", course=self.course,
            achieved_at=date.today() - timedelta(days=10), is_published=True,
        )
        StudentOutcome.objects.create(
            student_name="B", achievement_type="promoted", course=self.course,
            achieved_at=date.today(), is_published=True,
        )
        outcomes = StudentOutcome.objects.all()
        assert outcomes[0].student_name == "B"
        assert outcomes[1].student_name == "A"


class TestOutcomesAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="instructor@test.com", password="testpass123", role="instructor"
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="Python Full Stack",
            description="Learn Python", duration="12 weeks", price=24999, is_published=True,
        )
        self.published = StudentOutcome.objects.create(
            student_name="Rahul S.", achievement_type="placed",
            company_name="Infosys", role="Full Stack Developer",
            package_range="6-8 LPA", course=self.course,
            achieved_at=date.today(), is_published=True,
        )
        self.unpublished = StudentOutcome.objects.create(
            student_name="Hidden", achievement_type="placed",
            company_name="Secret", course=self.course,
            achieved_at=date.today(), is_published=False,
        )

    def test_list_outcomes_returns_only_published(self):
        response = self.client.get("/api/v1/outcomes/")
        assert response.status_code == 200
        assert response.data["status"] == "success"
        results = response.data["data"]["results"]
        assert len(results) == 1
        assert results[0]["student_name"] == "Rahul S."

    def test_list_outcomes_includes_course_info(self):
        response = self.client.get("/api/v1/outcomes/")
        result = response.data["data"]["results"][0]
        assert result["course"]["name"] == "Python Full Stack"
        assert result["course"]["slug"] == "python-full-stack"

    def test_filter_by_course_slug(self):
        other_course = Course.objects.create(
            instructor=self.instructor, name="MERN Stack",
            description="Learn MERN", duration="10 weeks", price=22999, is_published=True,
        )
        StudentOutcome.objects.create(
            student_name="Other", achievement_type="placed",
            company_name="TCS", course=other_course,
            achieved_at=date.today(), is_published=True,
        )
        response = self.client.get("/api/v1/outcomes/", {"course": "python-full-stack"})
        results = response.data["data"]["results"]
        assert len(results) == 1
        assert results[0]["student_name"] == "Rahul S."

    def test_outcomes_no_auth_required(self):
        """Outcomes endpoint is public — no authentication needed."""
        response = self.client.get("/api/v1/outcomes/")
        assert response.status_code == 200
```

- [ ] **Step 2: Run tests — expect failures (endpoints don't exist yet)**

Run: `cd algonex-backend && python3.11 -m pytest courses/tests/test_outcomes.py -v`
Expected: FAIL — URL not found / 404.

- [ ] **Step 3: Commit test file**

```bash
cd algonex-backend && git add courses/tests/test_outcomes.py
git commit -m "test(courses): add StudentOutcome model and API tests"
```

---

### Task 3: StudentOutcome Selector + Serializer + View + URL

**Files:**
- Modify: `algonex-backend/courses/selectors.py`
- Modify: `algonex-backend/courses/serializers.py`
- Modify: `algonex-backend/courses/views.py`
- Modify: `algonex-backend/courses/urls.py`

- [ ] **Step 1: Add selector in courses/selectors.py**

Add to imports and append function:

```python
# Add to imports at top:
from .models import Course, Enrollment, StudentOutcome

# Append after get_student_enrollments:
def get_published_outcomes(*, course_slug=None):
    """Return published student outcomes, optionally filtered by course slug."""
    qs = StudentOutcome.objects.filter(is_published=True).select_related("course")
    if course_slug:
        qs = qs.filter(course__slug=course_slug)
    return qs
```

- [ ] **Step 2: Add serializer in courses/serializers.py**

Add to imports and append:

```python
# Add StudentOutcome to the import from .models
from .models import Course, Module, Topic, Skill, Enrollment, CourseFAQ, Testimonial, CourseReview, StudentOutcome

# Append after EnrollmentSerializer:
class OutcomeCourseSerializer(serializers.ModelSerializer):
    """Lightweight course info for outcome listings."""
    class Meta:
        model = Course
        fields = ["name", "slug"]


class StudentOutcomeSerializer(serializers.ModelSerializer):
    course = OutcomeCourseSerializer(read_only=True)

    class Meta:
        model = StudentOutcome
        fields = [
            "id", "student_name", "achievement_type", "company_name",
            "role", "package_range", "course", "achieved_at",
        ]
```

- [ ] **Step 3: Add view in courses/views.py**

Add import and view class. Check existing imports first, then add:

```python
# Add to imports:
from .selectors import get_published_outcomes
from .serializers import StudentOutcomeSerializer

# Append after EnrollmentViewSet:
class OutcomePagination(StandardPagination):
    page_size = 20


class StudentOutcomeViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Public read-only endpoint for published student outcomes."""
    serializer_class = StudentOutcomeSerializer
    permission_classes = [AllowAny]
    pagination_class = OutcomePagination

    def get_queryset(self):
        course_slug = self.request.query_params.get("course")
        return get_published_outcomes(course_slug=course_slug)
```

**IMPORTANT:** `AllowAny` is NOT currently imported in `courses/views.py`. The existing import is:
```python
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
```
You MUST change it to:
```python
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
```

- [ ] **Step 4: Add URL in courses/urls.py**

```python
# Add to imports:
from .views import CourseViewSet, ModuleViewSet, TopicViewSet, EnrollmentViewSet, CourseFAQViewSet, StudentOutcomeViewSet

# Add to router registrations (after enrollments):
router.register(r"outcomes", StudentOutcomeViewSet, basename="outcome")
```

- [ ] **Step 5: Run outcome tests — all should pass now**

Run: `cd algonex-backend && python3.11 -m pytest courses/tests/test_outcomes.py -v`
Expected: All 5 tests PASS.

- [ ] **Step 6: Run full test suite**

Run: `cd algonex-backend && python3.11 -m pytest -v`
Expected: All tests PASS (91 existing + 5 new).

- [ ] **Step 7: Commit**

```bash
cd algonex-backend && git add courses/selectors.py courses/serializers.py courses/views.py courses/urls.py
git commit -m "feat(courses): add StudentOutcome API endpoint with selector, serializer, and view"
```

---

## Chunk 2: Showcase App (AlumniProfile + StudentProject)

### Task 4: Scaffold showcase app

**Files:**
- Create: `algonex-backend/showcase/` (entire app)
- Modify: `algonex-backend/config/settings/base.py`

- [ ] **Step 1: Create the app scaffold**

Run:
```bash
cd algonex-backend && python3.11 manage.py startapp showcase
```

- [ ] **Step 2: Create `__init__.py` in tests directory**

```bash
cd algonex-backend && mkdir -p showcase/tests && touch showcase/tests/__init__.py
```

Delete the auto-generated `showcase/tests.py` (we use `showcase/tests/` directory instead):
```bash
rm algonex-backend/showcase/tests.py
```

- [ ] **Step 3: Add to INSTALLED_APPS**

In `algonex-backend/config/settings/base.py`, add `"showcase"` after `"programs"` in INSTALLED_APPS:

```python
    "programs",
    "showcase",
```

- [ ] **Step 4: Update apps.py**

Replace `algonex-backend/showcase/apps.py`:

```python
from django.apps import AppConfig


class ShowcaseConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "showcase"
```

- [ ] **Step 5: Commit scaffold**

```bash
cd algonex-backend && git add showcase/ config/settings/base.py
git commit -m "feat(showcase): scaffold showcase app and add to INSTALLED_APPS"
```

---

### Task 5: Showcase Models

**Files:**
- Modify: `algonex-backend/showcase/models.py`
- Modify: `algonex-backend/showcase/admin.py`

- [ ] **Step 1: Write models**

Replace `algonex-backend/showcase/models.py`:

```python
from django.db import models
from common.mixins import TimestampMixin, SlugMixin


class AlumniProfile(TimestampMixin, models.Model):
    """Published alumni profile for the alumni wall."""

    name = models.CharField(max_length=100)
    avatar = models.ImageField(upload_to="alumni/avatars/", blank=True)
    course = models.ForeignKey(
        "courses.Course", on_delete=models.CASCADE, related_name="alumni"
    )
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


class StudentProject(TimestampMixin, SlugMixin, models.Model):
    """Published student project for the projects gallery."""

    title = models.CharField(max_length=200)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to="projects/thumbnails/")
    student_name = models.CharField(max_length=100)
    course = models.ForeignKey(
        "courses.Course", on_delete=models.CASCADE, related_name="student_projects"
    )
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

- [ ] **Step 2: Register in admin**

Replace `algonex-backend/showcase/admin.py`:

```python
from django.contrib import admin
from .models import AlumniProfile, StudentProject


@admin.register(AlumniProfile)
class AlumniProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "current_company", "current_role", "course", "batch_year", "is_featured", "is_published")
    list_filter = ("course", "batch_year", "is_featured", "is_published")
    search_fields = ("name", "current_company", "current_role")
    list_editable = ("is_featured", "is_published")


@admin.register(StudentProject)
class StudentProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "student_name", "course", "batch_year", "is_featured", "is_published")
    list_filter = ("course", "batch_year", "is_featured", "is_published")
    search_fields = ("title", "student_name")
    list_editable = ("is_featured", "is_published")
    prepopulated_fields = {"slug": ("title",)}
```

- [ ] **Step 3: Create and run migration**

```bash
cd algonex-backend && python3.11 manage.py makemigrations showcase && python3.11 manage.py migrate
```
Expected: Migration created and applied.

- [ ] **Step 4: Run existing tests**

Run: `cd algonex-backend && python3.11 -m pytest -v`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd algonex-backend && git add showcase/models.py showcase/admin.py showcase/migrations/
git commit -m "feat(showcase): add AlumniProfile and StudentProject models with admin"
```

---

### Task 6: Showcase Tests

**Files:**
- Create: `algonex-backend/showcase/tests/test_api.py`

- [ ] **Step 1: Write comprehensive API tests**

```python
from datetime import date
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from courses.models import Course, Skill
from showcase.models import AlumniProfile, StudentProject


class TestAlumniAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="inst@test.com", password="testpass123", role="instructor"
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="Python Full Stack",
            description="Learn Python", duration="12 weeks", price=24999, is_published=True,
        )
        self.published = AlumniProfile.objects.create(
            name="Priya M.", course=self.course, batch_year=2025,
            current_company="TCS", current_role="Backend Developer",
            linkedin_url="https://linkedin.com/in/priya",
            short_quote="Changed my career", package_range="6-8 LPA",
            is_featured=True, is_published=True,
        )
        self.unpublished = AlumniProfile.objects.create(
            name="Hidden", course=self.course, batch_year=2025,
            current_company="Secret", current_role="Dev",
            is_published=False,
        )

    def test_list_alumni_returns_only_published(self):
        response = self.client.get("/api/v1/alumni/")
        assert response.status_code == 200
        results = response.data["data"]["results"]
        assert len(results) == 1
        assert results[0]["name"] == "Priya M."

    def test_list_alumni_includes_course_info(self):
        response = self.client.get("/api/v1/alumni/")
        result = response.data["data"]["results"][0]
        assert result["course"]["name"] == "Python Full Stack"

    def test_filter_by_course(self):
        response = self.client.get("/api/v1/alumni/", {"course": "python-full-stack"})
        results = response.data["data"]["results"]
        assert len(results) == 1

    def test_filter_by_batch_year(self):
        response = self.client.get("/api/v1/alumni/", {"batch_year": 2025})
        results = response.data["data"]["results"]
        assert len(results) == 1

    def test_featured_endpoint(self):
        response = self.client.get("/api/v1/alumni/featured/")
        assert response.status_code == 200
        data = response.data["data"]
        assert len(data) == 1
        assert data[0]["name"] == "Priya M."

    def test_alumni_no_auth_required(self):
        response = self.client.get("/api/v1/alumni/")
        assert response.status_code == 200


class TestStudentProjectAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="inst@test.com", password="testpass123", role="instructor"
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="MERN Stack",
            description="Learn MERN", duration="10 weeks", price=22999, is_published=True,
        )
        self.skill = Skill.objects.create(name="React")
        self.published = StudentProject.objects.create(
            title="E-commerce App", description="A full-stack e-commerce platform",
            thumbnail="projects/thumbnails/ecom.jpg", student_name="Kiran V.",
            course=self.course, batch_year=2025,
            demo_url="https://ecom-demo.example.com",
            github_url="https://github.com/kiran/ecom",
            is_featured=True, is_published=True,
        )
        self.published.tech_tags.add(self.skill)
        self.unpublished = StudentProject.objects.create(
            title="Hidden", description="Secret project",
            thumbnail="projects/thumbnails/hidden.jpg", student_name="Nobody",
            course=self.course, batch_year=2025, is_published=False,
        )

    def test_list_projects_returns_only_published(self):
        response = self.client.get("/api/v1/projects/")
        assert response.status_code == 200
        results = response.data["data"]["results"]
        assert len(results) == 1
        assert results[0]["title"] == "E-commerce App"

    def test_project_detail(self):
        response = self.client.get(f"/api/v1/projects/{self.published.slug}/")
        assert response.status_code == 200
        data = response.data["data"]
        assert data["title"] == "E-commerce App"
        assert data["demo_url"] == "https://ecom-demo.example.com"
        assert data["github_url"] == "https://github.com/kiran/ecom"

    def test_project_includes_tech_tags(self):
        response = self.client.get(f"/api/v1/projects/{self.published.slug}/")
        data = response.data["data"]
        assert "React" in [t["name"] for t in data["tech_tags"]]

    def test_filter_by_course(self):
        response = self.client.get("/api/v1/projects/", {"course": "mern-stack"})
        results = response.data["data"]["results"]
        assert len(results) == 1

    def test_featured_endpoint(self):
        response = self.client.get("/api/v1/projects/featured/")
        assert response.status_code == 200
        data = response.data["data"]
        assert len(data) == 1

    def test_projects_no_auth_required(self):
        response = self.client.get("/api/v1/projects/")
        assert response.status_code == 200
```

- [ ] **Step 2: Run tests — expect failures**

Run: `cd algonex-backend && python3.11 -m pytest showcase/tests/test_api.py -v`
Expected: FAIL — URLs don't exist yet.

- [ ] **Step 3: Commit**

```bash
cd algonex-backend && git add showcase/tests/
git commit -m "test(showcase): add alumni and student project API tests"
```

---

### Task 7: Showcase Selectors + Serializers + Views + URLs

**Files:**
- Create: `algonex-backend/showcase/selectors.py`
- Create: `algonex-backend/showcase/serializers.py`
- Create: `algonex-backend/showcase/urls.py`
- Modify: `algonex-backend/showcase/views.py`
- Modify: `algonex-backend/config/urls.py`

- [ ] **Step 1: Create selectors**

Write `algonex-backend/showcase/selectors.py`:

```python
from .models import AlumniProfile, StudentProject


def get_published_alumni(*, course_slug=None, batch_year=None, company=None, search=None):
    """Return published alumni profiles with optional filters."""
    qs = AlumniProfile.objects.filter(is_published=True).select_related("course")
    if course_slug:
        qs = qs.filter(course__slug=course_slug)
    if batch_year:
        qs = qs.filter(batch_year=batch_year)
    if company:
        qs = qs.filter(current_company__icontains=company)
    if search:
        from django.db.models import Q
        qs = qs.filter(Q(name__icontains=search) | Q(current_company__icontains=search))
    return qs


def get_featured_alumni():
    """Return featured alumni profiles (no pagination, expected <10)."""
    return AlumniProfile.objects.filter(
        is_published=True, is_featured=True
    ).select_related("course")


def get_published_projects(*, course_slug=None):
    """Return published student projects with optional filters."""
    qs = StudentProject.objects.filter(is_published=True).select_related(
        "course"
    ).prefetch_related("tech_tags")
    if course_slug:
        qs = qs.filter(course__slug=course_slug)
    return qs


def get_featured_projects():
    """Return featured student projects (no pagination)."""
    return StudentProject.objects.filter(
        is_published=True, is_featured=True
    ).select_related("course").prefetch_related("tech_tags")


def get_project_detail(*, slug):
    """Return a single published student project by slug."""
    return StudentProject.objects.filter(
        slug=slug, is_published=True
    ).select_related("course").prefetch_related("tech_tags").first()
```

- [ ] **Step 2: Create serializers**

Write `algonex-backend/showcase/serializers.py`:

```python
from rest_framework import serializers
from courses.serializers import SkillSerializer
from .models import AlumniProfile, StudentProject


class ShowcaseCourseSerializer(serializers.Serializer):
    """Lightweight course info for showcase listings."""
    name = serializers.CharField()
    slug = serializers.SlugField()


class AlumniProfileSerializer(serializers.ModelSerializer):
    course = ShowcaseCourseSerializer(read_only=True)

    class Meta:
        model = AlumniProfile
        fields = [
            "id", "name", "avatar", "course", "batch_year",
            "current_company", "current_role", "linkedin_url",
            "short_quote", "package_range",
        ]


class StudentProjectListSerializer(serializers.ModelSerializer):
    course = ShowcaseCourseSerializer(read_only=True)
    tech_tags = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = StudentProject
        fields = [
            "id", "title", "slug", "thumbnail", "student_name",
            "course", "batch_year", "tech_tags", "is_featured",
        ]


class StudentProjectDetailSerializer(serializers.ModelSerializer):
    course = ShowcaseCourseSerializer(read_only=True)
    tech_tags = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = StudentProject
        fields = [
            "id", "title", "slug", "description", "thumbnail",
            "student_name", "course", "batch_year", "tech_tags",
            "demo_url", "github_url", "is_featured",
        ]
```

- [ ] **Step 3: Create views**

Replace `algonex-backend/showcase/views.py`:

```python
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from common.pagination import StandardPagination
from .selectors import (
    get_published_alumni, get_featured_alumni,
    get_published_projects, get_featured_projects, get_project_detail,
)
from .serializers import (
    AlumniProfileSerializer, StudentProjectListSerializer, StudentProjectDetailSerializer,
)


class ShowcasePagination(StandardPagination):
    page_size = 20


class AlumniViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Public read-only endpoint for alumni profiles."""
    serializer_class = AlumniProfileSerializer
    permission_classes = [AllowAny]
    pagination_class = ShowcasePagination

    def get_queryset(self):
        return get_published_alumni(
            course_slug=self.request.query_params.get("course"),
            batch_year=self.request.query_params.get("batch_year"),
            company=self.request.query_params.get("company"),
            search=self.request.query_params.get("search"),
        )

    @action(detail=False, methods=["get"])
    def featured(self, request):
        alumni = get_featured_alumni()
        serializer = self.get_serializer(alumni, many=True)
        return Response({"status": "success", "data": serializer.data})


class StudentProjectViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Public read-only endpoint for student projects."""
    permission_classes = [AllowAny]
    pagination_class = ShowcasePagination
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return StudentProjectDetailSerializer
        return StudentProjectListSerializer

    def get_queryset(self):
        return get_published_projects(
            course_slug=self.request.query_params.get("course"),
        )

    def retrieve(self, request, slug=None):
        project = get_project_detail(slug=slug)
        if not project:
            return Response(
                {"status": "error", "error": {"code": "NOT_FOUND", "message": "Project not found."}},
                status=404,
            )
        serializer = StudentProjectDetailSerializer(project)
        return Response({"status": "success", "data": serializer.data})

    @action(detail=False, methods=["get"])
    def featured(self, request):
        projects = get_featured_projects()
        serializer = StudentProjectListSerializer(projects, many=True)
        return Response({"status": "success", "data": serializer.data})
```

- [ ] **Step 4: Create URLs**

Write `algonex-backend/showcase/urls.py`:

```python
from rest_framework.routers import DefaultRouter
from .views import AlumniViewSet, StudentProjectViewSet

router = DefaultRouter()
router.register(r"alumni", AlumniViewSet, basename="alumni")
router.register(r"projects", StudentProjectViewSet, basename="project")

urlpatterns = router.urls
```

- [ ] **Step 5: Wire into main URL config**

In `algonex-backend/config/urls.py`, add:

```python
path("api/v1/", include("showcase.urls")),
```

Add it after the existing `path("api/v1/", include("portfolio.urls")),` line.

- [ ] **Step 6: Run showcase tests — all should pass**

Run: `cd algonex-backend && python3.11 -m pytest showcase/tests/test_api.py -v`
Expected: All 12 tests PASS.

- [ ] **Step 7: Run full test suite**

Run: `cd algonex-backend && python3.11 -m pytest -v`
Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
cd algonex-backend && git add showcase/selectors.py showcase/serializers.py showcase/views.py showcase/urls.py config/urls.py
git commit -m "feat(showcase): add alumni and student project API endpoints"
```

---

### Task 8: Showcase Seed Data Command

**Files:**
- Create: `algonex-backend/showcase/management/__init__.py`
- Create: `algonex-backend/showcase/management/commands/__init__.py`
- Create: `algonex-backend/showcase/management/commands/seed_showcase.py`

- [ ] **Step 1: Create management command directory**

```bash
mkdir -p algonex-backend/showcase/management/commands
touch algonex-backend/showcase/management/__init__.py
touch algonex-backend/showcase/management/commands/__init__.py
```

- [ ] **Step 2: Write seed command**

Write `algonex-backend/showcase/management/commands/seed_showcase.py`:

```python
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from courses.models import Course, Skill
from showcase.models import AlumniProfile, StudentProject


class Command(BaseCommand):
    help = "Seed alumni profiles, student outcomes, and student projects"

    def handle(self, *args, **options):
        courses = list(Course.objects.filter(is_published=True)[:4])
        if not courses:
            self.stderr.write("No published courses found. Run seed_courses first.")
            return

        skills = {s.name: s for s in Skill.objects.all()}

        # --- Alumni Profiles ---
        alumni_data = [
            {"name": "Priya M.", "course": 0, "batch_year": 2025, "current_company": "TCS", "current_role": "Backend Developer", "package_range": "6-8 LPA", "short_quote": "Algonex gave me the skills to land my dream job.", "is_featured": True},
            {"name": "Rahul S.", "course": 0, "batch_year": 2025, "current_company": "Infosys", "current_role": "Full Stack Developer", "package_range": "5-7 LPA", "short_quote": "The hands-on projects made all the difference.", "is_featured": True},
            {"name": "Ananya K.", "course": 1, "batch_year": 2025, "current_company": "Wipro", "current_role": "Frontend Developer", "package_range": "5-6 LPA", "short_quote": "I went from zero coding to employed in 4 months.", "is_featured": True},
            {"name": "Vikram D.", "course": 1, "batch_year": 2024, "current_company": "Accenture", "current_role": "React Developer", "package_range": "7-9 LPA", "short_quote": "Best investment in my career.", "is_featured": False},
            {"name": "Sneha R.", "course": 2, "batch_year": 2025, "current_company": "Deloitte", "current_role": "Data Analyst", "package_range": "8-10 LPA", "short_quote": "The analytics curriculum is world-class.", "is_featured": True},
            {"name": "Arjun P.", "course": 2, "batch_year": 2024, "current_company": "Amazon", "current_role": "Business Analyst", "package_range": "12-15 LPA", "short_quote": "Algonex helped me transition from ops to analytics.", "is_featured": True},
            {"name": "Divya L.", "course": 0, "batch_year": 2024, "current_company": "Zoho", "current_role": "Python Developer", "package_range": "6-8 LPA", "short_quote": "The mentorship was incredible.", "is_featured": False},
            {"name": "Karthik N.", "course": 3, "batch_year": 2025, "current_company": "Cognizant", "current_role": "Java Developer", "package_range": "5-7 LPA", "short_quote": "Solid foundation in enterprise development.", "is_featured": False},
            {"name": "Meera T.", "course": 0, "batch_year": 2025, "current_company": "Freshworks", "current_role": "Backend Engineer", "package_range": "8-10 LPA", "short_quote": "From career switcher to engineer in 3 months.", "is_featured": True},
            {"name": "Sanjay V.", "course": 1, "batch_year": 2024, "current_company": "Flipkart", "current_role": "Frontend Engineer", "package_range": "10-12 LPA", "short_quote": "The MERN curriculum is spot-on for the industry.", "is_featured": True},
        ]

        created_alumni = 0
        for data in alumni_data:
            course_idx = data.pop("course")
            if course_idx < len(courses):
                _, created = AlumniProfile.objects.get_or_create(
                    name=data["name"], course=courses[course_idx],
                    defaults={**data, "is_published": True},
                )
                if created:
                    created_alumni += 1
        self.stdout.write(f"Created {created_alumni} alumni profiles.")

        # --- Student Projects ---
        project_data = [
            {"title": "ShopEasy E-Commerce", "description": "A full-stack e-commerce platform with cart, checkout, payment integration, and admin dashboard.", "student_name": "Rahul S.", "course": 0, "batch_year": 2025, "demo_url": "https://shopeasy-demo.example.com", "github_url": "https://github.com/example/shopeasy", "tags": ["Python", "Django", "React", "PostgreSQL"], "is_featured": True},
            {"title": "TaskFlow Project Manager", "description": "Real-time project management tool with Kanban boards, team chat, and progress tracking.", "student_name": "Ananya K.", "course": 1, "batch_year": 2025, "demo_url": "https://taskflow-demo.example.com", "github_url": "https://github.com/example/taskflow", "tags": ["React", "Node.js", "MongoDB", "Socket.io"], "is_featured": True},
            {"title": "Sales Analytics Dashboard", "description": "Interactive dashboard for sales data visualization with predictive analytics and export features.", "student_name": "Sneha R.", "course": 2, "batch_year": 2025, "demo_url": "https://sales-dash.example.com", "tags": ["Python", "Pandas", "Plotly", "SQL"], "is_featured": True},
            {"title": "HealthTrack API", "description": "RESTful API for health tracking with JWT auth, data validation, and comprehensive API docs.", "student_name": "Karthik N.", "course": 3, "batch_year": 2025, "github_url": "https://github.com/example/healthtrack", "tags": ["Java", "Spring Boot", "PostgreSQL"], "is_featured": False},
            {"title": "DevConnect Social", "description": "Developer networking platform with profiles, posts, messaging, and project showcasing.", "student_name": "Vikram D.", "course": 1, "batch_year": 2024, "demo_url": "https://devconnect.example.com", "github_url": "https://github.com/example/devconnect", "tags": ["React", "Node.js", "MongoDB"], "is_featured": True},
        ]

        created_projects = 0
        for data in project_data:
            course_idx = data.pop("course")
            tags = data.pop("tags", [])
            if course_idx < len(courses):
                project, created = StudentProject.objects.get_or_create(
                    title=data["title"],
                    defaults={
                        **data,
                        "course": courses[course_idx],
                        "thumbnail": "projects/thumbnails/placeholder.jpg",
                        "is_published": True,
                    },
                )
                if created:
                    for tag_name in tags:
                        if tag_name in skills:
                            project.tech_tags.add(skills[tag_name])
                    created_projects += 1
        self.stdout.write(f"Created {created_projects} student projects.")
        self.stdout.write(self.style.SUCCESS("Showcase seed data complete."))
```

- [ ] **Step 3: Test the seed command**

Run:
```bash
cd algonex-backend && python3.11 manage.py seed_showcase
```
Expected: Output like "Created 10 alumni profiles." and "Created 5 student projects."

- [ ] **Step 4: Commit**

```bash
cd algonex-backend && git add showcase/management/
git commit -m "feat(showcase): add seed_showcase management command"
```

---

## Chunk 3: ContactForm Gaps + Outcome Seed Data

### Task 9: ContactForm Admin + Tests

**Files:**
- Modify: `algonex-backend/contactform/admin.py`
- Create: `algonex-backend/contactform/tests/` (replace stub tests.py)

- [ ] **Step 1: Register ContactForm in admin**

Replace `algonex-backend/contactform/admin.py`:

```python
from django.contrib import admin
from .models import ContactForm


@admin.register(ContactForm)
class ContactFormAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "subject", "submitted_at")
    list_filter = ("submitted_at",)
    search_fields = ("full_name", "email", "subject")
    readonly_fields = ("submitted_at",)
```

- [ ] **Step 2: Create tests directory and write tests**

```bash
cd algonex-backend && mkdir -p contactform/tests && touch contactform/tests/__init__.py && rm -f contactform/tests.py
```

Write `algonex-backend/contactform/tests/test_api.py`:

```python
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from contactform.models import ContactForm


class TestContactFormAPI(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_submit_valid_form(self):
        response = self.client.post("/api/v1/contact/submit-form/", {
            "full_name": "Test User",
            "email": "test@example.com",
            "message": "Hello, I have a question.",
        })
        assert response.status_code == 201
        assert response.data["status"] == "success"
        assert ContactForm.objects.count() == 1

    def test_submit_with_optional_fields(self):
        response = self.client.post("/api/v1/contact/submit-form/", {
            "full_name": "Test User",
            "email": "test@example.com",
            "phone": "9876543210",
            "subject": "Course inquiry",
            "message": "Tell me about Python Full Stack.",
        })
        assert response.status_code == 201
        form = ContactForm.objects.first()
        assert form.phone == "9876543210"
        assert form.subject == "Course inquiry"

    def test_submit_missing_required_fields(self):
        response = self.client.post("/api/v1/contact/submit-form/", {
            "full_name": "Test User",
        })
        assert response.status_code == 400
        assert response.data["status"] == "error"

    def test_submit_invalid_email(self):
        response = self.client.post("/api/v1/contact/submit-form/", {
            "full_name": "Test User",
            "email": "not-an-email",
            "message": "Hello",
        })
        assert response.status_code == 400

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        ADMINS=[("Admin", "admin@example.com")],
    )
    def test_admin_notification_sent(self):
        from django.core import mail
        self.client.post("/api/v1/contact/submit-form/", {
            "full_name": "Notified User",
            "email": "notify@example.com",
            "message": "Please respond.",
        })
        assert len(mail.outbox) == 1
        assert "Notified User" in mail.outbox[0].body
```

- [ ] **Step 3: Run contactform tests**

Run: `cd algonex-backend && python3.11 -m pytest contactform/tests/ -v`
Expected: All 5 tests PASS.

- [ ] **Step 4: Run full test suite**

Run: `cd algonex-backend && python3.11 -m pytest -v`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd algonex-backend && git add contactform/admin.py contactform/tests/
git commit -m "fix(contactform): register model in admin and add API tests"
```

---

### Task 10: StudentOutcome Seed Data

**Files:**
- Modify: `algonex-backend/courses/management/commands/seed_courses.py` (add outcomes to existing seed)

- [ ] **Step 1: Add outcome seeding to seed_courses command**

Read the existing `seed_courses.py` to understand its structure, then append outcome seeding at the end of the `handle` method.

**IMPORTANT:** The existing file already imports `from courses.models import Course, Module, Topic, Skill, CourseFAQ, Testimonial`. Add `StudentOutcome` to that existing import line — do NOT add a separate import. Also add the `date` and `timedelta` imports:

```python
# Modify existing import to add StudentOutcome:
from courses.models import Course, Module, Topic, Skill, CourseFAQ, Testimonial, StudentOutcome
# Add at top:
from datetime import date, timedelta

# Append at end of handle() method:
        # --- Student Outcomes ---
        outcome_data = [
            {"student_name": "Rahul S.", "achievement_type": "placed", "company_name": "Infosys", "role": "Full Stack Developer", "package_range": "6-8 LPA", "days_ago": 3},
            {"student_name": "Priya M.", "achievement_type": "placed", "company_name": "TCS", "role": "Backend Developer", "package_range": "6-8 LPA", "days_ago": 5},
            {"student_name": "Vikram D.", "achievement_type": "promoted", "company_name": "Accenture", "role": "Senior React Developer", "package_range": "10-12 LPA", "days_ago": 7},
            {"student_name": "Sneha R.", "achievement_type": "placed", "company_name": "Deloitte", "role": "Data Analyst", "package_range": "8-10 LPA", "days_ago": 2},
            {"student_name": "Arjun P.", "achievement_type": "placed", "company_name": "Amazon", "role": "Business Analyst", "package_range": "12-15 LPA", "days_ago": 10},
            {"student_name": "Divya L.", "achievement_type": "freelancing", "company_name": "", "role": "Python Freelancer", "package_range": "", "days_ago": 1},
            {"student_name": "Karthik N.", "achievement_type": "project_launched", "company_name": "", "role": "", "package_range": "", "days_ago": 4},
            {"student_name": "Meera T.", "achievement_type": "placed", "company_name": "Freshworks", "role": "Backend Engineer", "package_range": "8-10 LPA", "days_ago": 6},
            {"student_name": "Sanjay V.", "achievement_type": "placed", "company_name": "Flipkart", "role": "Frontend Engineer", "package_range": "10-12 LPA", "days_ago": 8},
            {"student_name": "Ananya K.", "achievement_type": "placed", "company_name": "Wipro", "role": "Frontend Developer", "package_range": "5-6 LPA", "days_ago": 12},
        ]

        courses_for_outcomes = list(Course.objects.filter(is_published=True)[:4])
        created_outcomes = 0
        for i, data in enumerate(outcome_data):
            days_ago = data.pop("days_ago")
            course = courses_for_outcomes[i % len(courses_for_outcomes)] if courses_for_outcomes else None
            if course:
                _, created = StudentOutcome.objects.get_or_create(
                    student_name=data["student_name"],
                    course=course,
                    defaults={
                        **data,
                        "achieved_at": date.today() - timedelta(days=days_ago),
                        "is_published": True,
                    },
                )
                if created:
                    created_outcomes += 1
        self.stdout.write(f"Created {created_outcomes} student outcomes.")
```

- [ ] **Step 2: Test the updated seed command**

```bash
cd algonex-backend && python3.11 manage.py seed_courses
```
Expected: Existing course seeding works + "Created 10 student outcomes." at the end.

- [ ] **Step 3: Verify via API**

```bash
cd algonex-backend && python3.11 manage.py runserver &
sleep 2
curl -s http://localhost:8000/api/v1/outcomes/ | python3.11 -m json.tool | head -20
kill %1
```
Expected: JSON response with outcomes data.

- [ ] **Step 4: Commit**

```bash
cd algonex-backend && git add courses/management/commands/seed_courses.py
git commit -m "feat(courses): add StudentOutcome seed data to seed_courses command"
```

---

## Chunk 4: DevOps — CI/CD + Caddy

### Task 11: GitHub Actions CI Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create workflow directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write CI workflow**

Write `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, stack-page]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    # Note: tests use SQLite (config.settings.testing), no Postgres service needed
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"
          cache-dependency-path: algonex-backend/requirements.txt

      - name: Install dependencies
        run: |
          cd algonex-backend
          pip install -r requirements.txt

      - name: Run tests
        env:
          DJANGO_SETTINGS_MODULE: config.settings.testing
          DB_ENGINE: sqlite
        run: |
          cd algonex-backend
          python -m pytest -v --tb=short

  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: algonex-frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd algonex-frontend
          npm ci

      - name: Lint
        run: |
          cd algonex-frontend
          npm run lint

      - name: Build
        run: |
          cd algonex-frontend
          npm run build
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for backend tests and frontend build"
```

---

### Task 12: Replace Nginx with Caddy

**Files:**
- Create: `Caddyfile`
- Modify: `docker-compose.yml`
- Delete: `nginx/nginx.conf` (after confirming Caddy works)

- [ ] **Step 1: Create Caddyfile**

Write `Caddyfile` in project root:

```
{$DOMAIN:localhost} {
    # API and admin to Django
    handle /api/* {
        reverse_proxy backend:8000
    }

    handle /admin/* {
        reverse_proxy backend:8000
    }

    # Django static files
    handle /static/* {
        reverse_proxy backend:8000
    }

    # Media files
    handle /media/* {
        reverse_proxy backend:8000
    }

    # Everything else -> React SPA
    handle {
        reverse_proxy frontend:80
    }
}
```

- [ ] **Step 2: Update docker-compose.yml — replace nginx with Caddy**

Replace the `nginx` service in `docker-compose.yml`:

```yaml
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    environment:
      - DOMAIN=${DOMAIN:-localhost}
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
```

Add to volumes section:
```yaml
  caddy_data:
  caddy_config:
```

Remove the old `nginx` service entirely.

- [ ] **Step 3: Update Makefile seed command**

In `Makefile`, update the `seed` target to include all seed commands:

```makefile
seed: ## Seed database with sample data
	docker compose exec backend python manage.py seed_courses
	docker compose exec backend python manage.py seed_events
	docker compose exec backend python manage.py seed_programs
	docker compose exec backend python manage.py seed_showcase
```

- [ ] **Step 4: Commit**

```bash
git add Caddyfile docker-compose.yml Makefile
git commit -m "infra: replace nginx with Caddy reverse proxy and update Makefile seed targets"
```

---

### Task 13: Update .env.example with email config

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add missing email configuration**

Append to `.env.example`:

```bash
# === Email (required for password reset and registration invites) ===
# For development, Django uses console backend (prints to terminal).
# For production, configure SMTP:
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# === Caddy / Domain ===
DOMAIN=localhost
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add email and domain config to .env.example"
```

---

## Chunk 5: Final Verification

### Task 14: Full Integration Verification

- [ ] **Step 1: Run complete test suite**

```bash
cd algonex-backend && python3.11 -m pytest -v --tb=short
```
Expected: All tests pass (91 existing + ~22 new = ~113 total).

- [ ] **Step 2: Verify all seed commands work**

```bash
cd algonex-backend && python3.11 manage.py seed_courses && python3.11 manage.py seed_showcase
```

- [ ] **Step 3: Spot-check API endpoints**

Start server and verify each new endpoint returns data:
```bash
cd algonex-backend && python3.11 manage.py runserver &
sleep 2
curl -s http://localhost:8000/api/v1/outcomes/ | python3.11 -m json.tool | head -5
curl -s http://localhost:8000/api/v1/alumni/ | python3.11 -m json.tool | head -5
curl -s http://localhost:8000/api/v1/alumni/featured/ | python3.11 -m json.tool | head -5
curl -s http://localhost:8000/api/v1/projects/ | python3.11 -m json.tool | head -5
curl -s http://localhost:8000/api/v1/projects/featured/ | python3.11 -m json.tool | head -5
kill %1
```
Expected: All return `{"status": "success", "data": {...}}`.

- [ ] **Step 4: Verify Django admin has all models registered**

Start server and check `/admin/`:
- courses > StudentOutcome: visible with list_display columns
- showcase > AlumniProfile: visible with inline editing
- showcase > StudentProject: visible with slug prepopulation
- contactform > ContactForm: visible with readonly submitted_at

- [ ] **Step 5: Final commit if any cleanup needed**

```bash
git status
# If clean, no commit needed. If cleanup was done:
git add -A && git commit -m "chore: final cleanup after backend showcase + devops implementation"
```
