# Auth & Users Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authentication and user management system — the foundation for all other Algonex features — including Django project restructuring, custom User model, JWT auth, Google/GitHub OAuth, role-based permissions, and React frontend auth pages.

**Architecture:** 4-layer Django architecture (API → Service → Selector → Model) with DRF. React SPA with Ant Design, centralized theme, axios API client with JWT interceptor, and AuthContext for global user state.

**Tech Stack:** Django 5.x, DRF, dj-rest-auth, django-allauth, simplejwt, React 19, Ant Design 5, axios

**Spec:** `docs/superpowers/specs/2026-04-03-algonex-platform-redesign.md`

**Important context about existing codebase:**
- Backend already has: `config/` (single `settings.py`), `signin/` app (a profile form, NOT real auth), `contactform/` app, PostgreSQL configured (remote server at 15.206.128.228)
- The `signin` app is a profile/interest form (SigninProfile model), NOT authentication. It will be replaced by the `accounts` app.
- No `requirements.txt` exists yet — dependencies installed manually
- Frontend already has: React 19, Vite, Ant Design, Tailwind, SCSS, react-router-dom v7
- The spec says SQLite but the existing project uses PostgreSQL — **keep PostgreSQL** since it's already configured and better for concurrent writes

---

## Chunk 1: Backend Scaffolding & Project Restructuring

### Task 1: Create requirements.txt

**Files:**
- Create: `algonex-backend/requirements.txt`

- [ ] **Step 1: Create requirements.txt with all dependencies**

```txt
# Core
Django>=5.2,<6.0
djangorestframework>=3.15,<4.0
django-cors-headers>=4.3,<5.0
django-filter>=24.0,<25.0
Pillow>=10.0,<11.0

# Auth
dj-rest-auth[with_social]>=7.0,<8.0
django-allauth>=65.0,<66.0
djangorestframework-simplejwt>=5.3,<6.0

# Database
psycopg2-binary>=2.9,<3.0

# Testing
pytest>=8.0,<9.0
pytest-django>=4.8,<5.0
pytest-cov>=5.0,<6.0
factory-boy>=3.3,<4.0
```

- [ ] **Step 2: Install dependencies**

Run: `cd algonex-backend && pip install -r requirements.txt`
Expected: All packages install successfully

- [ ] **Step 3: Commit**

```bash
git add algonex-backend/requirements.txt
git commit -m "feat(backend): add requirements.txt with auth and testing dependencies"
```

---

### Task 2: Split settings into base/development/production/testing

**Files:**
- Create: `algonex-backend/config/settings/__init__.py`
- Create: `algonex-backend/config/settings/base.py`
- Create: `algonex-backend/config/settings/development.py`
- Create: `algonex-backend/config/settings/production.py`
- Create: `algonex-backend/config/settings/testing.py`
- Delete: `algonex-backend/config/settings.py` (after migration)

- [ ] **Step 1: Create settings package `__init__.py`**

```python
# algonex-backend/config/settings/__init__.py
```

Empty file — just makes it a package.

- [ ] **Step 2: Create `base.py` from existing settings.py**

```python
# algonex-backend/config/settings/base.py
"""
Shared settings for all environments.
"""
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    # Third party
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "django_filters",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.github",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    # Local apps
    "accounts",
    "contactform",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
MEDIA_URL = "media/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom user model
AUTH_USER_MODEL = "accounts.User"

# Site framework (required by allauth)
SITE_ID = 1

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
    ],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.StandardPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "EXCEPTION_HANDLER": "common.exception_handler.custom_exception_handler",
}

# Simple JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# dj-rest-auth
REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_COOKIE": None,
    "JWT_AUTH_REFRESH_COOKIE": None,
    "JWT_AUTH_HTTPONLY": False,
    "USER_DETAILS_SERIALIZER": "accounts.serializers.UserDetailSerializer",
    "REGISTER_SERIALIZER": "accounts.serializers.CustomRegisterSerializer",
}

# django-allauth
ACCOUNT_AUTHENTICATION_METHOD = "email"
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_EMAIL_VERIFICATION = "none"
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]
```

- [ ] **Step 3: Create `development.py`**

```python
# algonex-backend/config/settings/development.py
"""
Development settings — DEBUG on, console email, PostgreSQL.
"""
from .base import *  # noqa: F401,F403

DEBUG = True
SECRET_KEY = "django-insecure-dev-only-key-change-in-production"

ALLOWED_HOSTS = ["*"]

import os

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "postgres"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "psql"),
        "HOST": os.environ.get("DB_HOST", "15.206.128.228"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

MEDIA_ROOT = BASE_DIR / "media"

# CORS — allow Vite dev server
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Console email for password reset in dev
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
```

- [ ] **Step 4: Create `production.py`**

```python
# algonex-backend/config/settings/production.py
"""
Production settings — read secrets from environment.
"""
import os
from .base import *  # noqa: F401,F403

DEBUG = False
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "algonex"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}

MEDIA_ROOT = BASE_DIR / "media"

CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
```

- [ ] **Step 5: Create `testing.py`**

