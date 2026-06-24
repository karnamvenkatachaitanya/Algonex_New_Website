from django.db import IntegrityError, transaction
from django.utils.text import slugify
from .models import Course, Enrollment, Feedback
from .exceptions import CourseNotPublished, AlreadyEnrolled, CourseNotReady, NotEnrolled, AlreadyReviewed


def create_course(*, instructor, **data):
    """Create a new course as draft (unpublished)."""
    data["is_published"] = False
    course = Course(instructor=instructor, **data)
    course.save()
    return course


def update_course(*, course, **data):
    """Update course fields. If setting is_published=True, validate readiness."""
    publishing = data.get("is_published", False) and not course.is_published

    for field, value in data.items():
        setattr(course, field, value)

    if publishing:
        _validate_publish_ready(course)

    course.save()
    return course


@transaction.atomic
def enroll_student(*, student, course):
    """Enroll a student in a published course.
    Atomic + IntegrityError catch to handle concurrent enrollment attempts.
    """
    if not course.is_published:
        raise CourseNotPublished()

    existing = Enrollment.objects.filter(student=student, course=course).first()
    if existing:
        if existing.status in ("active", "completed"):
            raise AlreadyEnrolled()
        # Re-enroll a dropped student
        existing.status = "active"
        existing.save()
        return existing

    try:
        return Enrollment.objects.create(student=student, course=course, status="active")
    except IntegrityError:
        raise AlreadyEnrolled()


def drop_enrollment(*, enrollment):
    """Drop an enrollment."""
    enrollment.status = "dropped"
    enrollment.save()
    return enrollment


def submit_review(*, student, course, rating, text=""):
    """Submit a review for a course the student is enrolled in."""
    if not Enrollment.objects.filter(
        student=student, course=course, status__in=["active", "completed"]
    ).exists():
        raise NotEnrolled()

    if Feedback.objects.filter(student=student, course=course).exists():
        raise AlreadyReviewed()

    return Feedback.objects.create(
        student=student, course=course, rating=rating, text=text
    )


def _validate_publish_ready(course):
    """Verify course has at least one module with at least one topic in curriculum JSON."""
    if not isinstance(course.curriculum, list) or len(course.curriculum) == 0:
        raise CourseNotReady()
    for module in course.curriculum:
        topics = module.get("topics", [])
        if not isinstance(topics, list) or len(topics) == 0:
            raise CourseNotReady()
