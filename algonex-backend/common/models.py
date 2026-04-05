from django.db import models


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
