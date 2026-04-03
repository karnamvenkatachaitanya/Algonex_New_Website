from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin

from django.shortcuts import get_object_or_404

from .models import Course, Module, Topic, Enrollment
from .serializers import (
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCreateUpdateSerializer,
    ModuleSerializer,
    ModuleCreateSerializer,
    TopicCreateSerializer,
    EnrollmentSerializer,
)
from .permissions import IsInstructorOwner
from .filters import CourseFilter
from .services import create_course, update_course, enroll_student, drop_enrollment
from .selectors import get_published_courses, get_course_detail, get_student_enrollments
from common.permissions import IsAdmin


class CourseViewSet(ModelViewSet):
    """
    Public: list/retrieve published courses.
    Instructor: create/update own courses.
    Admin: delete any course.
    """

    lookup_field = "slug"
    filterset_class = CourseFilter

    def get_queryset(self):
        if self.action in ("list", "retrieve"):
            return get_published_courses(filters=self.request.query_params.dict())
        # For instructor/admin actions, show their own courses
        if self.request.user.is_authenticated and self.request.user.role == "admin":
            return Course.objects.all()
        if self.request.user.is_authenticated and self.request.user.role == "instructor":
            return Course.objects.filter(instructor=self.request.user)
        return Course.objects.none()

    def get_serializer_class(self):
        if self.action == "list":
            return CourseListSerializer
        if self.action == "retrieve":
            return CourseDetailSerializer
        return CourseCreateUpdateSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticatedOrReadOnly()]
        if self.action == "enroll":
            return [IsAuthenticated()]
        if self.action == "create":
            return [IsInstructorOwner()]
        if self.action == "destroy":
            return [IsAdmin()]
        # update/partial_update
        return [IsInstructorOwner()]

    def perform_create(self, serializer):
        skills = serializer.validated_data.pop("skills", [])
        course = create_course(instructor=self.request.user, **serializer.validated_data)
        if skills:
            course.skills.set(skills)
        return course

    def perform_update(self, serializer):
        skills = serializer.validated_data.pop("skills", None)
        course = update_course(course=self.get_object(), **serializer.validated_data)
        if skills is not None:
            course.skills.set(skills)
        return course

    def retrieve(self, request, *args, **kwargs):
        course = get_course_detail(slug=kwargs["slug"])
        if not course:
            return Response(
                {"status": "error", "error": {"code": "NOT_FOUND", "message": "Course not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(course, context={"request": request})
        return Response({"status": "success", "data": serializer.data})

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({"status": "success", "data": serializer.data})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def enroll(self, request, slug=None):
        """POST /api/v1/courses/:slug/enroll/"""
        course = get_object_or_404(Course, slug=slug)
        enrollment = enroll_student(student=request.user, course=course)
        serializer = EnrollmentSerializer(enrollment)
        return Response(
            {"status": "success", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )


class ModuleViewSet(ModelViewSet):
    """CRUD for modules within a course. Instructor-only."""

    serializer_class = ModuleCreateSerializer
    permission_classes = [IsInstructorOwner]

    def get_queryset(self):
        return Module.objects.filter(course__slug=self.kwargs["course_slug"])

    def perform_create(self, serializer):
        course = get_object_or_404(Course, slug=self.kwargs["course_slug"])
        self.check_object_permissions(self.request, course)
        serializer.save(course=course)

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return ModuleSerializer
        return ModuleCreateSerializer


class TopicViewSet(ModelViewSet):
    """CRUD for topics within a module. Instructor-only."""

    serializer_class = TopicCreateSerializer
    permission_classes = [IsInstructorOwner]

    def get_queryset(self):
        return Topic.objects.filter(module_id=self.kwargs["module_pk"])

    def perform_create(self, serializer):
        module = get_object_or_404(Module, pk=self.kwargs["module_pk"])
        self.check_object_permissions(self.request, module)
        serializer.save(module=module)


class EnrollmentViewSet(ListModelMixin, GenericViewSet):
    """List current user's enrollments. Drop an enrollment."""

    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return get_student_enrollments(student=self.request.user)

    @action(detail=True, methods=["post"])
    def drop(self, request, pk=None):
        """POST /api/v1/enrollments/:id/drop/"""
        enrollment = get_object_or_404(
            Enrollment, pk=pk, student=request.user, status="active"
        )
        drop_enrollment(enrollment=enrollment)
        return Response(
            {"status": "success", "data": {"message": "Enrollment dropped."}},
            status=status.HTTP_200_OK,
        )
