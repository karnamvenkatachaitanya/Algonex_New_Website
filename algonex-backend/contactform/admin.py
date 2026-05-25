from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import ContactForm


@admin.register(ContactForm)
class ContactFormAdmin(ModelAdmin):
    list_display = ("full_name", "email", "subject", "submitted_at")
    list_filter = ("submitted_at",)
    search_fields = ("full_name", "email", "subject")
    readonly_fields = ("submitted_at",)
