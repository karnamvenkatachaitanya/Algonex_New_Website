from django.conf import settings
from django.db import models
from django.utils import timezone
from common.mixins import TimestampMixin, SlugMixin


class Event(TimestampMixin, SlugMixin, models.Model):
    """An event (workshop, webinar, hackathon, meetup) with capacity management."""

    TYPE_CHOICES = [
        ("workshop", "Workshop"),
        ("webinar", "Webinar"),
        ("hackathon", "Hackathon"),
        ("meetup", "Meetup"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to="events/", blank=True, null=True)
    event_type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)
    location = models.CharField(max_length=255)
    meeting_link = models.URLField(blank=True, help_text="Visible only to confirmed registrants")
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    capacity = models.PositiveIntegerField()
    is_published = models.BooleanField(default=False)

    # SlugMixin uses `name` or `title` — we have `title`

    class Meta:
        ordering = ["start_date"]

    def __str__(self):
        return self.title

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.start_date and self.end_date and self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date.")

    @property
    def spots_left(self):
        confirmed = self.registrations.filter(status="confirmed").count()
        return max(0, self.capacity - confirmed)

    @property
    def is_full(self):
        return self.spots_left <= 0

    @property
    def status(self):
        now = timezone.now()
        if now < self.start_date:
            return "upcoming"
        if now <= self.end_date:
            return "ongoing"
        return "past"


class Registration(models.Model):
    """Tracks a user's registration for an event."""

    STATUS_CHOICES = [
        ("confirmed", "Confirmed"),
        ("waitlisted", "Waitlisted"),
        ("cancelled", "Cancelled"),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="registrations")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_registrations"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "user")
        ordering = ["registered_at"]

    def __str__(self):
        return f"{self.user.email} → {self.event.title} ({self.status})"
