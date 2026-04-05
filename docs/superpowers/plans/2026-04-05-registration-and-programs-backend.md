# Registration System & Programs Module — Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement progressive registration (two-step, no-password), two-step login, and browse-only fellowship/internship program listings — backend only.

**Architecture:** Extend `signin` app with `RegistrationProfile` (OneToOne → User). New `programs` app for fellowship/internship listings. New auth views in `accounts` for check-email / send-setup-email / set-password. All follow the existing 4-layer pattern (views → services → selectors → models).

**Tech Stack:** Django 5.2, DRF 3.15, SimpleJWT, dj-rest-auth, django-filter, pytest

**Spec:** `docs/superpowers/specs/2026-04-05-registration-and-programs-design.md`

---

## File Structure

### New files

```
programs/
├── __init__.py
├── apps.py
├── models.py           → Program model
├── services.py         → create_program, update_program
├── selectors.py        → get_published_programs, get_program_detail
├── serializers.py      → ProgramListSerializer, ProgramDetailSerializer, ProgramCreateUpdateSerializer
├── views.py            → ProgramViewSet
├── filters.py          → ProgramFilter
├── exceptions.py       → (none needed initially)
├── urls.py
├── admin.py
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_services.py
│   ├── test_selectors.py
│   └── test_views.py
└── management/
    └── commands/
        └── seed_programs.py

signin/
├── services.py         → register_step1, register_step2
├── exceptions.py       → UserNotFound, TermsNotAgreed
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_services.py
│   └── test_views.py

accounts/
├── tests/
│   └── test_auth_views.py  → tests for check-email, send-setup-email, set-password
```

### Modified files

```
signin/models.py        → Add RegistrationProfile model (keep SigninProfile)
signin/serializers.py   → Add Step1Serializer, Step2Serializer
signin/views.py         → Add RegisterStep1View, RegisterStep2View
signin/urls.py          → Create (currently may not exist as file)
accounts/views.py       → Add CheckEmailView, SendSetupEmailView, SetPasswordView
accounts/serializers.py → Add CheckEmailSerializer, SetPasswordSerializer
accounts/urls.py        → Add new auth endpoints
config/urls.py          → Add signin and programs URL includes
config/settings/base.py → Add 'programs' and 'signin' to INSTALLED_APPS, email config
```

---

## Chunk 1: Programs App — Models, Services, Selectors

### Task 1: Create Programs App Scaffold

**Files:**
- Create: `algonex-backend/programs/__init__.py`
- Create: `algonex-backend/programs/apps.py`
- Create: `algonex-backend/programs/models.py`
- Create: `algonex-backend/programs/admin.py`
- Modify: `algonex-backend/config/settings/base.py`

- [ ] **Step 1: Create app directory and scaffold files**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
mkdir -p programs/tests programs/management/commands
touch programs/__init__.py programs/tests/__init__.py programs/management/__init__.py programs/management/commands/__init__.py
```

- [ ] **Step 2: Write apps.py**

Create `algonex-backend/programs/apps.py`:
```python
from django.apps import AppConfig


class ProgramsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "programs"
```

- [ ] **Step 3: Write Program model**

Create `algonex-backend/programs/models.py`:
```python
from django.db import models
from django.utils import timezone
from common.mixins import TimestampMixin, SlugMixin


