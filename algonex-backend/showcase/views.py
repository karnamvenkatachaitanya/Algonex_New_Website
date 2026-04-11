from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from common.pagination import StandardPagination
from .selectors import (
    get_published_alumni, get_featured_alumni,
    get_published_projects, get_featured_projects, get_project_detail,
)
from .serializers import (
    AlumniProfileSerializer, StudentProjectListSerializer, StudentProjectDetailSerializer,
)


class ShowcasePagination(StandardPagination):
    page_size = 20


class AlumniViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Public read-only endpoint for alumni profiles."""
    serializer_class = AlumniProfileSerializer
    permission_classes = [AllowAny]
    pagination_class = ShowcasePagination

    def get_queryset(self):
        return get_published_alumni(
            course_slug=self.request.query_params.get("course"),
            batch_year=self.request.query_params.get("batch_year"),
            company=self.request.query_params.get("company"),
            search=self.request.query_params.get("search"),
        )

    @action(detail=False, methods=["get"])
    def featured(self, request):
        alumni = get_featured_alumni()
        serializer = self.get_serializer(alumni, many=True)
        return Response({"status": "success", "data": serializer.data})


class StudentProjectViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Public read-only endpoint for student projects."""
    permission_classes = [AllowAny]
    pagination_class = ShowcasePagination
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return StudentProjectDetailSerializer
        return StudentProjectListSerializer

    def get_queryset(self):
        return get_published_projects(
            course_slug=self.request.query_params.get("course"),
        )

    def retrieve(self, request, slug=None):
        project = get_project_detail(slug=slug)
        if not project:
            return Response(
                {"status": "error", "error": {"code": "NOT_FOUND", "message": "Project not found."}},
                status=404,
            )
        serializer = StudentProjectDetailSerializer(project)
        return Response({"status": "success", "data": serializer.data})

    @action(detail=False, methods=["get"])
    def featured(self, request):
        projects = get_featured_projects()
        serializer = StudentProjectListSerializer(projects, many=True)
        return Response({"status": "success", "data": serializer.data})
