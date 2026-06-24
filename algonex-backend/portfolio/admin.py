from import_export.admin import ImportExportModelAdmin
from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from unfold.admin import ModelAdmin
from common.models import Media
from .models import CaseStudy


class ScreenshotInline(GenericTabularInline):
    model = Media
    extra = 1


@admin.register(CaseStudy)
class CaseStudyAdmin(ImportExportModelAdmin, ModelAdmin):
    list_display = ("title", "client_name", "industry", "is_featured", "is_published")
    list_filter = ("industry", "is_published", "is_featured")
    search_fields = ("title", "client_name")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ScreenshotInline]
