from django.db.models import Q
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
