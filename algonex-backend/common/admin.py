from django.contrib import admin
from .models import SiteBanner


@admin.register(SiteBanner)
class SiteBannerAdmin(admin.ModelAdmin):
    list_display = ["text", "bg_color", "is_active", "updated_at"]
    list_filter = ["is_active"]
    list_editable = ["is_active"]
