from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from programs.models import Program

User = get_user_model()


def _create_program(**kwargs):
    defaults = {
        "title": "Test Program",
        "description": "Desc",
        "program_type": "fellowship",
        "duration": "3 months",
        "location": "Hyderabad",
        "eligibility_criteria": "Open",
        "application_deadline": date.today() + timedelta(days=30),
        "start_date": date.today() + timedelta(days=60),
        "end_date": date.today() + timedelta(days=150),
        "capacity": 20,
        "is_published": True,
    }
    defaults.update(kwargs)
    return Program.objects.create(**defaults)


class TestProgramListView(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_list_returns_published_only(self):
        _create_program(title="Published")
        _create_program(title="Draft", is_published=False)
        response = self.client.get("/api/v1/programs/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        results = data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Published")

    def test_filter_by_type(self):
        _create_program(title="Fellowship", program_type="fellowship")
        _create_program(title="Internship", program_type="internship")
        response = self.client.get("/api/v1/programs/?program_type=internship")
        results = response.json()["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Internship")


class TestProgramDetailView(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_retrieve_published(self):
        program = _create_program(title="Detail Test")
        response = self.client.get(f"/api/v1/programs/{program.slug}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["title"], "Detail Test")

    def test_retrieve_unpublished_returns_404(self):
        program = _create_program(title="Draft", is_published=False)
        response = self.client.get(f"/api/v1/programs/{program.slug}/")
        self.assertEqual(response.status_code, 404)


class TestProgramAdminViews(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.com", password="pass123", role="admin"
        )
        self.student = User.objects.create_user(
            email="student@test.com", password="pass123", role="student"
        )
        self.client = APIClient()

    def test_create_requires_admin(self):
        self.client.force_authenticate(self.student)
        response = self.client.post("/api/v1/programs/", {
            "title": "New Program",
            "description": "Test",
            "program_type": "fellowship",
            "duration": "3 months",
            "location": "Online",
            "eligibility_criteria": "Open",
            "application_deadline": str(date.today() + timedelta(days=30)),
            "start_date": str(date.today() + timedelta(days=60)),
            "end_date": str(date.today() + timedelta(days=150)),
            "capacity": 10,
        })
        self.assertEqual(response.status_code, 403)

    def test_create_as_admin(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/v1/programs/", {
            "title": "Admin Program",
            "description": "Test",
            "program_type": "internship",
            "duration": "6 weeks",
            "location": "Remote",
            "eligibility_criteria": "B.Tech",
            "application_deadline": str(date.today() + timedelta(days=30)),
            "start_date": str(date.today() + timedelta(days=60)),
            "end_date": str(date.today() + timedelta(days=100)),
            "capacity": 15,
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"]["title"], "Admin Program")

    def test_delete_as_admin(self):
        self.client.force_authenticate(self.admin)
        program = _create_program()
        response = self.client.delete(f"/api/v1/programs/{program.slug}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Program.objects.count(), 0)
