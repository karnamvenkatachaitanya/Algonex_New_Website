from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from careers.models import Job, Application

User = get_user_model()


def _create_job(**kwargs):
    defaults = {
        "title": "Backend Developer",
        "slug": "backend-developer",
        "department": "engineering",
        "job_type": "full_time",
        "location": "Hyderabad",
        "description": "Build backend systems",
        "requirements": "Python, Django",
        "is_active": True,
    }
    defaults.update(kwargs)
    return Job.objects.create(**defaults)


class CareerAPITestMixin:
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="user@test.com", password="pass123",
            first_name="Test", last_name="User", role="student",
        )
        self.admin = User.objects.create_user(
            email="admin@test.com", password="pass123",
            first_name="Admin", last_name="User", role="admin",
        )
        self.job = _create_job()

    def login_as(self, user):
        response = self.client.post("/api/v1/auth/login/", {
            "email": user.email, "password": "pass123",
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")


class TestJobListAPI(CareerAPITestMixin, TestCase):
    def test_list_active_jobs(self):
        response = self.client.get("/api/v1/careers/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["data"]["results"]), 1)

    def test_inactive_jobs_hidden(self):
        _create_job(title="Closed", slug="closed", is_active=False)
        response = self.client.get("/api/v1/careers/")
        self.assertEqual(len(response.data["data"]["results"]), 1)

    def test_filter_by_department(self):
        response = self.client.get("/api/v1/careers/?department=engineering")
        self.assertEqual(response.status_code, 200)


class TestJobDetailAPI(CareerAPITestMixin, TestCase):
    def test_get_job_detail(self):
        response = self.client.get("/api/v1/careers/backend-developer/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["title"], "Backend Developer")
        self.assertIn("requirements", response.data["data"])


class TestApplicationAPI(CareerAPITestMixin, TestCase):
    def test_apply_to_job(self):
        self.login_as(self.user)
        resume = SimpleUploadedFile("resume.pdf", b"fake pdf", content_type="application/pdf")
        response = self.client.post(
            "/api/v1/careers/backend-developer/apply/",
            {"resume": resume, "cover_letter": "I'm interested"},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["data"]["status"], "applied")

    def test_duplicate_application_fails(self):
        self.login_as(self.user)
        resume1 = SimpleUploadedFile("r1.pdf", b"fake", content_type="application/pdf")
        self.client.post("/api/v1/careers/backend-developer/apply/", {"resume": resume1}, format="multipart")

        resume2 = SimpleUploadedFile("r2.pdf", b"fake", content_type="application/pdf")
        response = self.client.post("/api/v1/careers/backend-developer/apply/", {"resume": resume2}, format="multipart")
        self.assertEqual(response.status_code, 409)

    def test_list_my_applications(self):
        self.login_as(self.user)
        resume = SimpleUploadedFile("r.pdf", b"fake", content_type="application/pdf")
        self.client.post("/api/v1/careers/backend-developer/apply/", {"resume": resume}, format="multipart")

        response = self.client.get("/api/v1/applications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["data"]["results"]), 1)
        # admin_notes should NOT be in the response
        self.assertNotIn("admin_notes", response.data["data"]["results"][0])

    def test_unauthenticated_cannot_apply(self):
        resume = SimpleUploadedFile("r.pdf", b"fake", content_type="application/pdf")
        response = self.client.post("/api/v1/careers/backend-developer/apply/", {"resume": resume}, format="multipart")
        self.assertIn(response.status_code, [401, 403])


class TestApplicationAdminAPI(CareerAPITestMixin, TestCase):
    def test_admin_can_view_applications(self):
        # Create an application first
        Application.objects.create(
            job=self.job, applicant=self.user,
            resume=SimpleUploadedFile("r.pdf", b"fake", content_type="application/pdf"),
            status="applied",
        )
        self.login_as(self.admin)
        response = self.client.get("/api/v1/careers/backend-developer/applications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["data"]), 1)
        # admin_notes should be in admin view
        self.assertIn("admin_notes", response.data["data"][0])

    def test_admin_can_transition_status(self):
        app = Application.objects.create(
            job=self.job, applicant=self.user,
            resume=SimpleUploadedFile("r.pdf", b"fake", content_type="application/pdf"),
            status="applied",
        )
        self.login_as(self.admin)
        response = self.client.patch(
            f"/api/v1/admin-applications/{app.id}/transition/",
            {"status": "reviewed", "admin_notes": "Good candidate"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["status"], "reviewed")

    def test_non_admin_cannot_transition(self):
        app = Application.objects.create(
            job=self.job, applicant=self.user,
            resume=SimpleUploadedFile("r.pdf", b"fake", content_type="application/pdf"),
            status="applied",
        )
        self.login_as(self.user)
        response = self.client.patch(
            f"/api/v1/admin-applications/{app.id}/transition/",
            {"status": "reviewed"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)


class TestExternalJobListing(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.external_job = Job.objects.create(
            title="Frontend Dev at TCS",
            department="engineering",
            job_type="full_time",
            location="Mumbai",
            description="Build UIs",
            requirements="React, JS",
            is_active=True,
            apply_mode="external",
            external_link="https://careers.tcs.com/frontend",
            company_name="TCS",
            tags_text="React, JavaScript, Frontend",
        )
        self.internal_job = Job.objects.create(
            title="Internal Dev",
            department="engineering",
            job_type="full_time",
            location="Hyderabad",
            description="Build things",
            requirements="Python",
            is_active=True,
            apply_mode="internal",
        )

    def test_list_all_jobs(self):
        response = self.client.get("/api/v1/careers/")
        results = response.json()["data"]["results"]
        self.assertEqual(len(results), 2)

    def test_filter_external_only(self):
        response = self.client.get("/api/v1/careers/?apply_mode=external")
        results = response.json()["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["apply_mode"], "external")
        self.assertEqual(results[0]["company_name"], "TCS")

    def test_filter_internal_only(self):
        response = self.client.get("/api/v1/careers/?apply_mode=internal")
        results = response.json()["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["apply_mode"], "internal")

    def test_external_detail_has_link(self):
        response = self.client.get(f"/api/v1/careers/{self.external_job.slug}/")
        data = response.json()["data"]
        self.assertEqual(data["external_link"], "https://careers.tcs.com/frontend")
        self.assertEqual(data["company_name"], "TCS")
        self.assertEqual(data["tags_text"], "React, JavaScript, Frontend")

    def test_apply_to_external_rejected(self):
        user = User.objects.create_user(email="student@test.com", password="pass123")
        self.client.force_authenticate(user)
        resume = SimpleUploadedFile("resume.pdf", b"fake pdf", content_type="application/pdf")
        response = self.client.post(
            f"/api/v1/careers/{self.external_job.slug}/apply/",
            {"resume": resume},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "EXTERNAL_JOB")


class TestExternalJobAdmin(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.com", password="pass123", role="admin"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_create_external_job(self):
        response = self.client.post("/api/v1/careers/", {
            "title": "Data Analyst at Infosys",
            "department": "engineering",
            "job_type": "internship",
            "location": "Bangalore",
            "description": "Analyze data",
            "requirements": "SQL, Python",
            "apply_mode": "external",
            "external_link": "https://careers.infosys.com/data",
            "company_name": "Infosys",
            "tags_text": "SQL, Python, Data",
        })
        self.assertEqual(response.status_code, 201)

    def test_create_external_missing_link_rejected(self):
        response = self.client.post("/api/v1/careers/", {
            "title": "Missing Link Job",
            "department": "engineering",
            "job_type": "full_time",
            "location": "Remote",
            "description": "Test",
            "requirements": "Test",
            "apply_mode": "external",
            "company_name": "SomeCompany",
        })
        self.assertEqual(response.status_code, 400)

    def test_create_external_missing_company_rejected(self):
        response = self.client.post("/api/v1/careers/", {
            "title": "Missing Company Job",
            "department": "engineering",
            "job_type": "full_time",
            "location": "Remote",
            "description": "Test",
            "requirements": "Test",
            "apply_mode": "external",
            "external_link": "https://example.com",
        })
        self.assertEqual(response.status_code, 400)