```python
# algonex-backend/config/settings/testing.py
"""
Testing settings — fast, in-memory where possible.
"""
from .base import *  # noqa: F401,F403

DEBUG = False
SECRET_KEY = "test-secret-key-not-for-production"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

MEDIA_ROOT = BASE_DIR / "test_media"
```

- [ ] **Step 6: Update `manage.py` to default to development settings**

Change `os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')` to:

```python
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
```

- [ ] **Step 7: Update `config/wsgi.py` and `config/asgi.py`**

Same change — default to `config.settings.production` for deployment:

```python
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")
```

- [ ] **Step 8: Delete old `config/settings.py`**

```bash
rm algonex-backend/config/settings.py
```

- [ ] **Step 9: Create `pytest.ini` (or `pyproject.toml` section)**

```ini
# algonex-backend/pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.testing
python_files = tests.py test_*.py *_tests.py
python_classes = Test*
python_functions = test_*
```

- [ ] **Step 10: Verify Django starts with new settings**

Run: `cd algonex-backend && python manage.py check`
Expected: `System check identified no issues`

- [ ] **Step 11: Commit**

```bash
git add algonex-backend/config/settings/ algonex-backend/manage.py algonex-backend/config/wsgi.py algonex-backend/config/asgi.py algonex-backend/pytest.ini
git rm algonex-backend/config/settings.py
git commit -m "refactor(backend): split settings into base/dev/prod/test modules"
```

---

### Task 3: Create common/ shared module

**Files:**
- Create: `algonex-backend/common/__init__.py`
- Create: `algonex-backend/common/exception_handler.py`
- Create: `algonex-backend/common/pagination.py`
- Create: `algonex-backend/common/permissions.py`
- Create: `algonex-backend/common/mixins.py`

- [ ] **Step 1: Write test for custom exception handler**

```python
# algonex-backend/common/tests/test_exception_handler.py
from django.test import TestCase, RequestFactory
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from common.exception_handler import custom_exception_handler
from rest_framework.exceptions import NotFound, ValidationError


class TestCustomExceptionHandler(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.request = self.factory.get("/")

    def test_not_found_returns_error_format(self):
        exc = NotFound("Course not found.")
        response = custom_exception_handler(exc, {"request": self.request})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["status"], "error")
        self.assertEqual(response.data["error"]["code"], "NOT_FOUND")
        self.assertEqual(response.data["error"]["message"], "Course not found.")

    def test_validation_error_returns_details(self):
        exc = ValidationError({"email": ["Enter a valid email."]})
        response = custom_exception_handler(exc, {"request": self.request})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["status"], "error")
        self.assertEqual(response.data["error"]["code"], "VALIDATION_ERROR")
        self.assertIn("email", response.data["error"]["details"])

    def test_non_drf_exception_returns_none(self):
        response = custom_exception_handler(Exception("oops"), {"request": self.request})
        self.assertIsNone(response)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd algonex-backend && python -m pytest common/tests/test_exception_handler.py -v`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement common/__init__.py and exception_handler.py**

```python
# algonex-backend/common/__init__.py
```

```python
# algonex-backend/common/tests/__init__.py
```

```python
# algonex-backend/common/exception_handler.py
from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler to produce consistent error format:
    {"status": "error", "error": {"code": "...", "message": "...", "details": {...}}}
    """
    response = exception_handler(exc, context)

    if response is None:
        return None

    error_code = _get_error_code(exc, response)

    error_body = {
        "code": error_code,
        "message": _get_message(exc),
    }

    if isinstance(exc, ValidationError):
        error_body["code"] = "VALIDATION_ERROR"
        error_body["message"] = "Invalid input."
        error_body["details"] = response.data

    response.data = {
        "status": "error",
        "error": error_body,
    }

    return response


def _get_error_code(exc, response):
    status_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        429: "THROTTLED",
    }
    return status_map.get(response.status_code, "ERROR")


def _get_message(exc):
    if hasattr(exc, "detail"):
        detail = exc.detail
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list):
            return detail[0] if detail else "An error occurred."
    return "An error occurred."
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd algonex-backend && python -m pytest common/tests/test_exception_handler.py -v`
Expected: 3 passed

- [ ] **Step 5: Implement pagination.py, permissions.py, mixins.py**

```python
# algonex-backend/common/pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50

    def get_paginated_response(self, data):
        return Response({
            "status": "success",
            "data": {
                "results": data,
                "count": self.page.paginator.count,
                "page": self.page.number,
                "page_size": self.get_page_size(self.request),
                "total_pages": self.page.paginator.num_pages,
            },
        })
```

```python
# algonex-backend/common/permissions.py
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsInstructor(BasePermission):
    """Allow access to instructor or admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("instructor", "admin")
        )


class IsAuthenticatedUser(BasePermission):
    """Allow access to any authenticated user (all roles — student, instructor, admin)."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
```

```python
# algonex-backend/common/mixins.py
from django.db import models
from django.utils.text import slugify


class TimestampMixin(models.Model):
    """Adds created_at and updated_at fields."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SlugMixin(models.Model):
    """Adds a unique slug field auto-generated from a `name` or `title` field."""

    slug = models.SlugField(max_length=255, unique=True, blank=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.slug:
            source = getattr(self, "name", None) or getattr(self, "title", "")
            self.slug = slugify(source)
            # Ensure uniqueness
            original_slug = self.slug
            counter = 1
            while self.__class__.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)
```

