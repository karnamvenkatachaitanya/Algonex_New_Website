from django.db.models import Count
from .models import Program


def get_published_programs():
    """Return published programs (Course objects with type fellowship/internship)
    with registration count annotation.
    """
    return Program.objects.filter(
        is_published=True,
        course_type__in=["fellowship", "internship"]
    ).annotate(
        registration_count=Count("student_registrations"),
    ).order_by("-is_featured", "-created_at")


def get_program_detail(*, slug):
    """Return a single published program (Course object) by slug."""
    return Program.objects.filter(
        slug=slug,
        is_published=True,
        course_type__in=["fellowship", "internship"]
    ).first()
