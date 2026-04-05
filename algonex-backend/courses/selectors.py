from django.db.models import Avg, Count, Q
from .models import Course, Enrollment


def get_published_courses(*, filters=None):
    """Return published courses with student_count, average_rating, review_count."""
    qs = Course.objects.filter(is_published=True).select_related("instructor").prefetch_related("skills")

    if filters:
        if filters.get("level"):
            qs = qs.filter(level=filters["level"])
        if filters.get("is_trending"):
            qs = qs.filter(is_trending=True)
        if filters.get("search"):
            qs = qs.filter(name__icontains=filters["search"])

    return qs.annotate(
        student_count=Count("enrollments", filter=Q(enrollments__status="active"), distinct=True),
        average_rating=Avg("reviews__rating"),
        review_count=Count("reviews", distinct=True),
    ).order_by("-created_at")


def get_course_detail(*, slug):
    """Return a single published course with all related data prefetched."""
    return (
        Course.objects.filter(slug=slug, is_published=True)
        .select_related("instructor")
        .prefetch_related(
            "skills",
            "modules__topics",
            "faqs",
            "testimonials",
            "reviews__student",
        )
        .annotate(
            student_count=Count("enrollments", filter=Q(enrollments__status="active"), distinct=True),
            average_rating=Avg("reviews__rating"),
            review_count=Count("reviews", distinct=True),
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
