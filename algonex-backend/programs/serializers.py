from rest_framework import serializers
from .models import Program


class ProgramListSerializer(serializers.ModelSerializer):
    is_accepting = serializers.BooleanField(read_only=True)
    registration_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Program
        fields = [
            "id", "title", "slug", "program_type", "image",
            "duration", "stipend", "location", "is_remote",
            "application_deadline", "start_date",
            "is_featured", "registration_count", "is_accepting",
        ]


class ProgramDetailSerializer(serializers.ModelSerializer):
    is_accepting = serializers.BooleanField(read_only=True)
    registration_count = serializers.IntegerField(read_only=True)
    spots_left = serializers.IntegerField(read_only=True)

    class Meta:
        model = Program
        fields = [
            "id", "title", "slug", "program_type", "image", "banner",
            "description", "duration", "stipend", "location", "is_remote",
            "eligibility_criteria", "min_degree_level", "eligible_branches",
            "application_deadline", "start_date", "end_date",
            "capacity", "is_featured",
            "registration_count", "spots_left", "is_accepting",
            "created_at",
        ]


class ProgramCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = [
            "title", "description", "image", "banner", "program_type",
            "duration", "stipend", "location", "is_remote",
            "eligibility_criteria", "min_degree_level", "eligible_branches",
            "application_deadline", "start_date", "end_date",
            "capacity", "is_published", "is_featured",
        ]
