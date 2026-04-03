from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseStudyViewSet

router = DefaultRouter()
router.register(r"portfolio", CaseStudyViewSet, basename="casestudy")

urlpatterns = [
    path("", include(router.urls)),
]
