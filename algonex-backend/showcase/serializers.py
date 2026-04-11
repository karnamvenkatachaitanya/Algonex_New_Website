from rest_framework import serializers
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
