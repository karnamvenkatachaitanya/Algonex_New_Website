from django.db import IntegrityError, transaction
from django.utils.text import slugify
from .models import Course, Enrollment
from .exceptions import CourseNotPublished, AlreadyEnrolled, CourseNotReady


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


def _validate_publish_ready(course):
    """Verify course has at least one module with at least one topic."""
    modules = course.modules.all()
    if not modules.exists():
        raise CourseNotReady()
    for module in modules:
        if not module.topics.exists():
            raise CourseNotReady()
