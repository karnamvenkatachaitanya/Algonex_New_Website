from rest_framework import serializers
from common.serializers import MediaSerializer
from .models import Event, Registration


class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for event listings."""
    spots_left = serializers.IntegerField(read_only=True)
    confirmed_count = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    media = MediaSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = [
            "id", "title", "slug", "summary", "image", "event_type",
            "location", "start_date", "end_date", "capacity",
            "spots_left", "confirmed_count", "status", "media",
        ]

    def get_confirmed_count(self, obj):
        return obj.capacity - obj.spots_left


class EventDetailSerializer(serializers.ModelSerializer):
    """Full event detail — includes meeting_link only for confirmed registrants."""
    spots_left = serializers.IntegerField(read_only=True)
    confirmed_count = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    user_registration_status = serializers.SerializerMethodField()
    meeting_link = serializers.SerializerMethodField()

    def get_confirmed_count(self, obj):
        return obj.capacity - obj.spots_left

    media = MediaSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = [
            "id", "title", "slug", "description", "image", "event_type",
            "location", "meeting_link", "start_date", "end_date",
            "capacity", "spots_left", "confirmed_count", "is_full", "status",
            "is_published", "user_registration_status", "media", "created_at",
        ]

    def get_user_registration_status(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            reg = obj.registrations.filter(user=request.user).exclude(status="cancelled").first()
            return reg.status if reg else None
        return None

    def get_meeting_link(self, obj):
        """Only show meeting_link to confirmed registrants."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            is_confirmed = obj.registrations.filter(
                user=request.user, status="confirmed"
            ).exists()
            if is_confirmed:
                return obj.meeting_link
        return None


class EventCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for admin creating/updating events."""

    class Meta:
        model = Event
        fields = [
            "title", "summary", "description", "image", "event_type", "location",
            "meeting_link", "start_date", "end_date", "capacity", "is_published",
        ]


class RegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    event_slug = serializers.CharField(source="event.slug", read_only=True)

    class Meta:
        model = Registration
        fields = ["id", "event_title", "event_slug", "status", "registered_at"]
