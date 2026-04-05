from django.db.models import Count, Q
from .models import Event, Registration


def get_published_events(*, filters=None):
    """Return published events with registration counts."""
    qs = Event.objects.filter(is_published=True).annotate(
        confirmed_count=Count("registrations", filter=Q(registrations__status="confirmed")),
    )

    if filters:
        if filters.get("event_type"):
            qs = qs.filter(event_type=filters["event_type"])
        if filters.get("upcoming"):
            from django.utils import timezone
            qs = qs.filter(start_date__gt=timezone.now())

    return qs.order_by("start_date")


def get_event_detail(*, slug):
    """Return a single published event with registration data."""
    return Event.objects.filter(slug=slug, is_published=True).first()


def get_user_registrations(*, user):
    """Return a user's event registrations."""
    return (
        Registration.objects.filter(user=user)
        .exclude(status="cancelled")
        .select_related("event")
    )
