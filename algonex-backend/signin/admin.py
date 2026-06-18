from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import SigninProfile, RegistrationProfile, StudentRegistration


@admin.register(SigninProfile)
class SigninProfileAdmin(ModelAdmin):
    list_display = ["name", "email", "phone", "college", "course_interested", "submitted_at"]
    search_fields = ["name", "email", "college"]
    list_filter = ["course_interested", "employment_status"]


@admin.register(RegistrationProfile)
class RegistrationProfileAdmin(ModelAdmin):
    list_display = ["user", "interest_category", "program", "degree_level", "employment_status", "college", "city", "created_at"]
    list_filter = ["interest_category", "degree_level", "employment_status"]
    search_fields = ["user__email", "user__first_name", "college", "city"]
    raw_id_fields = ["user", "program"]


@admin.register(StudentRegistration)
class StudentRegistrationAdmin(ModelAdmin):
    list_display = ["student_id", "full_name", "email", "phone", "course_selected", "batch_type", "total_fee", "paid_fee", "balance_fee", "registration_date", "status"]
    list_filter = ["course_selected", "batch_type", "status"]
    search_fields = ["student_id", "full_name", "email", "upi_transaction_id", "phone", "college_name"]
    readonly_fields = ["registration_date", "balance_fee"]
    fieldsets = (
        ("Personal Information", {
            "fields": ("student_id", "full_name", "email", "phone", "dob", "gender", "photo")
        }),
        ("Location Information", {
            "fields": ("city", "state")
        }),
        ("Education Information", {
            "fields": ("college_name", "branch", "current_year")
        }),
        ("Course / Training Information", {
            "fields": ("course_selected", "batch_type", "joining_date")
        }),
        ("Payment Details", {
            "fields": ("total_fee", "paid_fee", "balance_fee", "upi_transaction_id", "status")
        }),
        ("System Meta", {
            "fields": ("registration_date",)
        }),
    )
