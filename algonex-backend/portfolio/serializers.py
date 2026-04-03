from rest_framework import serializers
from .models import CaseStudy, TechTag, Screenshot


class TechTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechTag
        fields = ["id", "name"]


class ScreenshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Screenshot
        fields = ["id", "image", "caption", "order"]


class CaseStudyListSerializer(serializers.ModelSerializer):
    tech_tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")

    class Meta:
        model = CaseStudy
        fields = [
            "id", "title", "slug", "client_name", "thumbnail",
            "summary", "industry", "tech_tags", "is_featured", "published_at",
        ]


class CaseStudyDetailSerializer(serializers.ModelSerializer):
    tech_tags = TechTagSerializer(many=True, read_only=True)
    screenshots = ScreenshotSerializer(many=True, read_only=True)

    class Meta:
        model = CaseStudy
        fields = [
            "id", "title", "slug", "client_name", "thumbnail", "banner",
            "summary", "problem", "solution", "results",
            "industry", "tech_tags", "screenshots", "is_featured", "published_at",
        ]