- [ ] **Step 6: Commit**

```bash
git add algonex-backend/common/
git commit -m "feat(backend): add common module — exception handler, pagination, permissions, mixins"
```

---

### Task 4: Update URL routing with API versioning

**Files:**
- Modify: `algonex-backend/config/urls.py`

- [ ] **Step 1: Update urls.py with versioned API routing**

```python
# algonex-backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/contact/", include("contactform.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

Note: The old `signin` app URLs are removed. The `signin` app will be removed from `INSTALLED_APPS` once the `accounts` app is in place.

- [ ] **Step 2: Commit**

```bash
git add algonex-backend/config/urls.py
git commit -m "refactor(backend): add API v1 URL prefix, remove old signin routes"
```

---

## Chunk 2: User Model & accounts App

### Task 5: Create accounts app with custom User model

**Files:**
- Create: `algonex-backend/accounts/__init__.py`
- Create: `algonex-backend/accounts/models.py`
- Create: `algonex-backend/accounts/admin.py`
- Create: `algonex-backend/accounts/apps.py`
- Create: `algonex-backend/accounts/exceptions.py`
- Create: `algonex-backend/accounts/tests/__init__.py`
- Create: `algonex-backend/accounts/tests/test_models.py`

- [ ] **Step 1: Create the accounts app directory structure**

```bash
cd algonex-backend
mkdir -p accounts/tests
touch accounts/__init__.py accounts/tests/__init__.py
```

- [ ] **Step 2: Write failing test for User model**

```python
# algonex-backend/accounts/tests/test_models.py
from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class TestUserModel(TestCase):
    def test_create_user_with_email(self):
        user = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            first_name="Test",
            last_name="Student",
        )
        self.assertEqual(user.email, "student@test.com")
        self.assertEqual(user.role, "student")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_create_user_auto_generates_username(self):
        user = User.objects.create_user(
            email="auto@test.com",
            password="testpass123",
        )
        self.assertEqual(user.username, "auto")

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            email="admin@test.com",
            password="adminpass123",
        )
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.role, "admin")

    def test_default_role_is_student(self):
        user = User.objects.create_user(
            email="new@test.com",
            password="testpass123",
        )
        self.assertEqual(user.role, "student")

    def test_user_str(self):
        user = User.objects.create_user(
            email="display@test.com",
            password="testpass123",
            first_name="John",
            last_name="Doe",
        )
        self.assertEqual(str(user), "John Doe (display@test.com)")

    def test_role_choices(self):
        user = User.objects.create_user(
            email="instructor@test.com",
            password="testpass123",
            role="instructor",
        )
        self.assertEqual(user.role, "instructor")
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd algonex-backend && python -m pytest accounts/tests/test_models.py -v`
Expected: FAIL (accounts app / model doesn't exist)

- [ ] **Step 4: Implement User model**

```python
# algonex-backend/accounts/apps.py
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"
```

```python
# algonex-backend/accounts/models.py
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom manager that uses email as the unique identifier."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        extra_fields.setdefault("role", "student")
        # Auto-generate username from email
        if "username" not in extra_fields or not extra_fields["username"]:
            extra_fields["username"] = email.split("@")[0]
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("instructor", "Instructor"),
        ("admin", "Admin"),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.TextField(blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    def __str__(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return f"{name} ({self.email})" if name else self.email
```

```python
# algonex-backend/accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "first_name", "last_name", "role", "is_active")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("-date_joined",)

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Profile", {"fields": ("role", "phone", "avatar", "bio")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Profile", {"fields": ("email", "first_name", "last_name", "role")}),
    )
```

```python
# algonex-backend/accounts/exceptions.py
class AccountException(Exception):
    """Base exception for accounts domain."""
    pass
```

```python
# algonex-backend/accounts/services.py
# Service layer for accounts domain logic.
# Currently dj-rest-auth handles auth flows. Add custom business logic here
# as needed (e.g., role promotion, account deactivation).
```

```python
# algonex-backend/accounts/selectors.py
# Selector layer for accounts read queries.
# Add user lookup/filtering functions here as needed by future sub-projects.
```

- [ ] **Step 5: Create and run migrations**

Run: `cd algonex-backend && python manage.py makemigrations accounts && python manage.py migrate`
Expected: Migrations created and applied. Note: since AUTH_USER_MODEL changed, you may need to drop and recreate the database if existing migrations conflict.

If migration conflicts occur (because existing data uses default User):
```bash
cd algonex-backend
python manage.py flush --no-input  # Only if DB has no important data
python manage.py migrate
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd algonex-backend && python -m pytest accounts/tests/test_models.py -v`
Expected: 6 passed

- [ ] **Step 7: Commit**

```bash
git add algonex-backend/accounts/
git commit -m "feat(accounts): add custom User model with role field and email auth"
```

---

### Task 6: User serializers

**Files:**
- Create: `algonex-backend/accounts/serializers.py`
- Create: `algonex-backend/accounts/tests/test_serializers.py`

- [ ] **Step 1: Write failing test for serializers**

```python
# algonex-backend/accounts/tests/test_serializers.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from accounts.serializers import UserDetailSerializer, CustomRegisterSerializer

