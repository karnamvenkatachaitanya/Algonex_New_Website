from datetime import date, timedelta
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from courses.models import Course, StudentOutcome


class TestStudentOutcomeModel(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            email="instructor@test.com", password="testpass123", role="instructor"
        )
        self.course = Course.objects.create(
            instructor=self.instructor,
            name="Python Full Stack",
            description="Learn Python",
            duration="12 weeks",
            price=24999,
            is_published=True,
        )

    def test_create_outcome(self):
        outcome = StudentOutcome.objects.create(
            student_name="Rahul S.",
            achievement_type="placed",
            company_name="Infosys",
            role="Full Stack Developer",
            package_range="6-8 LPA",
            course=self.course,
            achieved_at=date.today(),
            is_published=True,
        )
        assert outcome.student_name == "Rahul S."
        assert str(outcome) == "Rahul S. - Placed at Infosys"

    def test_ordering_by_achieved_at_desc(self):
        StudentOutcome.objects.create(
            student_name="A", achievement_type="placed", course=self.course,
            achieved_at=date.today() - timedelta(days=10), is_published=True,
        )
        StudentOutcome.objects.create(
            student_name="B", achievement_type="promoted", course=self.course,
            achieved_at=date.today(), is_published=True,
        )
        outcomes = StudentOutcome.objects.all()
        assert outcomes[0].student_name == "B"
        assert outcomes[1].student_name == "A"


class TestOutcomesAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="instructor@test.com", password="testpass123", role="instructor"
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="Python Full Stack",
            description="Learn Python", duration="12 weeks", price=24999, is_published=True,
        )
        self.published = StudentOutcome.objects.create(
            student_name="Rahul S.", achievement_type="placed",
            company_name="Infosys", role="Full Stack Developer",
            package_range="6-8 LPA", course=self.course,
            achieved_at=date.today(), is_published=True,
        )
        self.unpublished = StudentOutcome.objects.create(
            student_name="Hidden", achievement_type="placed",
            company_name="Secret", course=self.course,
            achieved_at=date.today(), is_published=False,
        )

    def test_list_outcomes_returns_only_published(self):
        response = self.client.get("/api/v1/outcomes/")
        assert response.status_code == 200
        assert response.data["status"] == "success"
        results = response.data["data"]["results"]
        assert len(results) == 1
        assert results[0]["student_name"] == "Rahul S."

    def test_list_outcomes_includes_course_info(self):
        response = self.client.get("/api/v1/outcomes/")
        result = response.data["data"]["results"][0]
        assert result["course"]["name"] == "Python Full Stack"
        assert result["course"]["slug"] == "python-full-stack"

    def test_filter_by_course_slug(self):
        other_course = Course.objects.create(
            instructor=self.instructor, name="MERN Stack",
            description="Learn MERN", duration="10 weeks", price=22999, is_published=True,
        )
        StudentOutcome.objects.create(
            student_name="Other", achievement_type="placed",
            company_name="TCS", course=other_course,
            achieved_at=date.today(), is_published=True,
        )
        response = self.client.get("/api/v1/outcomes/", {"course": "python-full-stack"})
        results = response.data["data"]["results"]
        assert len(results) == 1
        assert results[0]["student_name"] == "Rahul S."

    def test_outcomes_no_auth_required(self):
        """Outcomes endpoint is public — no authentication needed."""
        response = self.client.get("/api/v1/outcomes/")
        assert response.status_code == 200
