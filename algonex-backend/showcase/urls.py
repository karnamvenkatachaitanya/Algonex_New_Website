from rest_framework.routers import DefaultRouter
from .views import AlumniViewSet, StudentProjectViewSet

router = DefaultRouter()
router.register(r"alumni", AlumniViewSet, basename="alumni")
router.register(r"projects", StudentProjectViewSet, basename="project")

urlpatterns = router.urls
