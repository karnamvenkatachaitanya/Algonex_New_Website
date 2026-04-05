from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core import mail
from rest_framework.test import APIClient

User = get_user_model()


class TestCheckEmailView(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_existing_user_with_password(self):
        User.objects.create_user(email="john@example.com", password="pass123")
        response = self.client.post("/api/v1/auth/check-email/", {"email": "john@example.com"})
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertTrue(data["exists"])
        self.assertTrue(data["has_password"])

    def test_existing_user_without_password(self):
        User.objects.create_user(email="john@example.com", password=None)
        response = self.client.post("/api/v1/auth/check-email/", {"email": "john@example.com"})
        data = response.json()["data"]
        self.assertTrue(data["exists"])
        self.assertFalse(data["has_password"])

    def test_nonexistent_user(self):
        response = self.client.post("/api/v1/auth/check-email/", {"email": "nobody@example.com"})
        data = response.json()["data"]
        self.assertFalse(data["exists"])

    def test_invalid_email(self):
        response = self.client.post("/api/v1/auth/check-email/", {"email": "not-email"})
        self.assertEqual(response.status_code, 400)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class TestSendSetupEmailView(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_sends_email_for_passwordless_user(self):
        User.objects.create_user(email="john@example.com", password=None, first_name="John")
        response = self.client.post("/api/v1/auth/send-setup-email/", {"email": "john@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("set-password", mail.outbox[0].body)

    def test_rejects_user_with_password(self):
        User.objects.create_user(email="john@example.com", password="pass123")
        response = self.client.post("/api/v1/auth/send-setup-email/", {"email": "john@example.com"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "PASSWORD_ALREADY_SET")

    def test_rejects_nonexistent_user(self):
        response = self.client.post("/api/v1/auth/send-setup-email/", {"email": "nobody@example.com"})
        self.assertEqual(response.status_code, 404)


class TestSetPasswordView(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="john@example.com", password=None)
        self.token = default_token_generator.make_token(self.user)
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))

    def test_sets_password_with_valid_token(self):
        response = self.client.post("/api/v1/auth/set-password/", {
            "uid": self.uid,
            "token": self.token,
            "password": "newpass123",
            "confirm_password": "newpass123",
        })
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpass123"))

    def test_rejects_invalid_token(self):
        response = self.client.post("/api/v1/auth/set-password/", {
            "uid": self.uid,
            "token": "invalid-token",
            "password": "newpass123",
            "confirm_password": "newpass123",
        })
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "INVALID_TOKEN")

    def test_rejects_password_mismatch(self):
        response = self.client.post("/api/v1/auth/set-password/", {
            "uid": self.uid,
            "token": self.token,
            "password": "newpass123",
            "confirm_password": "different",
        })
        self.assertEqual(response.status_code, 400)

    def test_token_invalidated_after_use(self):
        self.client.post("/api/v1/auth/set-password/", {
            "uid": self.uid,
            "token": self.token,
            "password": "newpass123",
            "confirm_password": "newpass123",
        })
        response = self.client.post("/api/v1/auth/set-password/", {
            "uid": self.uid,
            "token": self.token,
            "password": "anotherpass",
            "confirm_password": "anotherpass",
        })
        self.assertEqual(response.status_code, 400)
