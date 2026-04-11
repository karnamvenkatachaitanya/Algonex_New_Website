from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from contactform.models import ContactForm


class TestContactFormAPI(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_submit_valid_form(self):
        response = self.client.post("/api/v1/contact/submit-form/", {
            "full_name": "Test User",
            "email": "test@example.com",
            "message": "Hello, I have a question.",
        })
        assert response.status_code == 201
        assert response.data["status"] == "success"
        assert ContactForm.objects.count() == 1

    def test_submit_with_optional_fields(self):
        response = self.client.post("/api/v1/contact/submit-form/", {
            "full_name": "Test User",
            "email": "test@example.com",
            "phone": "9876543210",
            "subject": "Course inquiry",
            "message": "Tell me about Python Full Stack.",
        })
        assert response.status_code == 201
        form = ContactForm.objects.first()
        assert form.phone == "9876543210"
        assert form.subject == "Course inquiry"

    def test_submit_missing_required_fields(self):
        response = self.client.post("/api/v1/contact/submit-form/", {
            "full_name": "Test User",
        })
        assert response.status_code == 400
        assert response.data["status"] == "error"

    def test_submit_invalid_email(self):
        response = self.client.post("/api/v1/contact/submit-form/", {
            "full_name": "Test User",
            "email": "not-an-email",
            "message": "Hello",
        })
        assert response.status_code == 400

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        ADMINS=[("Admin", "admin@example.com")],
    )
    def test_admin_notification_sent(self):
        from django.core import mail
        self.client.post("/api/v1/contact/submit-form/", {
            "full_name": "Notified User",
            "email": "notify@example.com",
            "message": "Please respond.",
        })
        assert len(mail.outbox) == 1
        assert "Notified User" in mail.outbox[0].body
