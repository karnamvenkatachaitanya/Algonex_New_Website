from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.mixins import ListModelMixin

from django.shortcuts import get_object_or_404

from .models import Job, Application
from .serializers import (
    JobListSerializer,
    JobDetailSerializer,
    JobCreateUpdateSerializer,
    ApplicationSubmitSerializer,
    ApplicationListSerializer,
    ApplicationAdminSerializer,
    ApplicationTransitionSerializer,
)
from .filters import JobFilter
from .services import submit_application, transition_application
from .selectors import get_active_jobs, get_job_detail, get_user_applications, get_job_applications
from common.permissions import IsAdmin


class JobViewSet(ModelViewSet):
    """
    Public: list/retrieve active jobs.
    Admin: create/update/delete jobs.
    Authenticated: apply.
    """

    lookup_field = "slug"
    filterset_class = JobFilter

    def get_queryset(self):
        if self.action in ("list", "retrieve"):
            return get_active_jobs(filters=self.request.query_params.dict())
        return Job.objects.all()

    def get_serializer_class(self):
        if self.action == "list":
            return JobListSerializer
        if self.action == "retrieve":
            return JobDetailSerializer
        return JobCreateUpdateSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticatedOrReadOnly()]
        if self.action == "apply":
            return [IsAuthenticated()]
        return [IsAdmin()]

    def retrieve(self, request, *args, **kwargs):
        job = get_job_detail(slug=kwargs["slug"])
        if not job:
            return Response(
                {"status": "error", "error": {"code": "NOT_FOUND", "message": "Job not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(job)
        return Response({"status": "success", "data": serializer.data})

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({"status": "success", "data": serializer.data})

    @action(detail=True, methods=["post"], parser_classes=[
        __import__("rest_framework.parsers", fromlist=["MultiPartParser"]).MultiPartParser,
    ])
    def apply(self, request, slug=None):
        """POST /api/v1/careers/:slug/apply/"""
        job = get_object_or_404(Job, slug=slug, is_active=True)
        serializer = ApplicationSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        application = submit_application(
            applicant=request.user,
            job=job,
            resume=serializer.validated_data["resume"],
            cover_letter=serializer.validated_data.get("cover_letter", ""),
        )
        return Response(
            {"status": "success", "data": ApplicationListSerializer(application).data},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], permission_classes=[IsAdmin])
    def applications(self, request, slug=None):
        """GET /api/v1/careers/:slug/applications/ (admin)"""
        job = get_object_or_404(Job, slug=slug)
        apps = get_job_applications(job=job)
        serializer = ApplicationAdminSerializer(apps, many=True)
        return Response({"status": "success", "data": serializer.data})


class UserApplicationViewSet(ListModelMixin, GenericViewSet):
    """List current user's job applications."""

    serializer_class = ApplicationListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_user_applications(user=self.request.user)


class ApplicationAdminViewSet(GenericViewSet):
    """Admin actions on applications — transition status."""

    permission_classes = [IsAdmin]
    queryset = Application.objects.all()

    @action(detail=True, methods=["patch"], url_path="transition")
    def transition(self, request, pk=None):
        """PATCH /api/v1/applications/:id/transition/"""
        application = get_object_or_404(Application, pk=pk)
        serializer = ApplicationTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = transition_application(
            application=application,
            new_status=serializer.validated_data["status"],
            admin_notes=serializer.validated_data.get("admin_notes", ""),
        )
        return Response(
            {"status": "success", "data": ApplicationAdminSerializer(updated).data}
        )
