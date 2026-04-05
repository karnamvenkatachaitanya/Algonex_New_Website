from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import GoogleLoginView, GitHubLoginView, CheckEmailView, SendSetupEmailView, SetPasswordView

urlpatterns = [
    # dj-rest-auth endpoints (login, logout, user, password)
    path("", include("dj_rest_auth.urls")),
    # Registration
    path("register/", include("dj_rest_auth.registration.urls")),
    # Token refresh
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Social auth — accept authorization code from frontend, return JWT
    path("google/", GoogleLoginView.as_view(), name="google_login"),
    path("github/", GitHubLoginView.as_view(), name="github_login"),
    # Password setup flow
    path("check-email/", CheckEmailView.as_view(), name="check_email"),
    path("send-setup-email/", SendSetupEmailView.as_view(), name="send_setup_email"),
    path("set-password/", SetPasswordView.as_view(), name="set_password"),
]
