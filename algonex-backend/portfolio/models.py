from django.db import models
from common.mixins import SlugMixin, TimestampMixin


class TechTag(models.Model):
    """Reusable technology tag for case studies."""

    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class CaseStudy(TimestampMixin, SlugMixin, models.Model):
    """A case study showcasing work done for a client."""

    title = models.CharField(max_length=255)
    client_name = models.CharField(max_length=255)
    thumbnail = models.ImageField(upload_to="portfolio/thumbnails/", blank=True, null=True)
    banner = models.ImageField(upload_to="portfolio/banners/", blank=True, null=True)
    summary = models.CharField(max_length=500)
    problem = models.TextField()
    solution = models.TextField()
    results = models.TextField()
    industry = models.CharField(max_length=100)
    tech_tags = models.ManyToManyField(TechTag, blank=True, related_name="case_studies")
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    published_at = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-published_at"]
        verbose_name_plural = "Case studies"

    def __str__(self):
        return f"{self.title} ({self.client_name})"


class Screenshot(models.Model):
    """Screenshot/image for a case study."""

    case_study = models.ForeignKey(CaseStudy, on_delete=models.CASCADE, related_name="screenshots")
    image = models.ImageField(upload_to="portfolio/screenshots/")
    caption = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.case_study.title} — Screenshot {self.order}"
