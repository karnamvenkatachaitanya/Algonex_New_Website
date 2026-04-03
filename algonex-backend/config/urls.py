from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/", include("courses.urls")),
    path("api/v1/", include("events.urls")),
    path("api/v1/", include("careers.urls")),
    path("api/v1/contact/", include("contactform.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
