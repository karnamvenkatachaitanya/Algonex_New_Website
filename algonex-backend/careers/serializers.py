from rest_framework import serializers
from .models import Job, Application


class JobListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id", "title", "slug", "department", "job_type", "location",
            "is_remote", "salary_min", "salary_max", "deadline", "created_at",
        ]


class JobDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id", "title", "slug", "department", "job_type", "location",
            "is_remote", "description", "requirements",
            "salary_min", "salary_max", "deadline", "created_at",
        ]


class JobCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "title", "department", "job_type", "location", "is_remote",
            "description", "requirements", "salary_min", "salary_max",
            "is_active", "deadline",
        ]


class ApplicationSubmitSerializer(serializers.Serializer):
    """Input serializer for submitting an application."""
    resume = serializers.FileField()
    cover_letter = serializers.CharField(required=False, allow_blank=True, default="")


class ApplicationListSerializer(serializers.ModelSerializer):
    """Applicant-facing — no admin_notes."""
    job_title = serializers.CharField(source="job.title", read_only=True)
    job_slug = serializers.CharField(source="job.slug", read_only=True)

    class Meta:
        model = Application
        fields = ["id", "job_title", "job_slug", "status", "applied_at", "updated_at"]


class ApplicationAdminSerializer(serializers.ModelSerializer):
    """Admin-facing — includes admin_notes and applicant info."""
    applicant_email = serializers.CharField(source="applicant.email", read_only=True)
    applicant_name = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id", "applicant_email", "applicant_name", "resume",
            "cover_letter", "status", "admin_notes", "applied_at", "updated_at",
        ]

    def get_applicant_name(self, obj):
        return f"{obj.applicant.first_name} {obj.applicant.last_name}".strip()


class ApplicationTransitionSerializer(serializers.Serializer):
    """Input serializer for transitioning application status."""
    status = serializers.ChoiceField(choices=Application.STATUS_CHOICES)
    admin_notes = serializers.CharField(required=False, allow_blank=True, default="")