User = get_user_model()


class TestUserDetailSerializer(TestCase):
    def test_serializes_user_fields(self):
        user = User.objects.create_user(
            email="test@test.com",
            password="testpass123",
            first_name="John",
            last_name="Doe",
            role="student",
            phone="1234567890",
            bio="Test bio",
        )
        serializer = UserDetailSerializer(user)
        data = serializer.data
        self.assertEqual(data["email"], "test@test.com")
        self.assertEqual(data["first_name"], "John")
        self.assertEqual(data["role"], "student")
        self.assertNotIn("password", data)

    def test_update_user_profile(self):
        user = User.objects.create_user(
            email="update@test.com",
            password="testpass123",
        )
        serializer = UserDetailSerializer(
            user, data={"bio": "Updated bio"}, partial=True
        )
        self.assertTrue(serializer.is_valid())
        updated = serializer.save()
        self.assertEqual(updated.bio, "Updated bio")

    def test_email_and_role_are_read_only(self):
        user = User.objects.create_user(
            email="readonly@test.com",
            password="testpass123",
            role="student",
        )
        serializer = UserDetailSerializer(
            user, data={"email": "hacked@test.com", "role": "admin"}, partial=True
        )
        serializer.is_valid()
        updated = serializer.save()
        # email and role should NOT change
        self.assertEqual(updated.email, "readonly@test.com")
        self.assertEqual(updated.role, "student")


class TestCustomRegisterSerializer(TestCase):
    def test_valid_registration_data(self):
        data = {
            "email": "new@test.com",
            "password1": "securepass123!",
            "password2": "securepass123!",
            "first_name": "New",
            "last_name": "User",
        }
        serializer = CustomRegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_password_mismatch(self):
        data = {
            "email": "mismatch@test.com",
            "password1": "securepass123!",
            "password2": "differentpass!",
            "first_name": "Test",
            "last_name": "User",
        }
        serializer = CustomRegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd algonex-backend && python -m pytest accounts/tests/test_serializers.py -v`
Expected: FAIL (import error)

- [ ] **Step 3: Implement serializers**

```python
# algonex-backend/accounts/serializers.py
from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for user profile — read/update."""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "avatar",
            "bio",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "date_joined"]


class CustomRegisterSerializer(RegisterSerializer):
    """Extends dj-rest-auth register to include first_name and last_name."""

    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data["first_name"] = self.validated_data.get("first_name", "")
        data["last_name"] = self.validated_data.get("last_name", "")
        return data

    def save(self, request):
        user = super().save(request)
        user.first_name = self.cleaned_data.get("first_name")
        user.last_name = self.cleaned_data.get("last_name")
        user.save()
        return user
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd algonex-backend && python -m pytest accounts/tests/test_serializers.py -v`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add algonex-backend/accounts/serializers.py algonex-backend/accounts/tests/test_serializers.py
git commit -m "feat(accounts): add user detail and registration serializers"
```

---

## Chunk 3: Auth API Endpoints

### Task 7: Auth URL routing and views

**Files:**
- Create: `algonex-backend/accounts/urls.py`
- Create: `algonex-backend/accounts/views.py`
- Create: `algonex-backend/accounts/tests/test_api.py`

- [ ] **Step 1: Write failing API integration tests**

```python
# algonex-backend/accounts/tests/test_api.py
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class TestRegistrationAPI(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_user(self):
        response = self.client.post("/api/v1/auth/register/", {
            "email": "new@test.com",
            "password1": "securepass123!",
            "password2": "securepass123!",
            "first_name": "New",
            "last_name": "User",
        })
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(email="new@test.com").exists())
        user = User.objects.get(email="new@test.com")
        self.assertEqual(user.first_name, "New")
        self.assertEqual(user.role, "student")

    def test_register_duplicate_email_fails(self):
        User.objects.create_user(email="dup@test.com", password="testpass123")
        response = self.client.post("/api/v1/auth/register/", {
            "email": "dup@test.com",
            "password1": "securepass123!",
            "password2": "securepass123!",
            "first_name": "Dup",
            "last_name": "User",
        })
        self.assertIn(response.status_code, [400, 409])


class TestLoginAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="login@test.com",
            password="testpass123",
            first_name="Login",
            last_name="User",
        )

    def test_login_returns_tokens(self):
        response = self.client.post("/api/v1/auth/login/", {
            "email": "login@test.com",
            "password": "testpass123",
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_password(self):
        response = self.client.post("/api/v1/auth/login/", {
            "email": "login@test.com",
            "password": "wrongpass",
        })
        self.assertIn(response.status_code, [400, 401])


class TestUserProfileAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="profile@test.com",
            password="testpass123",
            first_name="Profile",
            last_name="User",
        )
        # Login to get token
        response = self.client.post("/api/v1/auth/login/", {
            "email": "profile@test.com",
            "password": "testpass123",
        })
        self.token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_get_user_profile(self):
        response = self.client.get("/api/v1/auth/user/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], "profile@test.com")
        self.assertEqual(response.data["role"], "student")

    def test_update_user_profile(self):
        response = self.client.patch("/api/v1/auth/user/", {
            "bio": "Updated bio",
            "phone": "9876543210",
        })
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.bio, "Updated bio")

    def test_unauthenticated_access_denied(self):
        client = APIClient()  # no token
        response = client.get("/api/v1/auth/user/")
        self.assertIn(response.status_code, [401, 403])


class TestTokenRefreshAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="refresh@test.com",
            password="testpass123",
        )
        response = self.client.post("/api/v1/auth/login/", {
            "email": "refresh@test.com",
            "password": "testpass123",
        })
        self.refresh_token = response.data["refresh"]

    def test_refresh_token(self):
        response = self.client.post("/api/v1/auth/token/refresh/", {
            "refresh": self.refresh_token,
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd algonex-backend && python -m pytest accounts/tests/test_api.py -v`
Expected: FAIL (URL not found)

- [ ] **Step 3: Implement accounts/views.py with OAuth social login views**

```python
# algonex-backend/accounts/views.py
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client


class GoogleLoginView(SocialLoginView):
    """
    Accepts Google OAuth2 authorization code from the React frontend,
    exchanges it for user info, creates/links a User, and returns JWT tokens.

    POST /api/v1/auth/google/
    Body: {"code": "<authorization_code>"}
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:5173"  # Must match Google OAuth redirect URI
    client_class = OAuth2Client


