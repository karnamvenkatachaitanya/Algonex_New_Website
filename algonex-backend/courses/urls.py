from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, EnrollmentViewSet, CourseFAQViewSet, StudentOutcomeViewSet, CertificateViewSet

router = DefaultRouter()
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"enrollments", EnrollmentViewSet, basename="enrollment")
router.register(r"outcomes", StudentOutcomeViewSet, basename="outcome")
router.register(r"certificates", CertificateViewSet, basename="certificate")

urlpatterns = [
    path("", include(router.urls)),
    # Nested: /api/v1/courses/:slug/faqs/
    path(
        "courses/<slug:course_slug>/faqs/",
        CourseFAQViewSet.as_view({"get": "list", "post": "create"}),
        name="course-faqs",
    ),
    path(
        "courses/<slug:course_slug>/faqs/<int:pk>/",
        CourseFAQViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="course-faq-detail",
    ),
]
