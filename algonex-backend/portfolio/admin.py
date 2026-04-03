from django.contrib import admin
from .models import CaseStudy, TechTag, Screenshot


class ScreenshotInline(admin.TabularInline):
    model = Screenshot
    extra = 1


@admin.register(CaseStudy)
class CaseStudyAdmin(admin.ModelAdmin):
    list_display = ("title", "client_name", "industry", "is_featured", "is_published")
    list_filter = ("industry", "is_published", "is_featured")
    search_fields = ("title", "client_name")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ScreenshotInline]


@admin.register(TechTag)
class TechTagAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)
