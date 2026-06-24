from import_export.admin import ImportExportModelAdmin
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import Job, Application


class ApplicationInline(TabularInline):
    model = Application
    extra = 0
    readonly_fields = ("applied_at", "updated_at")


@admin.register(Job)
class JobAdmin(ImportExportModelAdmin, ModelAdmin):
    list_display = ("title", "apply_mode", "department", "job_type", "location", "is_remote", "is_active", "company_name")
    list_filter = ("apply_mode", "department", "job_type", "is_active", "is_remote")
    search_fields = ("title", "description", "company_name")
    prepopulated_fields = {"slug": ("title",)}

    fieldsets = (
        (None, {
            "fields": (
                "title", "slug", "apply_mode", "department", "job_type",
                "location", "is_remote", "description", "requirements",
                "salary_min", "salary_max", "is_active", "deadline", "tags",
            ),
        }),
        ("External Listing", {
            "classes": ("collapse",),
            "fields": ("external_link", "company_name", "company_logo", "eligibility_criteria"),
            "description": "Only used when Apply Mode is 'External'.",
        }),
    )

    def get_inlines(self, request, obj=None):
        if obj and obj.apply_mode == "external":
            return []
        return [ApplicationInline]


@admin.register(Application)
class ApplicationAdmin(ImportExportModelAdmin, ModelAdmin):
    list_display = ("applicant", "job", "status", "applied_at")
    list_filter = ("status",)
    search_fields = ("applicant__email", "job__title")
    readonly_fields = ("applied_at", "updated_at")
