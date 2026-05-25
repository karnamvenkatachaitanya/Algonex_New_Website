# Django Admin Customization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace stock Django admin with django-unfold themed admin featuring a dashboard, organized sidebar, enhanced list views, and image preview in media inlines.

**Architecture:** Install django-unfold (settings-based approach — no custom AdminSite needed), configure dashboard via `DASHBOARD_CALLBACK` + custom template, update all `ModelAdmin` classes to use Unfold base classes, enhance list views with filters/search/display, and add image previews to media inlines.

**Tech Stack:** Django 5.x, django-unfold, Django contenttypes (GenericForeignKey)

**Spec:** `docs/superpowers/specs/2026-04-11-django-admin-customization-design.md`

---

## Chunk 1: Foundation

### Task 1: Install django-unfold and update settings

**Files:**
- Modify: `algonex-backend/requirements.txt:21` (append)
- Modify: `algonex-backend/config/settings/base.py:13-44` (INSTALLED_APPS), append UNFOLD config at end

- [ ] **Step 1: Install django-unfold**

```bash
cd algonex-backend && pip install django-unfold
```

- [ ] **Step 2: Add django-unfold to requirements.txt**

Append after line 21:

```
# Admin
django-unfold>=0.47,<1.0
```

- [ ] **Step 3: Update INSTALLED_APPS in base.py**

Add `"unfold"` and `"unfold.contrib.filters"` **before** `"django.contrib.admin"` (line 14). The INSTALLED_APPS block becomes:

```python
INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "django.contrib.admin",
    "django.contrib.auth",
    # ... rest unchanged
]
```

- [ ] **Step 4: Add UNFOLD configuration to base.py**

Append at end of `config/settings/base.py` (after line 170):

```python
# django-unfold admin theme
UNFOLD = {
    "SITE_TITLE": "Algonex",
    "SITE_HEADER": "Algonex Admin",
    "SITE_ICON": lambda request: None,
    "DASHBOARD_CALLBACK": "common.admin_site.dashboard_callback",
    "SIDEBAR": {
        "show_search": True,
        "navigation": [
            {
                "title": "Dashboard",
                "icon": "dashboard",
                "items": [
                    {"title": "Dashboard", "link": "/admin/", "icon": "dashboard"},
                ],
            },
            {
                "title": "Courses",
                "icon": "school",
                "items": [
                    {"title": "Courses", "link": "/admin/courses/course/", "icon": "menu_book"},
                    {"title": "Enrollments", "link": "/admin/courses/enrollment/", "icon": "how_to_reg"},
                    {"title": "Skills", "link": "/admin/courses/skill/", "icon": "psychology"},
                    {"title": "Student Outcomes", "link": "/admin/courses/studentoutcome/", "icon": "emoji_events"},
                    {"title": "Reviews", "link": "/admin/courses/coursereview/", "icon": "rate_review"},
                ],
            },
            {
                "title": "Events",
                "icon": "event",
                "items": [
                    {"title": "Events", "link": "/admin/events/event/", "icon": "celebration"},
                    {"title": "Registrations", "link": "/admin/events/registration/", "icon": "app_registration"},
                ],
            },
            {
                "title": "Users & Signups",
                "icon": "people",
                "items": [
                    {"title": "Users", "link": "/admin/accounts/user/", "icon": "person"},
                    {"title": "Signin Profiles", "link": "/admin/signin/signinprofile/", "icon": "login"},
                    {"title": "Registration Profiles", "link": "/admin/signin/registrationprofile/", "icon": "assignment_ind"},
                ],
            },
            {
                "title": "Content",
                "icon": "article",
                "items": [
                    {"title": "Programs", "link": "/admin/programs/program/", "icon": "work"},
                    {"title": "Jobs", "link": "/admin/careers/job/", "icon": "business_center"},
                    {"title": "Applications", "link": "/admin/careers/application/", "icon": "description"},
                    {"title": "Case Studies", "link": "/admin/portfolio/casestudy/", "icon": "cases"},
                    {"title": "Tech Tags", "link": "/admin/portfolio/techtag/", "icon": "label"},
                    {"title": "Media", "link": "/admin/common/media/", "icon": "photo_library"},
                ],
            },
            {
                "title": "Showcase",
                "icon": "star",
                "items": [
                    {"title": "Alumni Profiles", "link": "/admin/showcase/alumniprofile/", "icon": "school"},
                    {"title": "Student Projects", "link": "/admin/showcase/studentproject/", "icon": "code"},
                ],
            },
            {
                "title": "Site Config",
                "icon": "settings",
                "items": [
                    {"title": "Platform Settings", "link": "/admin/common/platformsettings/", "icon": "tune"},
                    {"title": "Carousel", "link": "/admin/common/carouselslide/", "icon": "view_carousel"},
                    {"title": "Site Banner", "link": "/admin/common/sitebanner/", "icon": "campaign"},
                    {"title": "Contact Submissions", "link": "/admin/contactform/contactform/", "icon": "mail"},
                ],
            },
        ],
    },
}
```

