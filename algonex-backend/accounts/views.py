from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client


class GoogleLoginView(SocialLoginView):
    """
    Accepts Google OAuth2 authorization code from the React frontend,
    exchanges it for user info, creates/links a User, and returns JWT tokens.

    POST /api/v1/auth/google/
    Body: {"code": "<authorization_code>"}
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:5173"
    client_class = OAuth2Client


class GitHubLoginView(SocialLoginView):
    """
    Accepts GitHub OAuth2 authorization code from the React frontend.

    POST /api/v1/auth/github/
    Body: {"code": "<authorization_code>"}
    """
    adapter_class = GitHubOAuth2Adapter
    callback_url = "http://localhost:5173"
    client_class = OAuth2Client
