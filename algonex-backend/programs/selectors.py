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