- [ ] **Step 5: Commit**

```bash
git add requirements.txt config/settings/base.py
git commit -m "feat(admin): install django-unfold and configure theme settings"
```

---

### Task 2: Create custom AdminSite with dashboard callback

**Files:**
- Create: `algonex-backend/common/admin_site.py`

- [ ] **Step 1: Create common/admin_site.py with dashboard_callback**

```python
from django.utils import timezone
from courses.models import Course, Enrollment
from events.models import Event, Registration
from accounts.models import User
from contactform.models import ContactForm


def dashboard_callback(request, context):
    """Unfold dashboard callback — injects stats and recent activity."""
    now = timezone.now()

    # Stat cards
    total_courses = Course.objects.count()
    published_courses = Course.objects.filter(is_published=True).count()
    draft_courses = total_courses - published_courses

    total_events = Event.objects.count()
    upcoming_events = Event.objects.filter(start_date__gt=now).count()
    ongoing_events = Event.objects.filter(start_date__lte=now, end_date__gte=now).count()
    past_events = total_events - upcoming_events - ongoing_events

    total_users = User.objects.count()
    students = User.objects.filter(role="student").count()
    instructors = User.objects.filter(role="instructor").count()
    admins = User.objects.filter(role="admin").count()

    active_enrollments = Enrollment.objects.filter(status="active").count()

    # Recent activity
    recent_registrations = (
        Registration.objects.select_related("user", "event")
        .order_by("-registered_at")[:10]
    )
    recent_enrollments = (
        Enrollment.objects.select_related("student", "course")
        .order_by("-enrolled_at")[:10]
    )
    recent_contacts = ContactForm.objects.order_by("-submitted_at")[:5]

    context.update(
        {
            "stats": [
                {"label": "Courses", "value": total_courses, "detail": f"{published_courses} published, {draft_courses} draft"},
                {"label": "Events", "value": total_events, "detail": f"{upcoming_events} upcoming, {ongoing_events} ongoing, {past_events} past"},
                {"label": "Users", "value": total_users, "detail": f"{students} students, {instructors} instructors, {admins} admins"},
                {"label": "Active Enrollments", "value": active_enrollments, "detail": ""},
            ],
            "recent_registrations": recent_registrations,
            "recent_enrollments": recent_enrollments,
            "recent_contacts": recent_contacts,
            "quick_links": [
                {"title": "Add New Course", "url": "/admin/courses/course/add/", "icon": "add_circle"},
                {"title": "Add New Event", "url": "/admin/events/event/add/", "icon": "add_circle"},
                {"title": "Add New Program", "url": "/admin/programs/program/add/", "icon": "add_circle"},
            ]
        }
    )
    return context
```

- [ ] **Step 2: Verify the import chain works**

```bash
cd algonex-backend && python3.11 -c "from common.admin_site import dashboard_callback; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add common/admin_site.py
git commit -m "feat(admin): add dashboard callback with stats, recent activity, and quick links"
```

---

### Task 2.5: Create custom admin dashboard template

**Files:**
- Create: `algonex-backend/templates/admin/index.html`

- [ ] **Step 1: Create templates/admin/index.html**

Create a custom template to render the context variables provided by `dashboard_callback`. Ensure the `templates` directory exists and is configured in `settings/base.py` `DIRS`.

