from django.contrib import admin
from .models import Job, Application


class ApplicationInline(admin.TabularInline):
    model = Application
    extra = 0
    readonly_fields = ("applied_at", "updated_at")


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("title", "department", "job_type", "location", "is_remote", "is_active")
    list_filter = ("department", "job_type", "is_active", "is_remote")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ApplicationInline]


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("applicant", "job", "status", "applied_at")
    list_filter = ("status",)
    search_fields = ("applicant__email", "job__title")
    readonly_fields = ("applied_at", "updated_at")