class GitHubLoginView(SocialLoginView):
    """
    Accepts GitHub OAuth2 authorization code from the React frontend.

    POST /api/v1/auth/github/
    Body: {"code": "<authorization_code>"}
    """
    adapter_class = GitHubOAuth2Adapter
    callback_url = "http://localhost:5173"
    client_class = OAuth2Client
```

- [ ] **Step 4: Implement accounts/urls.py**

```python
# algonex-backend/accounts/urls.py
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import GoogleLoginView, GitHubLoginView

urlpatterns = [
    # dj-rest-auth endpoints (login, logout, user, password)
    path("", include("dj_rest_auth.urls")),
    # Registration
    path("register/", include("dj_rest_auth.registration.urls")),
    # Token refresh
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Social auth — accept authorization code from frontend, return JWT
    path("google/", GoogleLoginView.as_view(), name="google_login"),
    path("github/", GitHubLoginView.as_view(), name="github_login"),
]
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd algonex-backend && python -m pytest accounts/tests/test_api.py -v`
Expected: All tests pass (8 tests)

If any tests fail due to allauth's SITE_ID requirement:
```bash
cd algonex-backend && python manage.py migrate
```

- [ ] **Step 6: Commit**

```bash
git add algonex-backend/accounts/urls.py algonex-backend/accounts/views.py algonex-backend/accounts/tests/test_api.py
git commit -m "feat(accounts): add auth API endpoints — register, login, profile, token refresh"
```

---

### Task 8: Remove old signin app

**Files:**
- Delete: `algonex-backend/signin/` (entire directory)
- Modify: `algonex-backend/config/settings/base.py` (already doesn't include signin)

- [ ] **Step 1: Remove signin app directory**

```bash
rm -rf algonex-backend/signin/
```

- [ ] **Step 2: Create a migration to remove signin tables if needed**

Run: `cd algonex-backend && python manage.py migrate`
Note: The signin app was removed from INSTALLED_APPS in base.py. If the database has the signin tables, Django will ignore them. No explicit migration needed.

- [ ] **Step 3: Verify everything still works**

Run: `cd algonex-backend && python manage.py check && python -m pytest -v`
Expected: System check passes, all tests pass

- [ ] **Step 4: Commit**

```bash
git rm -rf algonex-backend/signin/
git commit -m "refactor(backend): remove old signin app, replaced by accounts"
```

---

## Chunk 4: Frontend Theme & Auth Infrastructure

### Task 9: Create centralized theme system

**Files:**
- Create: `algonex-frontend/src/theme/theme.js`

- [ ] **Step 1: Create theme.js**

```javascript
// algonex-frontend/src/theme/theme.js

export const theme = {
  // Ant Design ConfigProvider token overrides
  antd: {
    token: {
      colorPrimary: "#00B4D8",
      colorSuccess: "#22c55e",
      colorWarning: "#f59e0b",
      colorError: "#ef4444",
      colorInfo: "#3b82f6",
      colorBgBase: "#ffffff",
      colorTextBase: "#2c3e50",
      borderRadius: 8,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: 14,
      controlHeight: 40,
    },
    components: {
      Button: {
        colorPrimary: "#00B4D8",
        colorPrimaryHover: "#0891b2",
        borderRadius: 8,
      },
      Card: {
        borderRadiusLG: 16,
      },
      Menu: {
        colorItemBgSelected: "#e0f7fa",
      },
      Tag: {
        borderRadiusSM: 12,
      },
    },
  },

  // Custom tokens for SCSS and non-antd components
  colors: {
    primary: "#00B4D8",
    primaryDark: "#0891b2",
    primaryLight: "#CCF6FF",
    primaryBg: "#EBFBFF",
    accent: "#66E5FF",
    text: {
      primary: "#2c3e50",
      secondary: "#666666",
      muted: "#999999",
    },
    bg: {
      page: "#f8fafc",
      card: "#ffffff",
      section: "#EBFBFF",
    },
    status: {
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
  },

  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },

  breakpoints: { mobile: 480, tablet: 768, desktop: 1024, wide: 1400 },

  shadows: {
    card: "0 2px 8px rgba(0,0,0,0.06)",
    cardHover: "0 4px 16px rgba(0,0,0,0.1)",
    nav: "0 2px 4px rgba(0,0,0,0.04)",
  },

  radius: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 },
};
```

- [ ] **Step 2: Update App.jsx to use ConfigProvider**

Modify `algonex-frontend/src/App.jsx` — wrap the app in Ant Design's `ConfigProvider`:

```jsx
import { ConfigProvider } from "antd";
import { theme } from "./theme/theme";