```html
{% extends "admin/index.html" %}
{% load i18n unfold %}

{% block content %}
<div class="unfold-dashboard">
    <!-- Quick Actions -->
    <div class="mb-8 flex gap-4">
        {% for link in quick_links %}
            <a href="{{ link.url }}" class="bg-primary-600 text-white px-4 py-2 rounded shadow hover:bg-primary-700 flex items-center gap-2">
                <span class="material-symbols-outlined">{{ link.icon }}</span>
                {{ link.title }}
            </a>
        {% endfor %}
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {% for stat in stats %}
        <div class="bg-white dark:bg-gray-800 p-4 rounded shadow border border-gray-200 dark:border-gray-700">
            <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">{{ stat.label }}</h3>
            <p class="text-3xl font-bold mt-2 dark:text-white">{{ stat.value }}</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">{{ stat.detail }}</p>
        </div>
        {% endfor %}
    </div>

    <!-- Recent Activity Tables -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Recent Registrations -->
        <div class="bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700">
            <h3 class="p-4 border-b border-gray-200 dark:border-gray-700 font-bold dark:text-white">Recent Event Registrations</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th class="p-4">User</th>
                            <th class="p-4">Event</th>
                            <th class="p-4">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for reg in recent_registrations %}
                        <tr class="border-b dark:border-gray-700">
                            <td class="p-4 dark:text-gray-300">{{ reg.user.email }}</td>
                            <td class="p-4 dark:text-gray-300">{{ reg.event.title }}</td>
                            <td class="p-4 dark:text-gray-300">{{ reg.registered_at|date:"M d, Y" }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Recent Enrollments -->
        <div class="bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700">
            <h3 class="p-4 border-b border-gray-200 dark:border-gray-700 font-bold dark:text-white">Recent Enrollments</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th class="p-4">Student</th>
                            <th class="p-4">Course</th>
                            <th class="p-4">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for enrollment in recent_enrollments %}
                        <tr class="border-b dark:border-gray-700">
                            <td class="p-4 dark:text-gray-300">{{ enrollment.student.email }}</td>
                            <td class="p-4 dark:text-gray-300">{{ enrollment.course.name }}</td>
                            <td class="p-4 dark:text-gray-300">{{ enrollment.enrolled_at|date:"M d, Y" }}</td>
                        </tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
{% endblock %}
```

- [ ] **Step 2: Commit**

```bash
git add templates/admin/index.html
git commit -m "feat(admin): add custom templates/admin/index.html for unfold dashboard"
```

---

### Task 3: Update common/admin.py — MediaInline image preview and Unfold base classes

**Files:**
- Modify: `algonex-backend/common/admin.py` (all 55 lines)

- [ ] **Step 1: Rewrite common/admin.py**

Replace the entire file with:

```python
from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from .models import Media, SiteBanner, PlatformSettings, CarouselSlide


class MediaInline(GenericTabularInline):
    """Reusable inline for adding media to any model's admin page."""
    model = Media
    extra = 3
    fields = ["image", "image_preview", "caption", "order"]
    readonly_fields = ["image_preview"]
    ordering = ["order"]

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:80px; border-radius:4px;" />', obj.image.url)
        return "-"
    image_preview.short_description = "Preview"


@admin.register(Media)
class MediaAdmin(ModelAdmin):
    list_display = ["image_preview", "caption", "content_type", "object_id", "order", "created_at"]
    list_filter = ["content_type"]
    readonly_fields = ["image_preview"]

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:80px; border-radius:4px;" />', obj.image.url)
        return "-"
    image_preview.short_description = "Preview"


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(ModelAdmin):
    fieldsets = (
        ("Feature Toggles", {
            "fields": ("maintenance_mode", "maintenance_message", "course_enrollment_enabled",
                       "event_registration_enabled", "program_registration_enabled"),
        }),
        ("Showcase", {
            "fields": ("auto_publish_student_projects",),
        }),
        ("Search", {
            "fields": ("search_results_per_category",),
        }),
    )

    def has_add_permission(self, request):
        return not PlatformSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(CarouselSlide)
class CarouselSlideAdmin(ModelAdmin):
    list_display = ["__str__", "slide_type", "item_slug", "order", "is_active"]
    list_display_links = ["__str__"]
    list_filter = ["slide_type", "is_active"]
    list_editable = ["order", "is_active"]


@admin.register(SiteBanner)
class SiteBannerAdmin(ModelAdmin):
    list_display = ["text", "bg_color", "is_active", "updated_at"]
    list_filter = ["is_active"]
    list_editable = ["is_active"]
```

- [ ] **Step 2: Verify no import errors**

