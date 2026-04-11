from rest_framework import serializers
from courses.models import Course, Skill
from courses.serializers import SkillSerializer
from .models import AlumniProfile, StudentProject


class ShowcaseCourseSerializer(serializers.Serializer):
    """Lightweight course info for showcase listings."""
    name = serializers.CharField()
    slug = serializers.SlugField()


class AlumniProfileSerializer(serializers.ModelSerializer):
    course = ShowcaseCourseSerializer(read_only=True)

    class Meta:
        model = AlumniProfile
        fields = [
            "id", "name", "avatar", "course", "batch_year",
            "current_company", "current_role", "linkedin_url",
            "short_quote", "package_range",
        ]


class StudentProjectListSerializer(serializers.ModelSerializer):
    course = ShowcaseCourseSerializer(read_only=True)
    tech_tags = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = StudentProject
        fields = [
            "id", "title", "slug", "thumbnail", "student_name",
            "course", "batch_year", "tech_tags", "is_featured",
        ]


class StudentProjectDetailSerializer(serializers.ModelSerializer):
    course = ShowcaseCourseSerializer(read_only=True)
    tech_tags = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = StudentProject
        fields = [
            "id", "title", "slug", "description", "thumbnail",
            "student_name", "course", "batch_year", "tech_tags",
            "demo_url", "github_url", "is_featured",
        ]


class StudentProjectSubmitSerializer(serializers.ModelSerializer):
    """Serializer for student-submitted projects."""
    course_slug = serializers.SlugField(write_only=True)
    tech_tag_names = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False, default=[]
    )

    class Meta:
        model = StudentProject
        fields = [
            "title", "description", "thumbnail", "demo_url", "github_url",
            "course_slug", "tech_tag_names",
        ]

    def validate_course_slug(self, value):
        course = Course.objects.filter(slug=value, is_published=True).first()
        if not course:
            raise serializers.ValidationError("Course not found.")
        return value

    def create(self, validated_data):
        course_slug = validated_data.pop("course_slug")
        tech_tag_names = validated_data.pop("tech_tag_names", [])
        course = Course.objects.get(slug=course_slug)
        user = self.context["request"].user

        from common.models import PlatformSettings
        settings = PlatformSettings.load()

        project = StudentProject.objects.create(
            **validated_data,
            course=course,
            student_name=f"{user.first_name} {user.last_name}".strip() or user.email,
            batch_year=__import__("datetime").date.today().year,
            is_published=settings.auto_publish_student_projects,
        )

        for tag_name in tech_tag_names:
            skill, _ = Skill.objects.get_or_create(name=tag_name)
            project.tech_tags.add(skill)

        return project