// In the return, wrap everything:
<ConfigProvider theme={theme.antd}>
  {/* existing router/routes */}
</ConfigProvider>
```

(Keep existing routes intact — just add the wrapper.)

- [ ] **Step 3: Verify the app still builds and runs**

Run: `cd algonex-frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add algonex-frontend/src/theme/ algonex-frontend/src/App.jsx
git commit -m "feat(frontend): add centralized theme.js with Ant Design ConfigProvider"
```

---

### Task 10: Create API client with JWT interceptors

**Files:**
- Create: `algonex-frontend/src/api/client.js`
- Create: `algonex-frontend/src/api/auth.js`

- [ ] **Step 1: Install axios (if not already installed)**

Run: `cd algonex-frontend && npm install axios`

- [ ] **Step 2: Create API client with token refresh interceptor**

> **Note:** The spec says "access token in memory, refresh in httpOnly cookie." For v1 simplicity, we store both in `localStorage`. This is acceptable for an internal/learning platform. To upgrade to httpOnly cookies later, configure `REST_AUTH.JWT_AUTH_HTTPONLY = True` and update the interceptor to not send Authorization headers (cookies are sent automatically).

```javascript
// algonex-frontend/src/api/client.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach access token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem("access_token", access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

- [ ] **Step 3: Create auth API module**

```javascript
// algonex-frontend/src/api/auth.js
import apiClient from "./client";

export const authAPI = {
  register(data) {
    return apiClient.post("/auth/register/", data);
  },

  login(data) {
    return apiClient.post("/auth/login/", data);
  },

  logout() {
    return apiClient.post("/auth/logout/");
  },

  getUser() {
    return apiClient.get("/auth/user/");
  },

  updateUser(data) {
    return apiClient.patch("/auth/user/", data);
  },

  changePassword(data) {
    return apiClient.post("/auth/password/change/", data);
  },

  resetPassword(email) {
    return apiClient.post("/auth/password/reset/", { email });
  },

  confirmResetPassword(data) {
    return apiClient.post("/auth/password/reset/confirm/", data);
  },
};
```

- [ ] **Step 4: Commit**

```bash
git add algonex-frontend/src/api/
git commit -m "feat(frontend): add axios API client with JWT interceptor and auth API module"
```

---

### Task 11: Create AuthContext and useAuth hook

**Files:**
- Create: `algonex-frontend/src/context/AuthContext.jsx`
- Create: `algonex-frontend/src/hooks/useAuth.js`

- [ ] **Step 1: Create AuthContext**

```jsx
// algonex-frontend/src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const response = await authAPI.getUser();
      setUser(response.data);
    } catch {
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access, refresh } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    await fetchUser();
    return response;
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    const { access, refresh } = response.data;
    if (access) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      await fetchUser();
    }
    return response;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser: fetchUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isInstructor: user?.role === "instructor",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

- [ ] **Step 2: Create useAuth hook**

```javascript
// algonex-frontend/src/hooks/useAuth.js
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

- [ ] **Step 3: Wrap App.jsx with AuthProvider**

Update `algonex-frontend/src/App.jsx`:

```jsx
import { AuthProvider } from "./context/AuthContext";

// Inside ConfigProvider:
<ConfigProvider theme={theme.antd}>
  <AuthProvider>
    {/* existing router/routes */}
  </AuthProvider>
</ConfigProvider>
```

- [ ] **Step 4: Commit**

```bash
git add algonex-frontend/src/context/ algonex-frontend/src/hooks/ algonex-frontend/src/App.jsx
git commit -m "feat(frontend): add AuthContext and useAuth hook for global auth state"
```

---

### Task 12: Create ProtectedRoute component

**Files:**
- Create: `algonex-frontend/src/components/common/ProtectedRoute.jsx`

- [ ] **Step 1: Create ProtectedRoute**

