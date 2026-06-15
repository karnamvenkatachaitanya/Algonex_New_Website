from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from common.admin import MediaInline
from .models import Course, Module, Topic, Skill, Enrollment, CourseFAQ, Testimonial, StudentOutcome, CourseReview, Certificate


class ModuleInline(TabularInline):
    model = Module
    extra = 1
    show_change_link = True


class CourseFAQInline(TabularInline):
    model = CourseFAQ
    extra = 1


class TestimonialInline(TabularInline):
    model = Testimonial
    extra = 1


class TopicInline(TabularInline):
    model = Topic
    extra = 1


@admin.register(Course)
class CourseAdmin(ModelAdmin):
    list_display = ("name", "instructor", "level", "price", "is_published", "is_trending", "created_at")
    list_filter = ("level", "is_published", "is_trending", "skills")
    search_fields = ("name", "description", "instructor__email")
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("is_published", "is_trending")
    inlines = [ModuleInline, CourseFAQInline, TestimonialInline, MediaInline]


@admin.register(Module)
class ModuleAdmin(ModelAdmin):
    list_display = ("title", "course", "order")
    list_filter = ("course",)
    inlines = [TopicInline]


@admin.register(Skill)
class SkillAdmin(ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Enrollment)
class EnrollmentAdmin(ModelAdmin):
    list_display = ("student", "course", "status", "enrolled_at")
    list_filter = ("status", "course")
    search_fields = ("student__email", "course__name")


@admin.register(StudentOutcome)
class StudentOutcomeAdmin(ModelAdmin):
    list_display = ("student_name", "achievement_type", "company_name", "course", "achieved_at", "is_published")
    list_filter = ("achievement_type", "course", "is_published")
    search_fields = ("student_name", "company_name", "role")
    list_editable = ("is_published",)


@admin.register(CourseReview)
class CourseReviewAdmin(ModelAdmin):
    list_display = ("student", "course", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("student__email", "course__name")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(Certificate)
class CertificateAdmin(ModelAdmin):
    list_display = ("certificate_id", "student_name", "certificate_type", "title", "is_verified", "issue_date", "view_certificate_link")
    list_filter = ("certificate_type", "is_verified", "issue_date")
    search_fields = ("certificate_id", "student_name", "title", "intern_id")
    list_editable = ("is_verified",)

    def view_certificate_link(self, obj):
        from django.utils.html import format_html
        from django.conf import settings
        if settings.DEBUG:
            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
            url = f"{frontend_url}/verify/Certificate/ID={obj.certificate_id}"
        else:
            url = f"/verify/Certificate/ID={obj.certificate_id}"
        return format_html(
            '<a href="{}" target="_blank" style="color: #1677ff; font-weight: bold; text-decoration: underline;">View/Download</a>',
            url
        )
    view_certificate_link.short_description = "Download/View"