```bash
cd algonex-backend && python3.11 -c "from common.admin import MediaInline, MediaAdmin; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add common/admin.py
git commit -m "feat(admin): add image preview to MediaInline and switch to Unfold base classes"
```

---

## Chunk 2: Core App Admin Updates

### Task 4: Update courses/admin.py — Unfold base classes, enhancements, register CourseReview

**Files:**
- Modify: `algonex-backend/courses/admin.py` (all 62 lines)

- [ ] **Step 1: Rewrite courses/admin.py**

Replace the entire file with:

```python
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from common.admin import MediaInline
from .models import Course, Module, Topic, Skill, Enrollment, CourseFAQ, Testimonial, StudentOutcome, CourseReview


class ModuleInline(TabularInline):
    model = Module
    extra = 1
    show_change_link = True


class CourseFAQInline(TabularInline):
    model = CourseFAQ
    extra = 1


class TestimonialInline(TabularInline):
    model = Testimonial
    extra = 1


class TopicInline(TabularInline):
    model = Topic
    extra = 1


@admin.register(Course)
class CourseAdmin(ModelAdmin):
    list_display = ("name", "instructor", "level", "price", "is_published", "is_trending", "created_at")
    list_filter = ("level", "is_published", "is_trending", "skills")
    search_fields = ("name", "description", "instructor__email")
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("is_published", "is_trending")
    inlines = [ModuleInline, CourseFAQInline, TestimonialInline, MediaInline]


@admin.register(Module)
class ModuleAdmin(ModelAdmin):
    list_display = ("title", "course", "order")
    list_filter = ("course",)
    inlines = [TopicInline]


@admin.register(Skill)
class SkillAdmin(ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Enrollment)
class EnrollmentAdmin(ModelAdmin):
    list_display = ("student", "course", "status", "enrolled_at")
    list_filter = ("status", "course")
    search_fields = ("student__email", "course__name")


@admin.register(StudentOutcome)
class StudentOutcomeAdmin(ModelAdmin):
    list_display = ("student_name", "achievement_type", "company_name", "course", "achieved_at", "is_published")
    list_filter = ("achievement_type", "course", "is_published")
    search_fields = ("student_name", "company_name", "role")
    list_editable = ("is_published",)


@admin.register(CourseReview)
class CourseReviewAdmin(ModelAdmin):
    list_display = ("student", "course", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("student__email", "course__name")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
```

- [ ] **Step 2: Verify no import errors**

```bash
cd algonex-backend && python3.11 -c "from courses.admin import CourseAdmin, CourseReviewAdmin; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add courses/admin.py
git commit -m "feat(admin): enhance courses admin with Unfold, register CourseReview"
```

---

### Task 5: Update events/admin.py — Unfold base classes and enhancements

**Files:**
- Modify: `algonex-backend/events/admin.py` (all 26 lines)

- [ ] **Step 1: Rewrite events/admin.py**

Replace the entire file with:

```python
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from common.admin import MediaInline
from .models import Event, Registration


class RegistrationInline(TabularInline):
    model = Registration
    extra = 0
    readonly_fields = ("registered_at",)


@admin.register(Event)
class EventAdmin(ModelAdmin):
    list_display = ("title", "event_type", "start_date", "location", "capacity", "is_published")
    list_filter = ("event_type", "is_published", "start_date")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    list_editable = ("is_published",)
    inlines = [RegistrationInline, MediaInline]


@admin.register(Registration)
class RegistrationAdmin(ModelAdmin):
    list_display = ("user", "event", "status", "registered_at")
    list_filter = ("status", "event")
    search_fields = ("user__email", "event__title")
```

- [ ] **Step 2: Commit**

```bash
git add events/admin.py
git commit -m "feat(admin): enhance events admin with Unfold base classes"
```

---

### Task 6: Update accounts/admin.py — Unfold UserAdmin

**Files:**
- Modify: `algonex-backend/accounts/admin.py` (all 19 lines)

- [ ] **Step 1: Rewrite accounts/admin.py**

Note: Uses `unfold.contrib.auth.admin.UserAdmin` (not `unfold.admin.ModelAdmin`) to preserve auth-specific functionality.

