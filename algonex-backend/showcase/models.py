from django.db import models
from common.mixins import TimestampMixin, SlugMixin


class StudentProject(TimestampMixin, SlugMixin, models.Model):
    """Published student project for the projects gallery."""

    title = models.CharField(max_length=200)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to="projects/thumbnails/", blank=True)
    student_name = models.CharField(max_length=100)
    course = models.ForeignKey(
        "courses.Course", on_delete=models.CASCADE, related_name="student_projects"
    )
    batch_year = models.PositiveIntegerField()
    tech_tags = models.ManyToManyField("courses.Tag", blank=True)
    demo_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-batch_year", "title"]

    def __str__(self):
        return f"{self.title} by {self.student_name}"
