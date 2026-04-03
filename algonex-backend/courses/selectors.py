from django.db.models import Count, Q
from .models import Course, Enrollment


def get_published_courses(*, filters=None):
    """Return published courses with annotations."""
    qs = Course.objects.filter(is_published=True).select_related("instructor").prefetch_related("skills")

    if filters:
        if filters.get("level"):
            qs = qs.filter(level=filters["level"])
        if filters.get("is_trending"):
            qs = qs.filter(is_trending=True)
        if filters.get("search"):
            qs = qs.filter(name__icontains=filters["search"])

    return qs.annotate(
        student_count_annotated=Count("enrollments", filter=Q(enrollments__status="active")),
    )


def get_course_detail(*, slug):
    """Return a single course with all related data prefetched."""
    return (
        Course.objects.filter(slug=slug)
        .select_related("instructor")
        .prefetch_related(
            "skills",
            "modules__topics",
            "faqs",
            "testimonials",
        )
        .first()
    )


def get_student_enrollments(*, student):
    """Return a student's active enrollments with course data."""
    return (
        Enrollment.objects.filter(student=student)
        .exclude(status="dropped")
        .select_related("course", "course__instructor")
        .prefetch_related("course__skills")
    )
