from django.db import models
from django.utils.text import slugify


class TimestampMixin(models.Model):
    """Adds created_at and updated_at fields."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SlugMixin(models.Model):
    """Adds a unique slug field auto-generated from a `name` or `title` field."""

    slug = models.SlugField(max_length=255, unique=True, blank=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.slug:
            source = getattr(self, "name", None) or getattr(self, "title", "")
            self.slug = slugify(source)
            # Ensure uniqueness
            original_slug = self.slug
            counter = 1
            while self.__class__.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)
