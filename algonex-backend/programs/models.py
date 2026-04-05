from django.db import models
from django.utils import timezone
from common.mixins import TimestampMixin, SlugMixin


class Program(TimestampMixin, SlugMixin, models.Model):
    """A fellowship or internship program listing."""

    TYPE_CHOICES = [
        ("fellowship", "Fellowship"),
        ("internship", "Internship"),
    ]

    DEGREE_CHOICES = [
        ("diploma", "Diploma"),
        ("bachelors", "Bachelors"),
        ("masters", "Masters"),
        ("phd", "PhD"),
        ("other", "Other"),
    ]

    # Basic
    title = models.CharField(max_length=255)
    description = models.TextField(help_text="Supports Markdown")
    image = models.ImageField(upload_to="programs/images/", blank=True, null=True)
    banner = models.ImageField(upload_to="programs/banners/", blank=True, null=True)
    program_type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)

    # Details
    duration = models.CharField(max_length=50, help_text="e.g. '3 months', '6 weeks'")
    stipend = models.CharField(max_length=100, blank=True, help_text="e.g. '₹15,000/month'")
    location = models.CharField(max_length=255)
    is_remote = models.BooleanField(default=False)

    # Eligibility
    eligibility_criteria = models.TextField(help_text="Markdown description of eligibility")
    min_degree_level = models.CharField(max_length=20, choices=DEGREE_CHOICES, blank=True)
    eligible_branches = models.TextField(blank=True, help_text="Comma-separated branch names")

    # Dates
    application_deadline = models.DateField()
    start_date = models.DateField()
    end_date = models.DateField()

    # Capacity & Status
    capacity = models.PositiveIntegerField()
    is_published = models.BooleanField(default=False, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ["-is_featured", "application_deadline"]

    def __str__(self):
        return f"{self.title} ({self.get_program_type_display()})"

    @property
    def is_accepting(self):
        return self.application_deadline >= timezone.now().date()

    @property
    def registration_count(self):
        return self.registration_profiles.count()

    @property
    def spots_left(self):
        return max(0, self.capacity - self.registration_count)
