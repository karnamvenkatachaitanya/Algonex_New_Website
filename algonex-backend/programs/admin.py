from django.contrib import admin
from unfold.admin import ModelAdmin
from common.admin import MediaInline
from .models import Program


@admin.register(Program)
class ProgramAdmin(ModelAdmin):
    list_display = ["title", "program_type", "is_published", "is_featured", "application_deadline"]
    list_filter = ["program_type", "is_published", "is_featured"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
    inlines = [MediaInline]
