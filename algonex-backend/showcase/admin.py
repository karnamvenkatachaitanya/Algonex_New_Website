from django.contrib import admin
from .models import AlumniProfile, StudentProject


@admin.register(AlumniProfile)
class AlumniProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "current_company", "current_role", "course", "batch_year", "is_featured", "is_published")
    list_filter = ("course", "batch_year", "is_featured", "is_published")
    search_fields = ("name", "current_company", "current_role")
    list_editable = ("is_featured", "is_published")


@admin.register(StudentProject)
class StudentProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "student_name", "course", "batch_year", "is_featured", "is_published")
    list_filter = ("course", "batch_year", "is_featured", "is_published")
    search_fields = ("title", "student_name")
    list_editable = ("is_featured", "is_published")
    prepopulated_fields = {"slug": ("title",)}
