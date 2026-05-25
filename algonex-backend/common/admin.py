from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from .models import Media, SiteBanner, PlatformSettings, CarouselSlide, GeneralFAQ, GalleryImage


class MediaInline(GenericTabularInline):
    """Reusable inline for adding media to any model's admin page."""
    model = Media
    extra = 3
    fields = ["image", "image_preview", "caption", "order"]
    readonly_fields = ["image_preview"]
    ordering = ["order"]

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:80px; border-radius:4px;" />', obj.image.url)
        return "-"
    image_preview.short_description = "Preview"


@admin.register(Media)
class MediaAdmin(ModelAdmin):
    list_display = ["image_preview", "caption", "content_type", "object_id", "order", "created_at"]
    list_filter = ["content_type"]
    readonly_fields = ["image_preview"]

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:80px; border-radius:4px;" />', obj.image.url)
        return "-"
    image_preview.short_description = "Preview"


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(ModelAdmin):
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
        return not PlatformSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(CarouselSlide)
class CarouselSlideAdmin(ModelAdmin):
    list_display = ["__str__", "slide_type", "item_slug", "order", "is_active"]
    list_display_links = ["__str__"]
    list_filter = ["slide_type", "is_active"]
    list_editable = ["order", "is_active"]


@admin.register(SiteBanner)
class SiteBannerAdmin(ModelAdmin):
    list_display = ["text", "bg_color", "is_active", "updated_at"]
    list_filter = ["is_active"]
    list_editable = ["is_active"]


@admin.register(GeneralFAQ)
class GeneralFAQAdmin(ModelAdmin):
    list_display = ["question", "order", "is_active"]
    list_editable = ["order", "is_active"]
    search_fields = ["question", "answer"]


@admin.register(GalleryImage)
class GalleryImageAdmin(ModelAdmin):
    list_display = ["image_preview", "title", "is_featured", "order", "is_active"]
    list_display_links = ["image_preview", "title"]
    list_editable = ["is_featured", "order", "is_active"]
    readonly_fields = ["image_preview"]

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height:80px; border-radius:4px;" />', obj.image.url)
        return "-"
    image_preview.short_description = "Preview"
