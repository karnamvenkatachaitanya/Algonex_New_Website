from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from courses.models import Course, Enrollment
from events.models import Event
from careers.models import Job
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class TestSearchAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        instructor = User.objects.create_user(
            email="inst@test.com", password="pass123", role="instructor"
        )
        Course.objects.create(
            instructor=instructor, name="Python Basics", slug="python-basics",
            description="Learn Python", duration="5 days", price="500.00", is_published=True,
        )
        Event.objects.create(
            title="Python Workshop", slug="python-workshop",
            description="Workshop", event_type="workshop", location="Online",
            start_date=timezone.now() + timedelta(days=7),
            end_date=timezone.now() + timedelta(days=7, hours=4),
            capacity=50, is_published=True,
        )
        Job.objects.create(
            title="Python Developer", slug="python-dev",
            department="engineering", job_type="full_time",
            location="Remote", description="Build stuff", requirements="Python",
            is_active=True,
        )

    def test_search_returns_results(self):
        response = self.client.get("/api/v1/search/?q=python")
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(len(data["courses"]), 1)
        self.assertEqual(len(data["events"]), 1)
        self.assertEqual(len(data["jobs"]), 1)

    def test_search_empty_query(self):
        response = self.client.get("/api/v1/search/?q=")
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(len(data["courses"]), 0)

    def test_search_no_results(self):
        response = self.client.get("/api/v1/search/?q=nonexistent123")
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(len(data["courses"]), 0)


class TestAdminStatsAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.com", password="pass123", role="admin"
        )
        self.student = User.objects.create_user(
            email="student@test.com", password="pass123", role="student"
        )

    def login_as(self, user):
        response = self.client.post("/api/v1/auth/login/", {
            "email": user.email, "password": "pass123",
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_admin_can_get_stats(self):
        self.login_as(self.admin)
        response = self.client.get("/api/v1/admin/stats/")
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertIn("users", data)
        self.assertIn("courses", data)
        self.assertIn("events", data)
        self.assertIn("careers", data)
        self.assertEqual(data["users"]["total"], 2)

    def test_non_admin_cannot_get_stats(self):
        self.login_as(self.student)
        response = self.client.get("/api/v1/admin/stats/")
        self.assertEqual(response.status_code, 403)


class TestSendEnrollmentEmail(TestCase):
    def setUp(self):
        from django.test import Client
        self.client = Client()
        self.staff_user = User.objects.create_user(
            email="staff@test.com", password="pass123", is_staff=True
        )
        self.normal_user = User.objects.create_user(
            email="user@test.com", password="pass123", is_staff=False
        )

    def test_requires_staff_user(self):
        # Unauthenticated request
        response = self.client.post("/admin/send-enrollment-email/", {
            "to": ["test@example.com"], "subject": "Test", "body": "Hello", "mode": "individual"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 302) # Redirect to login

        # Authenticated as non-staff
        self.client.login(email="user@test.com", password="pass123")
        response = self.client.post("/admin/send-enrollment-email/", {
            "to": ["test@example.com"], "subject": "Test", "body": "Hello", "mode": "individual"
        }, content_type="application/json")
        self.assertEqual(response.status_code, 302) # Redirect to login

    def test_send_email_success_individual(self):
        from django.core import mail
        self.client.login(email="staff@test.com", password="pass123")
        response = self.client.post("/admin/send-enrollment-email/", {
            "to": ["test1@example.com", "test2@example.com"],
            "subject": "Test Subj",
            "body": "Test Body",
            "mode": "individual"
        }, content_type="application/json")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["sent"], 2)
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[0].subject, "Test Subj")
        self.assertEqual(mail.outbox[0].to, ["test1@example.com"])
        self.assertEqual(mail.outbox[1].to, ["test2@example.com"])

    def test_send_email_success_bcc(self):
        from django.core import mail
        self.client.login(email="staff@test.com", password="pass123")
        response = self.client.post("/admin/send-enrollment-email/", {
            "to": ["test1@example.com", "test2@example.com"],
            "subject": "Test Subj BCC",
            "body": "Test Body HTML",
            "mode": "bcc"
        }, content_type="application/json")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["sent"], 2)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Test Subj BCC")
        self.assertEqual(mail.outbox[0].bcc, ["test1@example.com", "test2@example.com"])

    def test_missing_fields_fails(self):
        self.client.login(email="staff@test.com", password="pass123")
        response = self.client.post("/admin/send-enrollment-email/", {
            "to": [],
            "subject": "Test",
            "body": ""
        }, content_type="application/json")
        self.assertEqual(response.status_code, 400)