class Program(TimestampMixin, SlugMixin, models.Model):
    """A fellowship or internship program listing."""

    TYPE_CHOICES = [
        ("fellowship", "Fellowship"),
        ("internship", "Internship"),
    ]

    DEGREE_CHOICES = [
        ("diploma", "Diploma"),
        ("bachelors", "Bachelors"),
        ("masters", "Masters"),
        ("phd", "PhD"),
        ("other", "Other"),
    ]

    # Basic
    title = models.CharField(max_length=255)
    description = models.TextField(help_text="Supports Markdown")
    image = models.ImageField(upload_to="programs/images/", blank=True, null=True)
    banner = models.ImageField(upload_to="programs/banners/", blank=True, null=True)
    program_type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)

    # Details
    duration = models.CharField(max_length=50, help_text="e.g. '3 months', '6 weeks'")
    stipend = models.CharField(max_length=100, blank=True, help_text="e.g. '₹15,000/month'")
    location = models.CharField(max_length=255)
    is_remote = models.BooleanField(default=False)

    # Eligibility
    eligibility_criteria = models.TextField(help_text="Markdown description of eligibility")
    min_degree_level = models.CharField(max_length=20, choices=DEGREE_CHOICES, blank=True)
    eligible_branches = models.TextField(blank=True, help_text="Comma-separated branch names")

    # Dates
    application_deadline = models.DateField()
    start_date = models.DateField()
    end_date = models.DateField()

    # Capacity & Status
    capacity = models.PositiveIntegerField()
    is_published = models.BooleanField(default=False, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ["-is_featured", "application_deadline"]

    def __str__(self):
        return f"{self.title} ({self.get_program_type_display()})"

    @property
    def is_accepting(self):
        return self.application_deadline >= timezone.now().date()

    @property
    def registration_count(self):
        return self.registration_profiles.count()

    @property
    def spots_left(self):
        return max(0, self.capacity - self.registration_count)
```

- [ ] **Step 4: Write admin.py**

Create `algonex-backend/programs/admin.py`:
```python
from django.contrib import admin
from .models import Program


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ["title", "program_type", "is_published", "is_featured", "application_deadline"]
    list_filter = ["program_type", "is_published", "is_featured"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
```

- [ ] **Step 5: Add programs to INSTALLED_APPS**

In `algonex-backend/config/settings/base.py`, add `"programs"` and `"signin"` to `INSTALLED_APPS` under `# Local apps`:
```python
    # Local apps
    "common",
    "accounts",
    "courses",
    "events",
    "careers",
    "portfolio",
    "contactform",
    "signin",
    "programs",
```

Also add email config and throttle rates at the bottom of base.py (note: `DEFAULT_FROM_EMAIL` already exists in base.py, do NOT re-declare it):
```python
# Email (console backend for dev, override in production.py)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Frontend URL for password setup links
FRONTEND_URL = "http://localhost:5173"
```

And add scoped throttle rates to the existing `DEFAULT_THROTTLE_RATES` in `REST_FRAMEWORK`:
```python
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/minute",
        "user": "120/minute",
        "registration": "5/minute",
        "auth_check": "5/minute",
    },
```

- [ ] **Step 6: Run makemigrations and migrate**

Note: `signin` is being added to `INSTALLED_APPS` for the first time. Run makemigrations for both `signin` (existing model) and `programs` (new model).

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 manage.py makemigrations signin programs
python3.11 manage.py migrate
```

- [ ] **Step 7: Commit**

```bash
git add programs/ config/settings/base.py
git commit -m "feat(programs): add Program model, admin, and app scaffold"
```

---

### Task 2: Program Model Tests

**Files:**
- Create: `algonex-backend/programs/tests/test_models.py`

- [ ] **Step 1: Write model tests**

Create `algonex-backend/programs/tests/test_models.py`:
```python
from datetime import date, timedelta
from django.test import TestCase
from programs.models import Program


def _create_program(**kwargs):
    defaults = {
        "title": "Test Fellowship",
        "description": "A test program",
        "program_type": "fellowship",
        "duration": "3 months",
        "location": "Hyderabad",
        "eligibility_criteria": "B.Tech students",
        "application_deadline": date.today() + timedelta(days=30),
        "start_date": date.today() + timedelta(days=60),
        "end_date": date.today() + timedelta(days=150),
        "capacity": 20,
        "is_published": True,
    }
    defaults.update(kwargs)
    return Program.objects.create(**defaults)


class TestProgramModel(TestCase):
    def test_str_representation(self):
        program = _create_program(title="AI Fellowship", program_type="fellowship")
        self.assertEqual(str(program), "AI Fellowship (Fellowship)")

    def test_slug_auto_generated(self):
        program = _create_program(title="ML Internship")
        self.assertEqual(program.slug, "ml-internship")

    def test_is_accepting_future_deadline(self):
        program = _create_program(application_deadline=date.today() + timedelta(days=10))
        self.assertTrue(program.is_accepting)

    def test_is_accepting_past_deadline(self):
        program = _create_program(application_deadline=date.today() - timedelta(days=1))
        self.assertFalse(program.is_accepting)

    def test_is_accepting_today_deadline(self):
        program = _create_program(application_deadline=date.today())
        self.assertTrue(program.is_accepting)

    def test_spots_left_no_registrations(self):
        program = _create_program(capacity=20)
        self.assertEqual(program.spots_left, 20)

    def test_registration_count_zero(self):
        program = _create_program()
        self.assertEqual(program.registration_count, 0)

    def test_ordering(self):
        p1 = _create_program(title="P1", is_featured=False, application_deadline=date.today() + timedelta(days=5))
        p2 = _create_program(title="P2", is_featured=True, application_deadline=date.today() + timedelta(days=10))
        programs = list(Program.objects.all())
        self.assertEqual(programs[0], p2)  # featured first
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest programs/tests/test_models.py -v
```
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add programs/tests/
git commit -m "test(programs): add Program model tests"
```

---

### Task 3: Program Services

**Files:**
- Create: `algonex-backend/programs/services.py`
- Create: `algonex-backend/programs/tests/test_services.py`

- [ ] **Step 1: Write failing service tests**

Create `algonex-backend/programs/tests/test_services.py`:
```python
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from programs.models import Program
from programs.services import create_program, update_program

User = get_user_model()


class TestCreateProgram(TestCase):
    def test_creates_program(self):
        program = create_program(
            title="AI Fellowship",
            description="Learn AI",
            program_type="fellowship",
            duration="3 months",
            location="Remote",
            eligibility_criteria="B.Tech students",
            application_deadline=date.today() + timedelta(days=30),
            start_date=date.today() + timedelta(days=60),
            end_date=date.today() + timedelta(days=150),
            capacity=20,
        )
        self.assertEqual(program.title, "AI Fellowship")
        self.assertFalse(program.is_published)  # always draft

    def test_is_published_forced_false(self):
        program = create_program(
            title="Fellowship",
            description="Test",
            program_type="fellowship",
            duration="3 months",
            location="Online",
            eligibility_criteria="Open",
            application_deadline=date.today() + timedelta(days=30),
            start_date=date.today() + timedelta(days=60),
            end_date=date.today() + timedelta(days=150),
            capacity=10,
            is_published=True,
        )
        self.assertFalse(program.is_published)


class TestUpdateProgram(TestCase):
    def setUp(self):
        self.program = Program.objects.create(
            title="Original",
            description="Test",
            program_type="internship",
            duration="6 weeks",
            location="Hyderabad",
            eligibility_criteria="Open",
            application_deadline=date.today() + timedelta(days=30),
            start_date=date.today() + timedelta(days=60),
            end_date=date.today() + timedelta(days=100),
            capacity=15,
        )

    def test_updates_fields(self):
        updated = update_program(program=self.program, title="Updated Title")
        self.assertEqual(updated.title, "Updated Title")

    def test_publish_program(self):
        updated = update_program(program=self.program, is_published=True)
        self.assertTrue(updated.is_published)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest programs/tests/test_services.py -v
```
Expected: FAIL — `cannot import name 'create_program' from 'programs.services'`

- [ ] **Step 3: Write services implementation**

Create `algonex-backend/programs/services.py`:
```python
from .models import Program


def create_program(**data):
    """Create a new program. Always starts as unpublished draft."""
    data["is_published"] = False
    return Program.objects.create(**data)


def update_program(*, program, **data):
    """Update an existing program's fields."""
    for field, value in data.items():
        setattr(program, field, value)
    program.save()
    return program
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest programs/tests/test_services.py -v
```
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add programs/services.py programs/tests/test_services.py
git commit -m "feat(programs): add create/update services with tests"
```

---

### Task 4: Program Selectors

**Files:**
- Create: `algonex-backend/programs/selectors.py`
- Create: `algonex-backend/programs/tests/test_selectors.py`

- [ ] **Step 1: Write failing selector tests**

Create `algonex-backend/programs/tests/test_selectors.py`:
```python
from datetime import date, timedelta
from django.test import TestCase
from programs.models import Program
from programs.selectors import get_published_programs, get_program_detail


def _create_program(**kwargs):
    defaults = {
        "title": "Test Program",
        "description": "Desc",
        "program_type": "fellowship",
        "duration": "3 months",
        "location": "Hyderabad",
        "eligibility_criteria": "Open",
        "application_deadline": date.today() + timedelta(days=30),
        "start_date": date.today() + timedelta(days=60),
        "end_date": date.today() + timedelta(days=150),
        "capacity": 20,
        "is_published": True,
    }
    defaults.update(kwargs)
    return Program.objects.create(**defaults)


class TestGetPublishedPrograms(TestCase):
    def test_returns_only_published(self):
        _create_program(title="Published", is_published=True)
        _create_program(title="Draft", is_published=False)
        programs = get_published_programs()
        self.assertEqual(programs.count(), 1)
        self.assertEqual(programs.first().title, "Published")

    # Filtering is tested at the view level via django-filter (see test_views.py)

    # Uncomment after Task 7 when RegistrationProfile exists:
    # def test_has_registration_count_annotation(self):
    #     _create_program(title="P1")
    #     programs = get_published_programs()
    #     self.assertTrue(hasattr(programs.first(), "registration_count"))


class TestGetProgramDetail(TestCase):
    def test_returns_published_program(self):
        program = _create_program(title="Detail Test")
        result = get_program_detail(slug=program.slug)
        self.assertEqual(result.title, "Detail Test")

    def test_returns_none_for_unpublished(self):
        program = _create_program(title="Draft", is_published=False)
        result = get_program_detail(slug=program.slug)
        self.assertIsNone(result)

    def test_returns_none_for_nonexistent(self):
        result = get_program_detail(slug="does-not-exist")
        self.assertIsNone(result)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest programs/tests/test_selectors.py -v
```
Expected: FAIL — import error.

- [ ] **Step 3: Write selectors implementation**

Create `algonex-backend/programs/selectors.py`.

**Note:** Filtering is handled by `django-filter` via `ProgramFilter` in views — selectors only handle queryset construction and annotations. The `registration_profiles` related name won't exist until Task 7 creates RegistrationProfile. **Use the temporary version first, update to full version in Task 7.**

**Temporary selectors.py (until Task 7):**
```python
from .models import Program


def get_published_programs():
    """Return published programs. Annotation added after RegistrationProfile exists (Task 7)."""
    return Program.objects.filter(is_published=True)


def get_program_detail(*, slug):
    """Return a single published program by slug."""
    return Program.objects.filter(slug=slug, is_published=True).first()
```

**Full selectors.py (applied in Task 7):**
```python
from django.db.models import Count
from .models import Program


def get_published_programs():
    """Return published programs with registration count annotation.
    Filtering is handled by django-filter via ProgramFilter in views.
    """
    return Program.objects.filter(is_published=True).annotate(
        registration_count=Count("registration_profiles"),
    )


def get_program_detail(*, slug):
    """Return a single published program by slug."""
    return Program.objects.filter(slug=slug, is_published=True).first()
```

- [ ] **Step 5: Commit**

```bash
git add programs/selectors.py programs/tests/test_selectors.py
git commit -m "feat(programs): add selectors with tests (annotation deferred to Task 7)"
```

---

### Task 5: Program Serializers, Filters, Views, URLs

**Files:**
- Create: `algonex-backend/programs/serializers.py`
- Create: `algonex-backend/programs/filters.py`
- Create: `algonex-backend/programs/views.py`
- Create: `algonex-backend/programs/urls.py`
- Create: `algonex-backend/programs/exceptions.py`
- Modify: `algonex-backend/config/urls.py`

- [ ] **Step 1: Write serializers**

Create `algonex-backend/programs/serializers.py`:
```python
from rest_framework import serializers
from .models import Program


class ProgramListSerializer(serializers.ModelSerializer):
    is_accepting = serializers.BooleanField(read_only=True)
    registration_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Program
        fields = [
            "id", "title", "slug", "program_type", "image",
            "duration", "stipend", "location", "is_remote",
            "application_deadline", "start_date",
            "is_featured", "registration_count", "is_accepting",
        ]


class ProgramDetailSerializer(serializers.ModelSerializer):
    is_accepting = serializers.BooleanField(read_only=True)
    registration_count = serializers.IntegerField(read_only=True)
    spots_left = serializers.IntegerField(read_only=True)

    class Meta:
        model = Program
        fields = [
            "id", "title", "slug", "program_type", "image", "banner",
            "description", "duration", "stipend", "location", "is_remote",
            "eligibility_criteria", "min_degree_level", "eligible_branches",
            "application_deadline", "start_date", "end_date",
            "capacity", "is_featured",
            "registration_count", "spots_left", "is_accepting",
            "created_at",
        ]


class ProgramCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = [
            "title", "description", "image", "banner", "program_type",
            "duration", "stipend", "location", "is_remote",
            "eligibility_criteria", "min_degree_level", "eligible_branches",
            "application_deadline", "start_date", "end_date",
            "capacity", "is_published", "is_featured",
        ]
```

- [ ] **Step 2: Write filters**

Create `algonex-backend/programs/filters.py`:
```python
import django_filters
from .models import Program


class ProgramFilter(django_filters.FilterSet):
    program_type = django_filters.ChoiceFilter(choices=Program.TYPE_CHOICES)
    is_featured = django_filters.BooleanFilter()

    class Meta:
        model = Program
        fields = ["program_type", "is_featured"]
```

- [ ] **Step 3: Write views**

Create `algonex-backend/programs/views.py`:
```python
from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Program
from .serializers import (
    ProgramListSerializer,
    ProgramDetailSerializer,
    ProgramCreateUpdateSerializer,
)
from .filters import ProgramFilter
from .selectors import get_published_programs, get_program_detail
from .services import create_program, update_program
from common.permissions import IsAdmin


class ProgramViewSet(ModelViewSet):
    """
    Public: list/retrieve published programs.
    Admin: create/update/delete.
    """

    lookup_field = "slug"
    filterset_class = ProgramFilter
    search_fields = ["title", "description"]

    def get_queryset(self):
        if self.action in ("list", "retrieve"):
            return get_published_programs()
        return Program.objects.all()

    def get_serializer_class(self):
        if self.action == "list":
            return ProgramListSerializer
        if self.action == "retrieve":
            return ProgramDetailSerializer
        return ProgramCreateUpdateSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticatedOrReadOnly()]
        return [IsAdmin()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({"status": "success", "data": serializer.data})

    def retrieve(self, request, *args, **kwargs):
        program = get_program_detail(slug=kwargs["slug"])
        if not program:
            return Response(
                {"status": "error", "error": {"code": "NOT_FOUND", "message": "Program not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(program)
        return Response({"status": "success", "data": serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        program = create_program(**serializer.validated_data)
        return Response(
            {"status": "success", "data": ProgramDetailSerializer(program).data},
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        program = self.get_object()
        serializer = self.get_serializer(data=request.data, partial=kwargs.get("partial", False))
        serializer.is_valid(raise_exception=True)
        program = update_program(program=program, **serializer.validated_data)
        return Response({"status": "success", "data": ProgramDetailSerializer(program).data})

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        program = self.get_object()
        program.delete()
        return Response(
            {"status": "success", "data": {"message": "Program deleted."}},
            status=status.HTTP_200_OK,
        )
```

- [ ] **Step 4: Write URLs**

Create `algonex-backend/programs/urls.py`:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProgramViewSet

router = DefaultRouter()
router.register(r"", ProgramViewSet, basename="program")

urlpatterns = [
    path("", include(router.urls)),
]
```

Create `algonex-backend/programs/exceptions.py`:
```python
# Reserved for future program-specific exceptions
```

- [ ] **Step 5: Add programs URLs to main config**

In `algonex-backend/config/urls.py`, add:
```python
path("api/v1/programs/", include("programs.urls")),
```

After the portfolio include line.

- [ ] **Step 6: Run the full test suite to ensure nothing is broken**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest -v
```
Expected: All existing tests pass + programs tests pass.

- [ ] **Step 7: Commit**

```bash
git add programs/ config/urls.py
git commit -m "feat(programs): add views, serializers, filters, and URL routing"
```

---

### Task 6: Program View Integration Tests

**Files:**
- Create: `algonex-backend/programs/tests/test_views.py`

- [ ] **Step 1: Write view integration tests**

Create `algonex-backend/programs/tests/test_views.py`:
```python
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from programs.models import Program

User = get_user_model()


def _create_program(**kwargs):
    defaults = {
        "title": "Test Program",
        "description": "Desc",
        "program_type": "fellowship",
        "duration": "3 months",
        "location": "Hyderabad",
        "eligibility_criteria": "Open",
        "application_deadline": date.today() + timedelta(days=30),
        "start_date": date.today() + timedelta(days=60),
        "end_date": date.today() + timedelta(days=150),
        "capacity": 20,
        "is_published": True,
    }
    defaults.update(kwargs)
    return Program.objects.create(**defaults)


class TestProgramListView(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_list_returns_published_only(self):
        _create_program(title="Published")
        _create_program(title="Draft", is_published=False)
        response = self.client.get("/api/v1/programs/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        results = data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Published")

    def test_filter_by_type(self):
        _create_program(title="Fellowship", program_type="fellowship")
        _create_program(title="Internship", program_type="internship")
        response = self.client.get("/api/v1/programs/?program_type=internship")
        results = response.json()["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Internship")


class TestProgramDetailView(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_retrieve_published(self):
        program = _create_program(title="Detail Test")
        response = self.client.get(f"/api/v1/programs/{program.slug}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["title"], "Detail Test")

    def test_retrieve_unpublished_returns_404(self):
        program = _create_program(title="Draft", is_published=False)
        response = self.client.get(f"/api/v1/programs/{program.slug}/")
        self.assertEqual(response.status_code, 404)


class TestProgramAdminViews(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.com", password="pass123", role="admin"
        )
        self.student = User.objects.create_user(
            email="student@test.com", password="pass123", role="student"
        )
        self.client = APIClient()

    def test_create_requires_admin(self):
        self.client.force_authenticate(self.student)
        response = self.client.post("/api/v1/programs/", {
            "title": "New Program",
            "description": "Test",
            "program_type": "fellowship",
            "duration": "3 months",
            "location": "Online",
            "eligibility_criteria": "Open",
            "application_deadline": str(date.today() + timedelta(days=30)),
            "start_date": str(date.today() + timedelta(days=60)),
            "end_date": str(date.today() + timedelta(days=150)),
            "capacity": 10,
        })
        self.assertEqual(response.status_code, 403)

    def test_create_as_admin(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/v1/programs/", {
            "title": "Admin Program",
            "description": "Test",
            "program_type": "internship",
            "duration": "6 weeks",
            "location": "Remote",
            "eligibility_criteria": "B.Tech",
            "application_deadline": str(date.today() + timedelta(days=30)),
            "start_date": str(date.today() + timedelta(days=60)),
            "end_date": str(date.today() + timedelta(days=100)),
            "capacity": 15,
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"]["title"], "Admin Program")

    def test_delete_as_admin(self):
        self.client.force_authenticate(self.admin)
        program = _create_program()
        response = self.client.delete(f"/api/v1/programs/{program.slug}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Program.objects.count(), 0)
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest programs/tests/test_views.py -v
```
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add programs/tests/test_views.py
git commit -m "test(programs): add view integration tests"
```

---

## Chunk 2: Registration Profile & Registration Services

### Task 7: RegistrationProfile Model

**Files:**
- Modify: `algonex-backend/signin/models.py`

- [ ] **Step 1: Add RegistrationProfile model**

In `algonex-backend/signin/models.py`, **keep** the existing `SigninProfile` and **add** the new model below it:

```python
from django.conf import settings
from common.mixins import TimestampMixin


class RegistrationProfile(TimestampMixin, models.Model):
    """Extended profile data collected during progressive registration."""

    DEGREE_CHOICES = [
        ("diploma", "Diploma"),
        ("bachelors", "Bachelors"),
        ("masters", "Masters"),
        ("phd", "PhD"),
        ("other", "Other"),
    ]

    EMPLOYMENT_CHOICES = [
        ("student", "Student"),
        ("employed", "Employed"),
        ("freelancer", "Freelancer"),
        ("unemployed", "Unemployed"),
    ]

    INTEREST_CHOICES = [
        ("fellowship", "Fellowship"),
        ("internship", "Internship"),
        ("workshop", "Workshop"),
        ("course", "Course"),
        ("other", "Other"),
    ]

    # Link to user
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="registration_profile",
    )

    # Address
    street_address = models.TextField(blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default="India")
    pincode = models.CharField(max_length=10, blank=True)

    # Education
    college = models.CharField(max_length=255)
    branch = models.CharField(max_length=100)
    degree_level = models.CharField(max_length=20, choices=DEGREE_CHOICES)
    graduation_year = models.PositiveIntegerField()
    current_year = models.CharField(max_length=20, blank=True)

    # Employment
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_CHOICES)
    years_of_experience = models.PositiveIntegerField(default=0)

    # Training interest
    interest_category = models.CharField(max_length=20, choices=INTEREST_CHOICES)
    program = models.ForeignKey(
        "programs.Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="registration_profiles",
    )
    specific_interests = models.TextField(blank=True)

    # Meta
    terms_agreed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.get_interest_category_display()}"
```

- [ ] **Step 2: Run makemigrations and migrate**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 manage.py makemigrations signin
python3.11 manage.py migrate
```

- [ ] **Step 3: Now update programs/selectors.py to use the annotation**

Update `algonex-backend/programs/selectors.py` to the full version with annotation (from the "Full selectors.py" in Task 4):
```python
from django.db.models import Count
from .models import Program


def get_published_programs():
    """Return published programs with registration count annotation.
    Filtering is handled by django-filter via ProgramFilter in views.
    """
    return Program.objects.filter(is_published=True).annotate(
        registration_count=Count("registration_profiles"),
    )


def get_program_detail(*, slug):
    """Return a single published program by slug."""
    return Program.objects.filter(slug=slug, is_published=True).first()
```

And uncomment the annotation test in `programs/tests/test_selectors.py`.

- [ ] **Step 4: Run full test suite**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest -v
```
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add signin/models.py signin/migrations/ programs/selectors.py programs/tests/test_selectors.py
git commit -m "feat(signin): add RegistrationProfile model with OneToOne to User"
```

---

### Task 8: Registration Services

**Files:**
- Create: `algonex-backend/signin/services.py`
- Create: `algonex-backend/signin/exceptions.py`
- Create: `algonex-backend/signin/tests/__init__.py`
- Create: `algonex-backend/signin/tests/test_services.py`

- [ ] **Step 1: Write exceptions**

Create `algonex-backend/signin/exceptions.py`:
```python
from rest_framework.exceptions import APIException
from rest_framework import status


class UserNotFound(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "No account found with this email."
    default_code = "USER_NOT_FOUND"


class TermsNotAgreed(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "You must agree to the terms and conditions."
    default_code = "TERMS_NOT_AGREED"
```

- [ ] **Step 2: Write failing service tests**

```bash
mkdir -p /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend/signin/tests
touch /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend/signin/tests/__init__.py
```

Create `algonex-backend/signin/tests/test_services.py`:
```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from signin.models import RegistrationProfile
from signin.services import register_step1, register_step2
from signin.exceptions import UserNotFound, TermsNotAgreed
from programs.models import Program
from datetime import date, timedelta

User = get_user_model()


class TestRegisterStep1(TestCase):
    def test_creates_new_user(self):
        result = register_step1(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="9876543210",
        )
        self.assertTrue(result["is_new"])
        user = User.objects.get(email="john@example.com")
        self.assertEqual(user.first_name, "John")
        self.assertFalse(user.has_usable_password())

    def test_existing_user_no_password(self):
        User.objects.create_user(email="john@example.com", password=None, first_name="John", last_name="Doe")
        result = register_step1(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="9876543210",
        )
        self.assertFalse(result["is_new"])
        self.assertFalse(result["has_password"])

    def test_existing_user_with_password(self):
        User.objects.create_user(email="john@example.com", password="pass123", first_name="John", last_name="Doe")
        result = register_step1(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="9876543210",
        )
        self.assertFalse(result["is_new"])
        self.assertTrue(result["has_password"])

    def test_username_collision_handled(self):
        User.objects.create_user(email="john@gmail.com", password="pass123", first_name="John", last_name="G")
        result = register_step1(
            first_name="John",
            last_name="Yahoo",
            email="john@yahoo.com",
            phone="9876543210",
        )
        self.assertTrue(result["is_new"])
        user = User.objects.get(email="john@yahoo.com")
        self.assertNotEqual(user.username, "john")  # should have suffix


class TestRegisterStep2(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="john@example.com", password=None,
            first_name="John", last_name="Doe",
        )

    def test_creates_profile(self):
        result = register_step2(
            email="john@example.com",
            city="Hyderabad",
            state="Telangana",
            country="India",
            college="JNTU",
            branch="CSE",
            degree_level="bachelors",
            graduation_year=2025,
            employment_status="student",
            interest_category="fellowship",
            terms_agreed=True,
        )
        self.assertTrue(result["registered"])
        profile = RegistrationProfile.objects.get(user=self.user)
        self.assertEqual(profile.city, "Hyderabad")
        self.assertEqual(profile.interest_category, "fellowship")

    def test_updates_existing_profile(self):
        RegistrationProfile.objects.create(
            user=self.user, city="Old City", state="Old State",
            college="Old College", branch="Old Branch",
            degree_level="bachelors", graduation_year=2024,
            employment_status="student", interest_category="course",
            terms_agreed=True,
        )
        register_step2(
            email="john@example.com",
            city="New City",
            state="Telangana",
            country="India",
            college="JNTU",
            branch="CSE",
            degree_level="masters",
            graduation_year=2026,
            employment_status="student",
            interest_category="fellowship",
            terms_agreed=True,
        )
        profile = RegistrationProfile.objects.get(user=self.user)
        self.assertEqual(profile.city, "New City")
        self.assertEqual(profile.degree_level, "masters")

    def test_links_to_program(self):
        program = Program.objects.create(
            title="AI Fellowship",
            description="Test",
            program_type="fellowship",
            duration="3 months",
            location="Online",
            eligibility_criteria="Open",
            application_deadline=date.today() + timedelta(days=30),
            start_date=date.today() + timedelta(days=60),
            end_date=date.today() + timedelta(days=150),
            capacity=20,
            is_published=True,
        )
        register_step2(
            email="john@example.com",
            city="Hyderabad",
            state="Telangana",
            college="JNTU",
            branch="CSE",
            degree_level="bachelors",
            graduation_year=2025,
            employment_status="student",
            interest_category="fellowship",
            program_slug=program.slug,
            terms_agreed=True,
        )
        profile = RegistrationProfile.objects.get(user=self.user)
        self.assertEqual(profile.program, program)

    def test_nonexistent_email_raises(self):
        with self.assertRaises(UserNotFound):
            register_step2(
                email="nobody@example.com",
                city="City", state="State",
                college="College", branch="Branch",
                degree_level="bachelors", graduation_year=2025,
                employment_status="student", interest_category="course",
                terms_agreed=True,
            )

    def test_terms_not_agreed_raises(self):
        with self.assertRaises(TermsNotAgreed):
            register_step2(
                email="john@example.com",
                city="City", state="State",
                college="College", branch="Branch",
                degree_level="bachelors", graduation_year=2025,
                employment_status="student", interest_category="course",
                terms_agreed=False,
            )
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest signin/tests/test_services.py -v
```
Expected: FAIL — import error.

- [ ] **Step 4: Write services implementation**

Create `algonex-backend/signin/services.py`:
```python
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from .models import RegistrationProfile
from .exceptions import UserNotFound, TermsNotAgreed

User = get_user_model()


def register_step1(*, first_name, last_name, email, phone):
    """Create or find a user by email. No password set for new users."""
    try:
        user = User.objects.get(email=email)
        return {
            "is_new": False,
            "has_password": user.has_usable_password(),
        }
    except User.DoesNotExist:
        pass

    # Create new user with no password
    # Use savepoints for PostgreSQL compatibility on IntegrityError
    from django.db import transaction
    username = email.split("@")[0]
    user = None
    for suffix in [""] + [str(i) for i in range(1, 100)]:
        candidate = f"{username}{suffix}"
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    password=None,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                    username=candidate,
                )
            break
        except IntegrityError:
            continue

    if user is None:
        raise ValueError(f"Could not generate unique username for {email}")

    return {"is_new": True}


def register_step2(*, email, program_slug=None, terms_agreed, **profile_data):
    """Create or update RegistrationProfile for the user."""
    if not terms_agreed:
        raise TermsNotAgreed()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise UserNotFound()

    # Resolve program if slug provided
    program = None
    if program_slug:
        from programs.models import Program
        program = Program.objects.filter(slug=program_slug, is_published=True).first()

    profile_data["program"] = program
    profile_data["terms_agreed"] = terms_agreed

    RegistrationProfile.objects.update_or_create(
        user=user,
        defaults=profile_data,
    )

    return {"registered": True}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest signin/tests/test_services.py -v
```
Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add signin/services.py signin/exceptions.py signin/tests/
git commit -m "feat(signin): add register_step1/step2 services with tests"
```

---

### Task 9: Registration Views & URLs

**Files:**
- Modify: `algonex-backend/signin/serializers.py`
- Modify: `algonex-backend/signin/views.py`
- Create or modify: `algonex-backend/signin/urls.py`

- [ ] **Step 1: Write serializers**

Replace `algonex-backend/signin/serializers.py` contents (keep the old `SigninProfileSerializer` and add new ones):
```python
from rest_framework import serializers
from .models import SigninProfile


class SigninProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SigninProfile
        fields = '__all__'


class Step1Serializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)


class Step2Serializer(serializers.Serializer):
    email = serializers.EmailField()

    # Address
    street_address = serializers.CharField(required=False, allow_blank=True, default="")
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    country = serializers.CharField(max_length=100, default="India")
    pincode = serializers.CharField(max_length=10, required=False, allow_blank=True, default="")

    # Education
    college = serializers.CharField(max_length=255)
    branch = serializers.CharField(max_length=100)
    degree_level = serializers.ChoiceField(choices=["diploma", "bachelors", "masters", "phd", "other"])
    graduation_year = serializers.IntegerField(min_value=1990, max_value=2040)
    current_year = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")

    # Employment
    employment_status = serializers.ChoiceField(choices=["student", "employed", "freelancer", "unemployed"])
    years_of_experience = serializers.IntegerField(min_value=0, default=0)

    # Training interest
    interest_category = serializers.ChoiceField(choices=["fellowship", "internship", "workshop", "course", "other"])
    program_slug = serializers.CharField(required=False, allow_blank=True, default="")
    specific_interests = serializers.CharField(required=False, allow_blank=True, default="")

    # Terms
    terms_agreed = serializers.BooleanField()
```

- [ ] **Step 2: Write views**

Add to `algonex-backend/signin/views.py` (keep existing `SigninFormView`, add new views):

```python
# ... existing imports and SigninFormView stay ...

from .serializers import Step1Serializer, Step2Serializer
from .services import register_step1, register_step2


class RegisterStep1View(APIView):
    """POST /api/v1/register/step1/ — create or find user by email."""
    throttle_scope = "registration"

    def post(self, request):
        serializer = Step1Serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = register_step1(**serializer.validated_data)

        status_code = status.HTTP_201_CREATED if result.get("is_new") else status.HTTP_200_OK
        data = {k: v for k, v in result.items()}
        if result.get("has_password"):
            data["message"] = "Account exists. Login to manage your data."

        return Response({"status": "success", "data": data}, status=status_code)


class RegisterStep2View(APIView):
    """POST /api/v1/register/step2/ — create or update registration profile."""
    throttle_scope = "registration"

    def post(self, request):
        serializer = Step2Serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = register_step2(**serializer.validated_data)
        return Response({"status": "success", "data": result}, status=status.HTTP_200_OK)
```

- [ ] **Step 3: Write URLs**

Replace `algonex-backend/signin/urls.py` (file may already exist with old content):
```python
from django.urls import path
from .views import SigninFormView, RegisterStep1View, RegisterStep2View

urlpatterns = [
    path("signin/", SigninFormView.as_view(), name="signin-form"),
    path("step1/", RegisterStep1View.as_view(), name="register-step1"),
    path("step2/", RegisterStep2View.as_view(), name="register-step2"),
]
```

Note: The legacy `SigninFormView` will be at `/api/v1/register/signin/`. If it needs to stay at its original path, add a separate include in `config/urls.py`.

- [ ] **Step 4: Add signin URLs to main config**

In `algonex-backend/config/urls.py`, add:
```python
path("api/v1/register/", include("signin.urls")),
```

- [ ] **Step 5: Run full test suite**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest -v
```

- [ ] **Step 6: Commit**

```bash
git add signin/ config/urls.py
git commit -m "feat(signin): add registration step1/step2 views and URL routing"
```

---

### Task 10: Registration View Integration Tests

**Files:**
- Create: `algonex-backend/signin/tests/test_views.py`

- [ ] **Step 1: Write view tests**

Create `algonex-backend/signin/tests/test_views.py`:
```python
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from programs.models import Program

User = get_user_model()


class TestRegisterStep1View(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_creates_new_user(self):
        response = self.client.post("/api/v1/register/step1/", {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "phone": "9876543210",
        })
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data["data"]["is_new"])

    def test_existing_user_with_password(self):
        User.objects.create_user(email="john@example.com", password="pass123", first_name="John", last_name="Doe")
        response = self.client.post("/api/v1/register/step1/", {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "phone": "9876543210",
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertFalse(data["is_new"])
        self.assertTrue(data["has_password"])
        self.assertIn("message", data)

    def test_invalid_email_rejected(self):
        response = self.client.post("/api/v1/register/step1/", {
            "first_name": "John",
            "last_name": "Doe",
            "email": "not-an-email",
            "phone": "9876543210",
        })
        self.assertEqual(response.status_code, 400)


class TestRegisterStep2View(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="john@example.com", password=None,
            first_name="John", last_name="Doe",
        )

    def test_creates_profile(self):
        response = self.client.post("/api/v1/register/step2/", {
            "email": "john@example.com",
            "city": "Hyderabad",
            "state": "Telangana",
            "country": "India",
            "college": "JNTU",
            "branch": "CSE",
            "degree_level": "bachelors",
            "graduation_year": 2025,
            "employment_status": "student",
            "interest_category": "fellowship",
            "terms_agreed": True,
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["data"]["registered"])

    def test_nonexistent_email_returns_404(self):
        response = self.client.post("/api/v1/register/step2/", {
            "email": "nobody@example.com",
            "city": "City", "state": "State",
            "college": "College", "branch": "Branch",
            "degree_level": "bachelors", "graduation_year": 2025,
            "employment_status": "student", "interest_category": "course",
            "terms_agreed": True,
        })
        self.assertEqual(response.status_code, 404)

    def test_terms_not_agreed_returns_400(self):
        response = self.client.post("/api/v1/register/step2/", {
            "email": "john@example.com",
            "city": "City", "state": "State",
            "college": "College", "branch": "Branch",
            "degree_level": "bachelors", "graduation_year": 2025,
            "employment_status": "student", "interest_category": "course",
            "terms_agreed": False,
        })
        self.assertEqual(response.status_code, 400)

    def test_with_program_slug(self):
        program = Program.objects.create(
            title="AI Fellowship",
            description="Test",
            program_type="fellowship",
            duration="3 months",
            location="Online",
            eligibility_criteria="Open",
            application_deadline=date.today() + timedelta(days=30),
            start_date=date.today() + timedelta(days=60),
            end_date=date.today() + timedelta(days=150),
            capacity=20,
            is_published=True,
        )
        response = self.client.post("/api/v1/register/step2/", {
            "email": "john@example.com",
            "city": "Hyderabad", "state": "Telangana",
            "college": "JNTU", "branch": "CSE",
            "degree_level": "bachelors", "graduation_year": 2025,
            "employment_status": "student", "interest_category": "fellowship",
            "program_slug": program.slug,
            "terms_agreed": True,
        })
        self.assertEqual(response.status_code, 200)
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest signin/tests/test_views.py -v
```
Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add signin/tests/test_views.py
git commit -m "test(signin): add registration view integration tests"
```

---

## Chunk 3: Two-Step Login & Auth Views

### Task 11: Auth Views — CheckEmail, SendSetupEmail, SetPassword

**Files:**
- Modify: `algonex-backend/accounts/serializers.py`
- Modify: `algonex-backend/accounts/views.py`
- Modify: `algonex-backend/accounts/urls.py`

- [ ] **Step 1: Read existing accounts/serializers.py and accounts/views.py**

Read both files to understand what already exists before adding new code.

- [ ] **Step 2: Add new serializers**

Add to `algonex-backend/accounts/serializers.py`:
```python
class CheckEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class SetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField(min_length=8)

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data
```

- [ ] **Step 3: Add new views**

Add to `algonex-backend/accounts/views.py`:
```python
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as http_status

User = get_user_model()


class CheckEmailView(APIView):
    """POST /api/v1/auth/check-email/ — check if email exists and has password."""
    throttle_scope = "auth_check"

    def post(self, request):
        from .serializers import CheckEmailSerializer
        serializer = CheckEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        try:
            user = User.objects.get(email=email)
            return Response({
                "status": "success",
                "data": {
                    "exists": True,
                    "has_password": user.has_usable_password(),
                },
            })
        except User.DoesNotExist:
            return Response({
                "status": "success",
                "data": {"exists": False, "has_password": False},
            })


class SendSetupEmailView(APIView):
    """POST /api/v1/auth/send-setup-email/ — send password setup link."""
    throttle_scope = "auth_check"

    def post(self, request):
        from .serializers import CheckEmailSerializer
        serializer = CheckEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"status": "error", "error": {"code": "USER_NOT_FOUND", "message": "No account found with this email."}},
                status=http_status.HTTP_404_NOT_FOUND,
            )

        if user.has_usable_password():
            return Response(
                {"status": "error", "error": {"code": "PASSWORD_ALREADY_SET", "message": "This account already has a password. Please login."}},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        # Generate token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        setup_link = f"{frontend_url}/set-password?token={token}&uid={uid}"

        send_mail(
            subject="Set up your Algonex password",
            message=f"Hi {user.first_name},\n\nClick the link below to set up your password:\n\n{setup_link}\n\nThis link will expire in 3 days.\n\nAlgonex Team",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({"status": "success", "data": {"message": "Password setup email sent."}})


class SetPasswordView(APIView):
    """POST /api/v1/auth/set-password/ — set password using token."""

    def post(self, request):
        from .serializers import SetPasswordSerializer
        serializer = SetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        password = serializer.validated_data["password"]

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"status": "error", "error": {"code": "INVALID_TOKEN", "message": "Invalid or expired link."}},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"status": "error", "error": {"code": "INVALID_TOKEN", "message": "Invalid or expired link."}},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save()

        return Response({"status": "success", "data": {"message": "Password set successfully."}})
```

- [ ] **Step 4: Add new URL patterns**

In `algonex-backend/accounts/urls.py`, add the new auth endpoints:
```python
from .views import GoogleLoginView, GitHubLoginView, CheckEmailView, SendSetupEmailView, SetPasswordView

# Add these to urlpatterns:
path("check-email/", CheckEmailView.as_view(), name="check_email"),
path("send-setup-email/", SendSetupEmailView.as_view(), name="send_setup_email"),
path("set-password/", SetPasswordView.as_view(), name="set_password"),
```

- [ ] **Step 5: Commit**

```bash
git add accounts/
git commit -m "feat(accounts): add check-email, send-setup-email, set-password auth views"
```

---

### Task 12: Auth View Tests

**Files:**
- Create: `algonex-backend/accounts/tests/test_auth_views.py`

- [ ] **Step 1: Create test directory if needed**

```bash
mkdir -p /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend/accounts/tests
touch /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend/accounts/tests/__init__.py
```

- [ ] **Step 2: Write auth view tests**

Create `algonex-backend/accounts/tests/test_auth_views.py`:
```python
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core import mail
from rest_framework.test import APIClient

User = get_user_model()


class TestCheckEmailView(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_existing_user_with_password(self):
        User.objects.create_user(email="john@example.com", password="pass123")
        response = self.client.post("/api/v1/auth/check-email/", {"email": "john@example.com"})
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertTrue(data["exists"])
        self.assertTrue(data["has_password"])

    def test_existing_user_without_password(self):
        User.objects.create_user(email="john@example.com", password=None)
        response = self.client.post("/api/v1/auth/check-email/", {"email": "john@example.com"})
        data = response.json()["data"]
        self.assertTrue(data["exists"])
        self.assertFalse(data["has_password"])

    def test_nonexistent_user(self):
        response = self.client.post("/api/v1/auth/check-email/", {"email": "nobody@example.com"})
        data = response.json()["data"]
        self.assertFalse(data["exists"])

    def test_invalid_email(self):
        response = self.client.post("/api/v1/auth/check-email/", {"email": "not-email"})
        self.assertEqual(response.status_code, 400)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class TestSendSetupEmailView(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_sends_email_for_passwordless_user(self):
        User.objects.create_user(email="john@example.com", password=None, first_name="John")
        response = self.client.post("/api/v1/auth/send-setup-email/", {"email": "john@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("set-password", mail.outbox[0].body)

    def test_rejects_user_with_password(self):
        User.objects.create_user(email="john@example.com", password="pass123")
        response = self.client.post("/api/v1/auth/send-setup-email/", {"email": "john@example.com"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "PASSWORD_ALREADY_SET")

    def test_rejects_nonexistent_user(self):
        response = self.client.post("/api/v1/auth/send-setup-email/", {"email": "nobody@example.com"})
        self.assertEqual(response.status_code, 404)


class TestSetPasswordView(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="john@example.com", password=None)
        self.token = default_token_generator.make_token(self.user)
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))

    def test_sets_password_with_valid_token(self):
        response = self.client.post("/api/v1/auth/set-password/", {
            "uid": self.uid,
            "token": self.token,
            "password": "newpass123",
            "confirm_password": "newpass123",
        })
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpass123"))

    def test_rejects_invalid_token(self):
        response = self.client.post("/api/v1/auth/set-password/", {
            "uid": self.uid,
            "token": "invalid-token",
            "password": "newpass123",
            "confirm_password": "newpass123",
        })
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "INVALID_TOKEN")

    def test_rejects_password_mismatch(self):
        response = self.client.post("/api/v1/auth/set-password/", {
            "uid": self.uid,
            "token": self.token,
            "password": "newpass123",
            "confirm_password": "different",
        })
        self.assertEqual(response.status_code, 400)

    def test_token_invalidated_after_use(self):
        # Set password first time
        self.client.post("/api/v1/auth/set-password/", {
            "uid": self.uid,
            "token": self.token,
            "password": "newpass123",
            "confirm_password": "newpass123",
        })
        # Try same token again
        response = self.client.post("/api/v1/auth/set-password/", {
            "uid": self.uid,
            "token": self.token,
            "password": "anotherpass",
            "confirm_password": "anotherpass",
        })
        self.assertEqual(response.status_code, 400)
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest accounts/tests/test_auth_views.py -v
```
Expected: All PASS.

- [ ] **Step 4: Commit**

```bash
git add accounts/tests/
git commit -m "test(accounts): add auth view tests for check-email, send-setup-email, set-password"
```

---

## Chunk 4: Seed Data & Final Integration

### Task 13: Seed Programs Command

**Files:**
- Create: `algonex-backend/programs/management/commands/seed_programs.py`

- [ ] **Step 1: Write seed command**

Create `algonex-backend/programs/management/commands/seed_programs.py`:
```python
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from programs.models import Program


PROGRAMS = [
    {
        "title": "AI/ML Research Fellowship",
        "description": "## About\n\nA 3-month intensive fellowship focused on applied AI/ML research...",
        "program_type": "fellowship",
        "duration": "3 months",
        "stipend": "₹25,000/month",
        "location": "Hyderabad",
        "is_remote": False,
        "eligibility_criteria": "## Requirements\n\n- B.Tech/M.Tech in CS, ECE, or related fields\n- Strong Python skills\n- Basic understanding of ML concepts",
        "min_degree_level": "bachelors",
        "eligible_branches": "CSE, ECE, IT, AI&ML",
        "capacity": 15,
        "is_published": True,
        "is_featured": True,
    },
    {
        "title": "Full-Stack Development Internship",
        "description": "## About\n\nA 6-week hands-on internship building real-world web applications...",
        "program_type": "internship",
        "duration": "6 weeks",
        "stipend": "₹15,000/month",
        "location": "Remote",
        "is_remote": True,
        "eligibility_criteria": "## Requirements\n\n- Currently pursuing B.Tech or equivalent\n- Basic HTML/CSS/JS knowledge\n- Enthusiasm to learn React and Django",
        "min_degree_level": "bachelors",
        "eligible_branches": "CSE, IT, MCA",
        "capacity": 30,
        "is_published": True,
        "is_featured": True,
    },
    {
        "title": "Cloud & DevOps Fellowship",
        "description": "## About\n\nLearn cloud infrastructure, CI/CD, and DevOps practices...",
        "program_type": "fellowship",
        "duration": "4 months",
        "stipend": "₹20,000/month",
        "location": "Hyderabad",
        "is_remote": False,
        "eligibility_criteria": "## Requirements\n\n- B.Tech in CS/IT or equivalent\n- Linux basics\n- Familiarity with at least one programming language",
        "min_degree_level": "bachelors",
        "eligible_branches": "CSE, IT, ECE",
        "capacity": 10,
        "is_published": True,
        "is_featured": False,
    },
    {
        "title": "Data Analytics Internship",
        "description": "## About\n\nPractical data analytics internship covering SQL, Python, and visualization...",
        "program_type": "internship",
        "duration": "8 weeks",
        "stipend": "₹10,000/month",
        "location": "Remote",
        "is_remote": True,
        "eligibility_criteria": "## Requirements\n\n- Any degree stream welcome\n- Basic Excel skills\n- Interest in data and analytics",
        "eligible_branches": "Any",
        "capacity": 50,
        "is_published": True,
        "is_featured": False,
    },
]


class Command(BaseCommand):
    help = "Seed sample fellowship and internship programs"

    def handle(self, *args, **options):
        created = 0
        for data in PROGRAMS:
            data["application_deadline"] = date.today() + timedelta(days=45)
            data["start_date"] = date.today() + timedelta(days=60)
            data["end_date"] = date.today() + timedelta(days=60 + 90)

            if not Program.objects.filter(title=data["title"]).exists():
                Program.objects.create(**data)
                created += 1
                self.stdout.write(f"  Created: {data['title']}")
            else:
                self.stdout.write(f"  Skipped (exists): {data['title']}")

        self.stdout.write(self.style.SUCCESS(f"\nDone. Created {created} programs."))
```

- [ ] **Step 2: Test the seed command**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 manage.py seed_programs
```
Expected: "Done. Created 4 programs."

- [ ] **Step 3: Commit**

```bash
git add programs/management/
git commit -m "feat(programs): add seed_programs management command"
```

---

### Task 14: Full Integration Test Run

- [ ] **Step 1: Run the full test suite**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 -m pytest -v
```
Expected: All existing tests (91) + all new tests pass.

- [ ] **Step 2: Verify the server starts**

```bash
cd /Users/saikumar/Documents/github/Algonex_New_Website/algonex-backend
python3.11 manage.py runserver --noreload &
sleep 2
# Quick smoke tests
curl -s http://localhost:8000/api/v1/programs/ | python3.11 -m json.tool
curl -s -X POST http://localhost:8000/api/v1/register/step1/ -H "Content-Type: application/json" -d '{"first_name":"Test","last_name":"User","email":"test@example.com","phone":"1234567890"}' | python3.11 -m json.tool
curl -s -X POST http://localhost:8000/api/v1/auth/check-email/ -H "Content-Type: application/json" -d '{"email":"test@example.com"}' | python3.11 -m json.tool
kill %1
```

- [ ] **Step 3: Update the spec document backend status table**

Update the Backend Status table in `docs/superpowers/specs/2026-04-05-registration-and-programs-design.md` to mark all components as "done".

- [ ] **Step 4: Final commit (if any uncommitted changes remain)**

```bash
git add docs/superpowers/specs/2026-04-05-registration-and-programs-design.md
git commit -m "docs: update spec backend status to complete"
```
