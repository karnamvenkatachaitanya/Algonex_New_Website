from .models import Registration
from .exceptions import EventNotOpen, AlreadyRegistered


def register_for_event(*, user, event):
    """Register a user for an event. Auto-confirm or waitlist based on capacity."""
    if event.status != "upcoming":
        raise EventNotOpen()

    if not event.is_published:
        raise EventNotOpen()

    existing = Registration.objects.filter(
        event=event, user=user
    ).exclude(status="cancelled").first()
    if existing:
        raise AlreadyRegistered()

    status = "confirmed" if event.spots_left > 0 else "waitlisted"
    return Registration.objects.create(event=event, user=user, status=status)


def cancel_registration(*, registration):
    """Cancel a registration and promote the next waitlisted person."""
    registration.status = "cancelled"
    registration.save()

    # Promote oldest waitlisted
    next_in_line = Registration.objects.filter(
        event=registration.event, status="waitlisted"
    ).order_by("registered_at").first()

    if next_in_line:
        next_in_line.status = "confirmed"
        next_in_line.save()
        return next_in_line

    return None