```python
from django.contrib import admin
from unfold.contrib.auth.admin import UserAdmin as UnfoldUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(UnfoldUserAdmin):
    list_display = ("email", "first_name", "last_name", "role", "is_active")
    list_filter = ("role", "is_active", "date_joined")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("-date_joined",)

    fieldsets = UnfoldUserAdmin.fieldsets + (
        ("Profile", {"fields": ("role", "phone", "avatar", "bio")}),
    )
    add_fieldsets = UnfoldUserAdmin.add_fieldsets + (
        ("Profile", {"fields": ("email", "first_name", "last_name", "role")}),
    )
```

- [ ] **Step 2: Commit**

```bash
git add accounts/admin.py
git commit -m "feat(admin): switch UserAdmin to Unfold auth base class"
```

---

### Task 7: Update signin/admin.py — Unfold base classes and enhancements

**Files:**
- Modify: `algonex-backend/signin/admin.py` (all 18 lines)

- [ ] **Step 1: Rewrite signin/admin.py**

```python
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import SigninProfile, RegistrationProfile


@admin.register(SigninProfile)
class SigninProfileAdmin(ModelAdmin):
    list_display = ["name", "email", "phone", "college", "course_interested", "submitted_at"]
    search_fields = ["name", "email", "college"]
    list_filter = ["course_interested", "employment_status"]


@admin.register(RegistrationProfile)
class RegistrationProfileAdmin(ModelAdmin):
    list_display = ["user", "interest_category", "program", "degree_level", "employment_status", "college", "city", "created_at"]
    list_filter = ["interest_category", "degree_level", "employment_status"]
    search_fields = ["user__email", "user__first_name", "college", "city"]
    raw_id_fields = ["user", "program"]
```

- [ ] **Step 2: Commit**

```bash
git add signin/admin.py
git commit -m "feat(admin): enhance signin admin with Unfold and additional list fields"
```

---

## Chunk 3: Remaining App Admin Updates

### Task 8: Update careers/admin.py — Unfold base classes

**Files:**
- Modify: `algonex-backend/careers/admin.py` (all 45 lines)

- [ ] **Step 1: Rewrite careers/admin.py**

```python
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import Job, Application


class ApplicationInline(TabularInline):
    model = Application
    extra = 0
    readonly_fields = ("applied_at", "updated_at")


@admin.register(Job)
class JobAdmin(ModelAdmin):
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
class ApplicationAdmin(ModelAdmin):
    list_display = ("applicant", "job", "status", "applied_at")
    list_filter = ("status",)
    search_fields = ("applicant__email", "job__title")
    readonly_fields = ("applied_at", "updated_at")
```

- [ ] **Step 2: Commit**

```bash
git add careers/admin.py
git commit -m "feat(admin): switch careers admin to Unfold base classes"
```

---

### Task 9: Update portfolio/admin.py — Unfold base classes

**Files:**
- Modify: `algonex-backend/portfolio/admin.py` (all 23 lines)

- [ ] **Step 1: Rewrite portfolio/admin.py**

```python
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import CaseStudy, TechTag, Screenshot


class ScreenshotInline(TabularInline):
    model = Screenshot
    extra = 1


@admin.register(CaseStudy)
class CaseStudyAdmin(ModelAdmin):
    list_display = ("title", "client_name", "industry", "is_featured", "is_published")
    list_filter = ("industry", "is_published", "is_featured")
    search_fields = ("title", "client_name")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ScreenshotInline]


@admin.register(TechTag)
class TechTagAdmin(ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)
```

- [ ] **Step 2: Commit**

```bash
git add portfolio/admin.py
git commit -m "feat(admin): switch portfolio admin to Unfold base classes"
```

---

### Task 10: Update showcase/admin.py — Unfold base classes

**Files:**
- Modify: `algonex-backend/showcase/admin.py` (all 20 lines)

- [ ] **Step 1: Rewrite showcase/admin.py**

```python
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import AlumniProfile, StudentProject


@admin.register(AlumniProfile)
class AlumniProfileAdmin(ModelAdmin):
    list_display = ("name", "current_company", "current_role", "course", "batch_year", "is_featured", "is_published")
    list_filter = ("course", "batch_year", "is_featured", "is_published")
    search_fields = ("name", "current_company", "current_role")
    list_editable = ("is_featured", "is_published")


@admin.register(StudentProject)
class StudentProjectAdmin(ModelAdmin):
    list_display = ("title", "student_name", "course", "batch_year", "is_featured", "is_published")
    list_filter = ("course", "batch_year", "is_featured", "is_published")
    search_fields = ("title", "student_name")
    list_editable = ("is_featured", "is_published")
    prepopulated_fields = {"slug": ("title",)}
```

