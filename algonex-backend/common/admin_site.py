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
