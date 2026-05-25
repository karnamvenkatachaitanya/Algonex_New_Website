from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from .mixins import TimestampMixin


class Media(models.Model):
    """Generic media/image attachment for any model (courses, events, programs, etc.)."""

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    image = models.ImageField(upload_to="media/%Y/%m/")
    caption = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]
        verbose_name_plural = "Media"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"Media #{self.pk} for {self.content_type} #{self.object_id}"


class PlatformSettings(models.Model):
    """Singleton site-wide settings managed via Django admin. Exactly one row should exist."""

    # Feature toggles
    maintenance_mode = models.BooleanField(default=False, help_text="Show maintenance page to all visitors")
    maintenance_message = models.CharField(max_length=500, default="We'll be back shortly.", blank=True)

    course_enrollment_enabled = models.BooleanField(default=True, help_text="Allow students to enroll in courses")
    event_registration_enabled = models.BooleanField(default=True, help_text="Allow users to register for events")
    program_registration_enabled = models.BooleanField(default=True, help_text="Allow users to register for programs")

    # Showcase
    auto_publish_student_projects = models.BooleanField(default=True, help_text="Auto-publish student-submitted projects (False = admin approval required)")

    # Search
    search_results_per_category = models.PositiveIntegerField(default=5, help_text="Max results per category in global search")

    class Meta:
        verbose_name = "Platform Settings"
        verbose_name_plural = "Platform Settings"

    def __str__(self):
        return "Platform Settings"

    def save(self, *args, **kwargs):
        # Enforce singleton: always use pk=1
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        """Load the singleton settings instance, creating defaults if needed."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class CarouselSlide(models.Model):
    """Admin-managed homepage carousel slide with ordering."""

    SLIDE_TYPES = [
        ("hero", "Hero (default branding)"),
        ("course", "Course"),
        ("event", "Event"),
        ("program", "Program"),
    ]

    slide_type = models.CharField(max_length=20, choices=SLIDE_TYPES)
    item_slug = models.SlugField(blank=True, help_text="Slug of the course/event/program. Leave blank for hero slides.")
    order = models.PositiveIntegerField(default=0, help_text="Lower number = shown first")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(fields=["order"], name="unique_carousel_order"),
            models.UniqueConstraint(
                fields=["slide_type", "item_slug"],
                condition=~models.Q(item_slug=""),
                name="unique_carousel_item",
            ),
        ]

    def __str__(self):
        if self.slide_type == "hero":
            return f"[{self.order}] Hero Slide"
        return f"[{self.order}] {self.get_slide_type_display()}: {self.item_slug}"


class SiteBanner(models.Model):
    """A promotional banner shown at the top of the site. Only one can be active at a time."""

    text = models.CharField(max_length=500)
    link = models.URLField(blank=True, help_text="Optional link when banner is clicked")
    bg_color = models.CharField(max_length=7, default="#00D4FF", help_text="Hex color, e.g. #00D4FF")
    text_color = models.CharField(max_length=7, default="#000000")
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{'[ACTIVE] ' if self.is_active else ''}{self.text[:60]}"

    def save(self, *args, **kwargs):
        # Only one banner can be active at a time
        if self.is_active:
            SiteBanner.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)


class GeneralFAQ(TimestampMixin, models.Model):
    """Site-wide general FAQs."""

    question = models.CharField(max_length=500)
    answer = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "created_at"]
        verbose_name = "General FAQ"
        verbose_name_plural = "General FAQs"

    def __str__(self):
        return self.question[:50]


class GalleryImage(TimestampMixin, models.Model):
    """Platform-wide image gallery."""

    title = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to="gallery/%Y/%m/")
    caption = models.CharField(max_length=500, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, help_text="Show on homepage gallery")

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title or f"Gallery Image {self.pk}"
