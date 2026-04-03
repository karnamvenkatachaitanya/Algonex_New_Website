from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, UserRegistrationViewSet

router = DefaultRouter()
router.register(r"events", EventViewSet, basename="event")
router.register(r"event-registrations", UserRegistrationViewSet, basename="event-registration")

urlpatterns = [
    path("", include(router.urls)),
]
