from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet, UserApplicationViewSet, ApplicationAdminViewSet

router = DefaultRouter()
router.register(r"careers", JobViewSet, basename="job")
router.register(r"applications", UserApplicationViewSet, basename="application")
router.register(r"admin-applications", ApplicationAdminViewSet, basename="admin-application")

urlpatterns = [
    path("", include(router.urls)),
]
