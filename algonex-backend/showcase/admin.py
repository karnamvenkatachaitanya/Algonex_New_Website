from import_export.admin import ImportExportModelAdmin
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import StudentProject


@admin.register(StudentProject)
class StudentProjectAdmin(ImportExportModelAdmin, ModelAdmin):
    list_display = ("title", "student_name", "course", "batch_year", "is_featured", "is_published")
    list_filter = ("course", "batch_year", "is_featured", "is_published")
    search_fields = ("title", "student_name")
    list_editable = ("is_featured", "is_published")
    prepopulated_fields = {"slug": ("title",)}
