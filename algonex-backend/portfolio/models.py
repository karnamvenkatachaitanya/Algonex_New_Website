from django.db import models
from django.contrib.contenttypes.fields import GenericRelation
from common.mixins import SlugMixin, TimestampMixin


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
    tech_tags = models.ManyToManyField("courses.Tag", blank=True, related_name="case_studies")
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    published_at = models.DateField(null=True, blank=True)
    
    # Generic relation to Media model in common app
    screenshots = GenericRelation("common.Media")

    class Meta:
        ordering = ["-published_at"]
        verbose_name_plural = "Case studies"

    def __str__(self):
        return f"{self.title} ({self.client_name})"
