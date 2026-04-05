from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from programs.models import Program

User = get_user_model()


class TestRegisterStep1View(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_creates_new_user(self):
        response = self.client.post("/api/v1/register/step1/", {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "phone": "9876543210",
        })
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data["data"]["is_new"])

    def test_existing_user_with_password(self):
        User.objects.create_user(email="john@example.com", password="pass123", first_name="John", last_name="Doe")
        response = self.client.post("/api/v1/register/step1/", {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "phone": "9876543210",
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertFalse(data["is_new"])
        self.assertTrue(data["has_password"])
        self.assertIn("message", data)

    def test_invalid_email_rejected(self):
        response = self.client.post("/api/v1/register/step1/", {
            "first_name": "John",
            "last_name": "Doe",
            "email": "not-an-email",
            "phone": "9876543210",
        })
        self.assertEqual(response.status_code, 400)


class TestRegisterStep2View(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="john@example.com", password=None,
            first_name="John", last_name="Doe",
        )

    def test_creates_profile(self):
        response = self.client.post("/api/v1/register/step2/", {
            "email": "john@example.com",
            "city": "Hyderabad",
            "state": "Telangana",
            "country": "India",
            "college": "JNTU",
            "branch": "CSE",
            "degree_level": "bachelors",
            "graduation_year": 2025,
            "employment_status": "student",
            "interest_category": "fellowship",
            "terms_agreed": True,
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["data"]["registered"])

    def test_nonexistent_email_returns_404(self):
        response = self.client.post("/api/v1/register/step2/", {
            "email": "nobody@example.com",
            "city": "City", "state": "State",
            "college": "College", "branch": "Branch",
            "degree_level": "bachelors", "graduation_year": 2025,
            "employment_status": "student", "interest_category": "course",
            "terms_agreed": True,
        })
        self.assertEqual(response.status_code, 404)

    def test_terms_not_agreed_returns_400(self):
        response = self.client.post("/api/v1/register/step2/", {
            "email": "john@example.com",
            "city": "City", "state": "State",
            "college": "College", "branch": "Branch",
            "degree_level": "bachelors", "graduation_year": 2025,
            "employment_status": "student", "interest_category": "course",
            "terms_agreed": False,
        })
        self.assertEqual(response.status_code, 400)

    def test_with_program_slug(self):
        program = Program.objects.create(
            title="AI Fellowship", description="Test",
            program_type="fellowship", duration="3 months",
            location="Online", eligibility_criteria="Open",
            application_deadline=date.today() + timedelta(days=30),
            start_date=date.today() + timedelta(days=60),
            end_date=date.today() + timedelta(days=150),
            capacity=20, is_published=True,
        )
        response = self.client.post("/api/v1/register/step2/", {
            "email": "john@example.com",
            "city": "Hyderabad", "state": "Telangana",
            "college": "JNTU", "branch": "CSE",
            "degree_level": "bachelors", "graduation_year": 2025,
            "employment_status": "student", "interest_category": "fellowship",
            "program_slug": program.slug,
            "terms_agreed": True,
        })
        self.assertEqual(response.status_code, 200)
