from django.conf import settings
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client


def _get_callback_url():
    """Get OAuth callback URL from settings, with localhost fallback for dev."""
    return getattr(settings, "OAUTH_CALLBACK_URL", "http://localhost:5173")


class GoogleLoginView(SocialLoginView):
    """
    Accepts Google OAuth2 authorization code from the React frontend,
    exchanges it for user info, creates/links a User, and returns JWT tokens.

    POST /api/v1/auth/google/
    Body: {"code": "<authorization_code>"}
    """
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client

    @property
    def callback_url(self):
        return _get_callback_url()


class GitHubLoginView(SocialLoginView):
    """
    Accepts GitHub OAuth2 authorization code from the React frontend.

    POST /api/v1/auth/github/
    Body: {"code": "<authorization_code>"}
    """
    adapter_class = GitHubOAuth2Adapter
    client_class = OAuth2Client

    @property
    def callback_url(self):
        return _get_callback_url()
