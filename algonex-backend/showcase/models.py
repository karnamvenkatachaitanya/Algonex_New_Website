from django.db import models
from common.mixins import TimestampMixin, SlugMixin


class AlumniProfile(TimestampMixin, models.Model):
    """Published alumni profile for the alumni wall."""

    name = models.CharField(max_length=100)
    avatar = models.ImageField(upload_to="alumni/avatars/", blank=True)
    course = models.ForeignKey(
        "courses.Course", on_delete=models.CASCADE, related_name="alumni"
    )
    batch_year = models.PositiveIntegerField()
    current_company = models.CharField(max_length=100)
    current_role = models.CharField(max_length=100)
    linkedin_url = models.URLField(blank=True)
    short_quote = models.CharField(max_length=300, blank=True)
    package_range = models.CharField(max_length=50, blank=True)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-batch_year", "name"]

    def __str__(self):
        return f"{self.name} - {self.current_role} at {self.current_company}"


class StudentProject(TimestampMixin, SlugMixin, models.Model):
    """Published student project for the projects gallery."""

    title = models.CharField(max_length=200)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to="projects/thumbnails/")
    student_name = models.CharField(max_length=100)
    course = models.ForeignKey(
        "courses.Course", on_delete=models.CASCADE, related_name="student_projects"
    )
    batch_year = models.PositiveIntegerField()
    tech_tags = models.ManyToManyField("courses.Skill", blank=True)
    demo_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-batch_year", "title"]

    def __str__(self):
        return f"{self.title} by {self.student_name}"
