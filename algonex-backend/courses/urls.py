from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, ModuleViewSet, TopicViewSet, EnrollmentViewSet

router = DefaultRouter()
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"enrollments", EnrollmentViewSet, basename="enrollment")

urlpatterns = [
    path("", include(router.urls)),
    # Nested: /api/v1/courses/:slug/modules/
    path(
        "courses/<slug:course_slug>/modules/",
        ModuleViewSet.as_view({"get": "list", "post": "create"}),
        name="course-modules",
    ),
    path(
        "courses/<slug:course_slug>/modules/<int:pk>/",
        ModuleViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="course-module-detail",
    ),
    # Nested: /api/v1/modules/:id/topics/
    path(
        "modules/<int:module_pk>/topics/",
        TopicViewSet.as_view({"get": "list", "post": "create"}),
        name="module-topics",
    ),
    path(
        "modules/<int:module_pk>/topics/<int:pk>/",
        TopicViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="module-topic-detail",
    ),
]
