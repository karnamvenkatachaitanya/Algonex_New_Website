from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Program
from .serializers import (
    ProgramListSerializer,
    ProgramDetailSerializer,
    ProgramCreateUpdateSerializer,
)
from .filters import ProgramFilter
from .selectors import get_published_programs, get_program_detail
from .services import create_program, update_program
from common.permissions import IsAdmin


class ProgramViewSet(ModelViewSet):
    """
    Public: list/retrieve published programs.
    Admin: create/update/delete.
    """

    lookup_field = "slug"
    filterset_class = ProgramFilter
    search_fields = ["title", "description"]

    def get_queryset(self):
        if self.action in ("list", "retrieve"):
            return get_published_programs()
        return Program.objects.all()

    def get_serializer_class(self):
        if self.action == "list":
            return ProgramListSerializer
        if self.action == "retrieve":
            return ProgramDetailSerializer
        return ProgramCreateUpdateSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticatedOrReadOnly()]
        return [IsAdmin()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({"status": "success", "data": serializer.data})

    def retrieve(self, request, *args, **kwargs):
        program = get_program_detail(slug=kwargs["slug"])
        if not program:
            return Response(
                {"status": "error", "error": {"code": "NOT_FOUND", "message": "Program not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(program)
        return Response({"status": "success", "data": serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        program = create_program(**serializer.validated_data)
        return Response(
            {"status": "success", "data": ProgramDetailSerializer(program).data},
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        program = self.get_object()
        serializer = self.get_serializer(data=request.data, partial=kwargs.get("partial", False))
        serializer.is_valid(raise_exception=True)
        program = update_program(program=program, **serializer.validated_data)
        return Response({"status": "success", "data": ProgramDetailSerializer(program).data})

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        program = self.get_object()
        program.delete()
        return Response(
            {"status": "success", "data": {"message": "Program deleted."}},
            status=status.HTTP_200_OK,
        )
