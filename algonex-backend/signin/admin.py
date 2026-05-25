from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import SigninProfile, RegistrationProfile


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
