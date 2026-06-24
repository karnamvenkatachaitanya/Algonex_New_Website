from import_export.admin import ImportExportModelAdmin
from django.contrib import admin
from unfold.admin import ModelAdmin
from common.admin import MediaInline
from .models import Program


@admin.register(Program)
class ProgramAdmin(ImportExportModelAdmin, ModelAdmin):
    list_display = ["name", "course_type", "is_published", "is_featured", "application_deadline"]
    list_filter = ["course_type", "is_published", "is_featured"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [MediaInline]

    def save_model(self, request, obj, form, change):
        if not obj.course_type or obj.course_type == "course":
            obj.course_type = "fellowship"
        super().save_model(request, obj, form, change)
