from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.mixins import ListModelMixin

from django.shortcuts import get_object_or_404

from .models import Event, Registration
from .serializers import (
    EventListSerializer,
    EventDetailSerializer,
    EventCreateUpdateSerializer,
    RegistrationSerializer,
)
from .filters import EventFilter
from .services import register_for_event, cancel_registration
from .selectors import get_published_events, get_event_detail, get_user_registrations
from common.permissions import IsAdmin


class EventViewSet(ModelViewSet):
    """
    Public: list/retrieve published events.
    Admin: create/update/delete events.
    Authenticated: register/cancel.
    """

    lookup_field = "slug"
    filterset_class = EventFilter

    def get_queryset(self):
        if self.action in ("list", "retrieve"):
            return get_published_events(filters=self.request.query_params.dict())
        return Event.objects.all()

    def get_serializer_class(self):
        if self.action == "list":
            return EventListSerializer
        if self.action == "retrieve":
            return EventDetailSerializer
        return EventCreateUpdateSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticatedOrReadOnly()]
        if self.action in ("register", "cancel"):
            return [IsAuthenticated()]
        return [IsAdmin()]

    def retrieve(self, request, *args, **kwargs):
        event = get_event_detail(slug=kwargs["slug"])
        if not event:
            return Response(
                {"status": "error", "error": {"code": "NOT_FOUND", "message": "Event not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(event, context={"request": request})
        return Response({"status": "success", "data": serializer.data})

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({"status": "success", "data": serializer.data})

    @action(detail=True, methods=["post"])
    def register(self, request, slug=None):
        """POST /api/v1/events/:slug/register/"""
        event = get_object_or_404(Event, slug=slug, is_published=True)
        registration = register_for_event(user=request.user, event=event)
        serializer = RegistrationSerializer(registration)
        return Response(
            {"status": "success", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, slug=None):
        """POST /api/v1/events/:slug/cancel/"""
        event = get_object_or_404(Event, slug=slug)
        registration = get_object_or_404(
            Registration, event=event, user=request.user, status__in=["confirmed", "waitlisted"]
        )
        promoted = cancel_registration(registration=registration)
        return Response(
            {"status": "success", "data": {"message": "Registration cancelled."}},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], permission_classes=[IsAdmin])
    def attendees(self, request, slug=None):
        """GET /api/v1/events/:slug/attendees/ (admin only)"""
        event = get_object_or_404(Event, slug=slug)
        registrations = event.registrations.exclude(status="cancelled").select_related("user")
        serializer = RegistrationSerializer(registrations, many=True)
        return Response({"status": "success", "data": serializer.data})


class UserRegistrationViewSet(ListModelMixin, GenericViewSet):
    """List current user's event registrations."""

    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_user_registrations(user=self.request.user)
