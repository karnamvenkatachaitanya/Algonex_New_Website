from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from .models import Media, SiteBanner, PlatformSettings, CarouselSlide


class MediaInline(GenericTabularInline):
    """Reusable inline for adding media to any model's admin page."""
    model = Media
    extra = 1
    fields = ["image", "caption", "order"]


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ["__str__", "content_type", "object_id", "caption", "order"]
    list_filter = ["content_type"]


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ("Feature Toggles", {
            "fields": ("maintenance_mode", "maintenance_message", "course_enrollment_enabled",
                       "event_registration_enabled", "program_registration_enabled"),
        }),
        ("Showcase", {
            "fields": ("auto_publish_student_projects",),
        }),
        ("Search", {
            "fields": ("search_results_per_category",),
        }),
    )

    def has_add_permission(self, request):
        # Only allow one instance
        return not PlatformSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(CarouselSlide)
class CarouselSlideAdmin(admin.ModelAdmin):
    list_display = ["__str__", "slide_type", "item_slug", "order", "is_active"]
    list_display_links = ["__str__"]
    list_filter = ["slide_type", "is_active"]
    list_editable = ["order", "is_active"]


@admin.register(SiteBanner)
class SiteBannerAdmin(admin.ModelAdmin):
    list_display = ["text", "bg_color", "is_active", "updated_at"]
    list_filter = ["is_active"]
    list_editable = ["is_active"]