```jsx
// algonex-frontend/src/components/common/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

- [ ] **Step 2: Commit**

```bash
git add algonex-frontend/src/components/common/ProtectedRoute.jsx
git commit -m "feat(frontend): add ProtectedRoute component with role-based access"
```

---

## Chunk 5: Frontend Auth Pages

### Task 13: Login page

**Files:**
- Create: `algonex-frontend/src/pages/auth/LoginPage.jsx`

- [ ] **Step 1: Create LoginPage**

```jsx
// algonex-frontend/src/pages/auth/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Form, Input, Button, Divider, message, Card } from "antd";
import { MailOutlined, LockOutlined, GoogleOutlined, GithubOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (error) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.non_field_errors?.[0] ||
        "Login failed. Please check your credentials.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: 24 }}>
      <Card style={{ width: 400, maxWidth: "100%" }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Welcome Back</h2>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>or</Divider>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button
            icon={<GoogleOutlined />}
            block
            size="large"
            onClick={() => {
              const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
              const redirectUri = encodeURIComponent(window.location.origin + "/auth/callback");
              window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&state=google`;
            }}
          >
            Continue with Google
          </Button>
          <Button
            icon={<GithubOutlined />}
            block
            size="large"
            style={{ background: "#24292e", color: "white" }}
            onClick={() => {
              const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
              const redirectUri = encodeURIComponent(window.location.origin + "/auth/callback");
              window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=github`;
            }}
          >
            Continue with GitHub
          </Button>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </Card>
    </div>
  );
}
```

> **OAuth configuration required:** Set `VITE_GOOGLE_CLIENT_ID` and `VITE_GITHUB_CLIENT_ID` in `algonex-frontend/.env`. The OAuth callback page (`/auth/callback`) is created in Task 14b below. Google and GitHub OAuth apps must be configured in their respective developer consoles with `http://localhost:5173/auth/callback` as the redirect URI, and the client ID/secret must also be added via Django Admin → Social Applications.

- [ ] **Step 2: Commit**

```bash
git add algonex-frontend/src/pages/auth/LoginPage.jsx
git commit -m "feat(frontend): add login page with email/password and OAuth buttons"
```

---

### Task 14: Signup page

**Files:**
- Create: `algonex-frontend/src/pages/auth/SignupPage.jsx`

- [ ] **Step 1: Create SignupPage**

