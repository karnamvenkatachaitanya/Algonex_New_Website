from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from common.views import ActiveBannerView, SearchView, AdminStatsView

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/", include("courses.urls")),
    path("api/v1/", include("events.urls")),
    path("api/v1/", include("careers.urls")),
    path("api/v1/", include("portfolio.urls")),
    path("api/v1/", include("showcase.urls")),
    path("api/v1/programs/", include("programs.urls")),
    path("api/v1/contact/", include("contactform.urls")),
    path("api/v1/register/", include("signin.urls")),
    path("api/v1/banner/", ActiveBannerView.as_view(), name="active-banner"),
    path("api/v1/search/", SearchView.as_view(), name="global-search"),
    path("api/v1/admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
