from django.conf import settings
from django.db import models
from common.mixins import TimestampMixin, SlugMixin


class Job(TimestampMixin, SlugMixin, models.Model):
    """A job listing on the platform."""

    DEPARTMENT_CHOICES = [
        ("engineering", "Engineering"),
        ("design", "Design"),
        ("marketing", "Marketing"),
        ("operations", "Operations"),
    ]

    JOB_TYPE_CHOICES = [
        ("full_time", "Full Time"),
        ("part_time", "Part Time"),
        ("internship", "Internship"),
        ("contract", "Contract"),
    ]

    title = models.CharField(max_length=255)
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES)
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES)
    location = models.CharField(max_length=255)
    is_remote = models.BooleanField(default=False)
    description = models.TextField()
    requirements = models.TextField()
    salary_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    deadline = models.DateField(null=True, blank=True)

    # SlugMixin auto-generates slug from `title`

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.department})"


class Application(models.Model):
    """A job application with hiring pipeline status."""

    STATUS_CHOICES = [
        ("applied", "Applied"),
        ("reviewed", "Reviewed"),
        ("interview", "Interview"),
        ("hired", "Hired"),
        ("rejected", "Rejected"),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_applications"
    )
    resume = models.FileField(upload_to="resumes/")
    cover_letter = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="applied")
    admin_notes = models.TextField(blank=True, help_text="Internal notes, never shown to applicant")
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("job", "applicant")
        ordering = ["-applied_at"]

    def __str__(self):
        return f"{self.applicant.email} → {self.job.title} ({self.status})"
