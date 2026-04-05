from django.contrib import admin
from .models import Program


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ["title", "program_type", "is_published", "is_featured", "application_deadline"]
    list_filter = ["program_type", "is_published", "is_featured"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
