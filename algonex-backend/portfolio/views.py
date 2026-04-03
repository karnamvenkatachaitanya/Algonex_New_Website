from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin

from .serializers import CaseStudyListSerializer, CaseStudyDetailSerializer
from .selectors import get_published_case_studies, get_case_study_detail


class CaseStudyViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    """Read-only public API for case studies. CRUD via Django Admin."""

    lookup_field = "slug"
    permission_classes = [AllowAny]

    def get_queryset(self):
        return get_published_case_studies(filters=self.request.query_params.dict())

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CaseStudyDetailSerializer
        return CaseStudyListSerializer

    def retrieve(self, request, *args, **kwargs):
        case_study = get_case_study_detail(slug=kwargs["slug"])
        if not case_study:
            return Response(
                {"status": "error", "error": {"code": "NOT_FOUND", "message": "Case study not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(case_study)
        return Response({"status": "success", "data": serializer.data})

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({"status": "success", "data": serializer.data})
