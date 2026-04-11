from django.contrib import admin
from common.admin import MediaInline
from .models import Course, Module, Topic, Skill, Enrollment, CourseFAQ, Testimonial, StudentOutcome


class ModuleInline(admin.TabularInline):
    model = Module
    extra = 1
    show_change_link = True


class CourseFAQInline(admin.TabularInline):
    model = CourseFAQ
    extra = 1


class TestimonialInline(admin.TabularInline):
    model = Testimonial
    extra = 1


class TopicInline(admin.TabularInline):
    model = Topic
    extra = 1


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("name", "instructor", "level", "is_published", "is_trending", "price")
    list_filter = ("level", "is_published", "is_trending")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ModuleInline, CourseFAQInline, TestimonialInline, MediaInline]


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order")
    list_filter = ("course",)
    inlines = [TopicInline]


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "status", "enrolled_at")
    list_filter = ("status",)
    search_fields = ("student__email", "course__name")


@admin.register(StudentOutcome)
class StudentOutcomeAdmin(admin.ModelAdmin):
    list_display = ("student_name", "achievement_type", "company_name", "course", "achieved_at", "is_published")
    list_filter = ("achievement_type", "course", "is_published")
    search_fields = ("student_name", "company_name", "role")
    list_editable = ("is_published",)
