from django.conf import settings
from django.db import models
from common.mixins import TimestampMixin, SlugMixin


class Skill(models.Model):
    """Reusable skill/technology tag shared across courses."""

    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Course(TimestampMixin, SlugMixin, models.Model):
    """A course offered on the platform."""

    LEVEL_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    ]

    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="courses_taught",
    )
    name = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to="courses/images/", blank=True, null=True)
    banner = models.ImageField(upload_to="courses/banners/", blank=True, null=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default="beginner")
    prior_knowledge = models.TextField(blank=True)
    duration = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.IntegerField(default=0, help_text="Discount percentage")
    is_trending = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    skills = models.ManyToManyField(Skill, blank=True, related_name="courses")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    @property
    def student_count(self):
        return self.enrollments.filter(status="active").count()


class Module(models.Model):
    """A module within a course, containing ordered topics."""

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.course.name} — {self.title}"


class Topic(models.Model):
    """A topic within a module."""

    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="topics")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class Enrollment(models.Model):
    """Tracks a student's enrollment in a course."""

    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("dropped", "Dropped"),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    class Meta:
        unique_together = ("student", "course")
        ordering = ["-enrolled_at"]

    def __str__(self):
        return f"{self.student.email} → {self.course.name}"


class CourseFAQ(models.Model):
    """FAQ entry for a course."""

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="faqs")
    question = models.CharField(max_length=500)
    answer = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.question[:50]


class Testimonial(models.Model):
    """Student testimonial for a course."""

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="testimonials")
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to="testimonials/", blank=True, null=True)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    text = models.TextField()

    def __str__(self):
        return f"{self.name} — {self.course.name}"
