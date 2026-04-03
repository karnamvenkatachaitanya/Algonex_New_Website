from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class TestRegistrationAPI(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_user(self):
        response = self.client.post("/api/v1/auth/register/", {
            "email": "new@test.com",
            "password1": "securepass123!",
            "password2": "securepass123!",
            "first_name": "New",
            "last_name": "User",
        })
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(email="new@test.com").exists())
        user = User.objects.get(email="new@test.com")
        self.assertEqual(user.first_name, "New")
        self.assertEqual(user.role, "student")

    def test_register_duplicate_email_fails(self):
        # First register a user via the API
        self.client.post("/api/v1/auth/register/", {
            "email": "dup@test.com",
            "password1": "securepass123!",
            "password2": "securepass123!",
            "first_name": "First",
            "last_name": "User",
        })
        # Try registering with the same email
        response = self.client.post("/api/v1/auth/register/", {
            "email": "dup@test.com",
            "password1": "securepass123!",
            "password2": "securepass123!",
            "first_name": "Dup",
            "last_name": "User",
        })
        self.assertIn(response.status_code, [400, 409])


class TestLoginAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="login@test.com",
            password="testpass123",
            first_name="Login",
            last_name="User",
        )

    def test_login_returns_tokens(self):
        response = self.client.post("/api/v1/auth/login/", {
            "email": "login@test.com",
            "password": "testpass123",
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_password(self):
        response = self.client.post("/api/v1/auth/login/", {
            "email": "login@test.com",
            "password": "wrongpass",
        })
        self.assertIn(response.status_code, [400, 401])


class TestUserProfileAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="profile@test.com",
            password="testpass123",
            first_name="Profile",
            last_name="User",
        )
        response = self.client.post("/api/v1/auth/login/", {
            "email": "profile@test.com",
            "password": "testpass123",
        })
        self.token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_get_user_profile(self):
        response = self.client.get("/api/v1/auth/user/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], "profile@test.com")
        self.assertEqual(response.data["role"], "student")

    def test_update_user_profile(self):
        response = self.client.patch(
            "/api/v1/auth/user/",
            {"bio": "Updated bio", "phone": "9876543210"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.bio, "Updated bio")

    def test_unauthenticated_access_denied(self):
        client = APIClient()
        response = client.get("/api/v1/auth/user/")
        self.assertIn(response.status_code, [401, 403])


class TestTokenRefreshAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="refresh@test.com",
            password="testpass123",
        )
        response = self.client.post("/api/v1/auth/login/", {
            "email": "refresh@test.com",
            "password": "testpass123",
        })
        self.refresh_token = response.data["refresh"]

    def test_refresh_token(self):
        response = self.client.post("/api/v1/auth/token/refresh/", {
            "refresh": self.refresh_token,
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
