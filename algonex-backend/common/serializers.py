from rest_framework import serializers
from .models import Media, GeneralFAQ, GalleryImage


class SmartImageField(serializers.ImageField):
    """Returns absolute URLs as-is instead of prepending MEDIA_URL."""

    def to_representation(self, value):
        if not value:
            return None
        # If the stored value is already an absolute URL, return it directly
        name = value.name if hasattr(value, "name") else str(value)
        if name.startswith(("http://", "https://")):
            return name
        return super().to_representation(value)


class MediaSerializer(serializers.ModelSerializer):
    image = SmartImageField()

    class Meta:
        model = Media
        fields = ["id", "image", "caption", "order"]


class GeneralFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneralFAQ
        fields = ["id", "question", "answer", "order"]


class GalleryImageSerializer(serializers.ModelSerializer):
    image = SmartImageField()

    class Meta:
        model = GalleryImage
        fields = ["id", "title", "image", "caption", "order", "is_featured"]