```jsx
// algonex-frontend/src/pages/auth/SignupPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Divider, message, Card } from "antd";
import { MailOutlined, LockOutlined, UserOutlined, GoogleOutlined, GithubOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await register({
        email: values.email,
        password1: values.password,
        password2: values.confirmPassword,
        first_name: values.firstName,
        last_name: values.lastName,
      });
      message.success("Account created! Welcome to Algonex.");
      navigate("/");
    } catch (error) {
      const errors = error.response?.data;
      const msg =
        errors?.error?.message ||
        errors?.email?.[0] ||
        errors?.password1?.[0] ||
        "Registration failed. Please try again.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: 24 }}>
      <Card style={{ width: 440, maxWidth: "100%" }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Create Account</h2>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item
              name="firstName"
              rules={[{ required: true, message: "First name required" }]}
              style={{ flex: 1 }}
            >
              <Input prefix={<UserOutlined />} placeholder="First name" />
            </Form.Item>
            <Form.Item
              name="lastName"
              rules={[{ required: true, message: "Last name required" }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="Last name" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please enter a password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>or</Divider>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button
            icon={<GoogleOutlined />}
            block
            size="large"
            onClick={() => {
              const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
              const redirectUri = encodeURIComponent(window.location.origin + "/auth/callback");
              window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&state=google`;
            }}
          >
            Sign up with Google
          </Button>
          <Button
            icon={<GithubOutlined />}
            block
            size="large"
            style={{ background: "#24292e", color: "white" }}
            onClick={() => {
              const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
              const redirectUri = encodeURIComponent(window.location.origin + "/auth/callback");
              window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=github`;
            }}
          >
            Sign up with GitHub
          </Button>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          Already have an account? <Link to="/signin">Sign in</Link>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add algonex-frontend/src/pages/auth/SignupPage.jsx
git commit -m "feat(frontend): add signup page with form validation and OAuth buttons"
```

---

### Task 14b: OAuth callback page

**Files:**
- Create: `algonex-frontend/src/pages/auth/OAuthCallbackPage.jsx`

- [ ] **Step 1: Create OAuthCallbackPage that exchanges code for JWT**

```jsx
// algonex-frontend/src/pages/auth/OAuthCallbackPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spin, message } from "antd";
import apiClient from "../../api/client";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // "google" or "github"
    if (!code || !state) {
      setError("No authorization code received.");
      return;
    }

    // Provider determined by `state` param passed in the OAuth redirect
    const endpoint = state === "github" ? "/auth/github/" : "/auth/google/";

    apiClient.post(endpoint, { code })
      .then((response) => {
        const { access, refresh } = response.data;
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        message.success("Logged in successfully!");
        navigate("/", { replace: true });
      })
      .catch(() => {
        setError("OAuth login failed. Please try again.");
        message.error("OAuth login failed.");
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <p>{error}</p>
        <a href="/signin">Back to Sign In</a>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
      <Spin size="large" tip="Completing login..." />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add algonex-frontend/src/pages/auth/OAuthCallbackPage.jsx
git commit -m "feat(frontend): add OAuth callback page for Google/GitHub code exchange"
```

---

### Task 15: Profile page

**Files:**
- Create: `algonex-frontend/src/pages/auth/ProfilePage.jsx`

- [ ] **Step 1: Create ProfilePage**

```jsx
// algonex-frontend/src/pages/auth/ProfilePage.jsx
import { useState } from "react";
import { Form, Input, Button, message, Card, Avatar, Upload } from "antd";
import { UserOutlined, UploadOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../api/auth";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authAPI.updateUser(values);
      await refreshUser();
      message.success("Profile updated!");
    } catch (error) {
      message.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} src={user.avatar} />
          <h2 style={{ marginTop: 12, marginBottom: 4 }}>
            {user.first_name} {user.last_name}
          </h2>
          <p style={{ color: "#666" }}>{user.email}</p>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            bio: user.bio,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="first_name" label="First Name" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="last_name" label="Last Name" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>

          <Form.Item name="bio" label="Bio">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add algonex-frontend/src/pages/auth/ProfilePage.jsx
git commit -m "feat(frontend): add profile page with editable user info"
```

---

### Task 16: Update routing to include auth pages

**Files:**
- Modify: `algonex-frontend/src/App.jsx`

- [ ] **Step 1: Add auth routes to existing App.jsx router**

Add these routes to the existing `Routes` in `App.jsx`:

```jsx
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ProfilePage from "./pages/auth/ProfilePage";
import OAuthCallbackPage from "./pages/auth/OAuthCallbackPage";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

// Inside <Routes>:
<Route path="/signin" element={<LoginPage />} />
<Route path="/signup" element={<SignupPage />} />
<Route path="/auth/callback" element={<OAuthCallbackPage />} />
<Route path="/profile" element={
  <ProtectedRoute>
    <ProfilePage />
  </ProtectedRoute>
} />
```

Replace the existing `/signin` route (which currently points to the old Signin component).

- [ ] **Step 2: Install @ant-design/icons if not already present**

Run: `cd algonex-frontend && npm install @ant-design/icons`

- [ ] **Step 3: Verify the app builds and auth routes work**

Run: `cd algonex-frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add algonex-frontend/src/App.jsx algonex-frontend/package.json algonex-frontend/package-lock.json
git commit -m "feat(frontend): integrate auth pages into routing — login, signup, profile"
```

---

### Task 17: Update Navbar with auth-aware state

**Files:**
- Modify: `algonex-frontend/src/components/Navbar/Navbar.jsx` (or wherever Navbar lives)

- [ ] **Step 1: Read the existing Navbar component to understand its structure**

Read `algonex-frontend/src/components/Navbar/` and understand the current navigation structure before modifying.

- [ ] **Step 2: Add auth-aware elements to Navbar**

Add to the existing Navbar:
- If logged out: show "Sign In" and "Sign Up" buttons
- If logged in: show user avatar with dropdown (Profile, My Courses, Logout)

Use Ant Design's `Avatar`, `Dropdown`, and `Button` components. Wire up `useAuth()` for state and `logout` action.

Example additions (adapt to existing Navbar structure):

```jsx
import { useAuth } from "../../hooks/useAuth";
import { Avatar, Dropdown, Button } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

// Inside Navbar component:
const { user, isAuthenticated, logout } = useAuth();
const navigate = useNavigate();

const handleLogout = async () => {
  await logout();
  navigate("/");
};

// Render conditionally:
{isAuthenticated ? (
  <Dropdown menu={{
    items: [
      { key: "profile", label: <Link to="/profile">Profile</Link> },
      { type: "divider" },
      { key: "logout", label: "Logout", icon: <LogoutOutlined />, onClick: handleLogout },
    ]
  }}>
    <Avatar icon={<UserOutlined />} src={user?.avatar} style={{ cursor: "pointer" }} />
  </Dropdown>
) : (
  <div style={{ display: "flex", gap: 8 }}>
    <Link to="/signin"><Button>Sign In</Button></Link>
    <Link to="/signup"><Button type="primary">Sign Up</Button></Link>
  </div>
)}
```

- [ ] **Step 3: Verify navigation works**

Run: `cd algonex-frontend && npm run dev`
Manually verify: Navbar shows Sign In/Sign Up when logged out, avatar dropdown when logged in.

- [ ] **Step 4: Commit**

```bash
git add algonex-frontend/src/components/Navbar/
git commit -m "feat(frontend): update Navbar with auth-aware state — login/signup buttons and user dropdown"
```

---

### Task 18: Final integration test — full auth flow

- [ ] **Step 1: Run all backend tests**

Run: `cd algonex-backend && python -m pytest -v`
Expected: All tests pass

- [ ] **Step 2: Run frontend build**

Run: `cd algonex-frontend && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Manual smoke test**

Start both servers:
```bash
# Terminal 1:
cd algonex-backend && python manage.py runserver

# Terminal 2:
cd algonex-frontend && npm run dev
```

Test manually:
1. Visit `/signup` — create a new account
2. Visit `/signin` — log in with the account
3. Visit `/profile` — verify user data shows
4. Click logout in Navbar dropdown
5. Verify redirect to homepage, Navbar shows Sign In/Sign Up

- [ ] **Step 4: Final commit if any adjustments needed**

```bash
git add -A
git commit -m "fix: address integration issues from auth smoke test"
```

(Only if adjustments were needed.)
