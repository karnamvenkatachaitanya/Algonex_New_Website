from rest_framework import serializers
from courses.models import Tag
from courses.serializers import TagSerializer
from common.models import Media
from .models import CaseStudy

TechTagSerializer = TagSerializer


class ScreenshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
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