- [ ] **Step 2: Commit**

```bash
git add showcase/admin.py
git commit -m "feat(admin): switch showcase admin to Unfold base classes"
```

---

### Task 11: Update contactform/admin.py — Unfold base class

**Files:**
- Modify: `algonex-backend/contactform/admin.py` (all 11 lines)

- [ ] **Step 1: Rewrite contactform/admin.py**

```python
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import ContactForm


@admin.register(ContactForm)
class ContactFormAdmin(ModelAdmin):
    list_display = ("full_name", "email", "subject", "submitted_at")
    list_filter = ("submitted_at",)
    search_fields = ("full_name", "email", "subject")
    readonly_fields = ("submitted_at",)
```

- [ ] **Step 2: Commit**

```bash
git add contactform/admin.py
git commit -m "feat(admin): switch contactform admin to Unfold base class"
```

---

### Task 12: Update programs — add GenericRelation and MediaInline

**Files:**
- Modify: `algonex-backend/programs/models.py:1-2` (add import), append GenericRelation field
- Modify: `algonex-backend/programs/admin.py` (all 11 lines)

- [ ] **Step 1: Add GenericRelation to Program model**

In `programs/models.py`, add the import at the top (after line 3):

```python
from django.contrib.contenttypes.fields import GenericRelation
```

And add the field inside the `Program` class, after line 48 (`is_featured` field):

```python
    # Media
    media = GenericRelation("common.Media")
```

- [ ] **Step 2: Run makemigrations**

```bash
cd algonex-backend && python3.11 manage.py makemigrations programs
```

Expected: No migration generated (GenericRelation is virtual — no DB column needed).

- [ ] **Step 3: Rewrite programs/admin.py**

```python
from django.contrib import admin
from unfold.admin import ModelAdmin
from common.admin import MediaInline
from .models import Program


@admin.register(Program)
class ProgramAdmin(ModelAdmin):
    list_display = ["title", "program_type", "is_published", "is_featured", "application_deadline"]
    list_filter = ["program_type", "is_published", "is_featured"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
    inlines = [MediaInline]
```

- [ ] **Step 4: Commit**

```bash
git add programs/models.py programs/admin.py
git commit -m "feat(admin): add media uploads to programs, switch to Unfold"
```

---

## Chunk 4: URL Wiring and Verification

### Task 13: Wire custom admin URL

**Files:**
- Modify: `algonex-backend/config/urls.py:1,8` (import and URL change)

- [ ] **Step 1: Update config/urls.py**

The admin URL at line 8 (`path("admin/", admin.site.urls)`) stays as-is. Unfold works by overriding templates via INSTALLED_APPS ordering — it does **not** require a custom AdminSite subclass for basic theming. The `DASHBOARD_CALLBACK` in settings handles the dashboard. No URL change needed.

(Note: The spec mentioned a custom AdminSite, but Unfold's modern approach uses `UNFOLD` settings + `DASHBOARD_CALLBACK` instead. This is simpler and avoids re-registering every model.)

- [ ] **Step 2: Verify Django checks pass**

```bash
cd algonex-backend && python3.11 manage.py check
```

Expected: `System check identified no issues.`

- [ ] **Step 3: Verify admin loads**

```bash
cd algonex-backend && python3.11 manage.py runserver
```

Then visit `http://localhost:8000/admin/` — should see Unfold-themed admin with sidebar navigation.

- [ ] **Step 4: Commit (if any URL changes were needed)**

No commit needed if no changes — URLs work as-is with Unfold.

---

### Task 14: Run full test suite

- [ ] **Step 1: Run all tests**

```bash
cd algonex-backend && python3.11 -m pytest -v
```

Expected: All 91 tests pass. Admin base class changes should not affect API tests.

- [ ] **Step 2: Verify dashboard callback**

```bash
cd algonex-backend && python3.11 -c "
from django.test.utils import setup_test_environment
import django; django.setup()
from common.admin_site import dashboard_callback
ctx = dashboard_callback(None, {})
print('Stats:', len(ctx['stats']), 'cards')
print('OK')
"
```

Expected: `Stats: 4 cards` and `OK`

- [ ] **Step 3: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(admin): resolve any test failures from admin migration"
```

Only run this if Step 1 had failures that were fixed.
