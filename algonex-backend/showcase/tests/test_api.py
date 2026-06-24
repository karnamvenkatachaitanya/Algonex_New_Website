from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from courses.models import Course, Tag, StudentOutcome
from showcase.models import StudentProject


class TestAlumniAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="inst@test.com", password="testpass123", role="instructor"
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="Python Full Stack",
            description="Learn Python", duration="12 weeks", price=24999, is_published=True,
        )
        self.published = StudentOutcome.objects.create(
            student_name="Priya M.", course=self.course, batch_year=2025,
            company_name="TCS", role="Backend Developer",
            linkedin_url="https://linkedin.com/in/priya",
            short_quote="Changed my career", package_range="6-8 LPA",
            achievement_type="placed",
            is_featured=True, is_published=True,
        )
        self.unpublished = StudentOutcome.objects.create(
            student_name="Hidden", course=self.course, batch_year=2025,
            company_name="Secret", role="Dev",
            achievement_type="placed",
            is_published=False,
        )

    def test_list_alumni_returns_only_published(self):
        response = self.client.get("/api/v1/alumni/")
        assert response.status_code == 200
        results = response.data["data"]["results"]
        assert len(results) == 1
        assert results[0]["name"] == "Priya M."

    def test_list_alumni_includes_course_info(self):
        response = self.client.get("/api/v1/alumni/")
        result = response.data["data"]["results"][0]
        assert result["course"]["name"] == "Python Full Stack"

    def test_filter_by_course(self):
        response = self.client.get("/api/v1/alumni/", {"course": "python-full-stack"})
        results = response.data["data"]["results"]
        assert len(results) == 1

    def test_filter_by_batch_year(self):
        response = self.client.get("/api/v1/alumni/", {"batch_year": 2025})
        results = response.data["data"]["results"]
        assert len(results) == 1

    def test_search_by_name(self):
        response = self.client.get("/api/v1/alumni/", {"search": "Priya"})
        results = response.data["data"]["results"]
        assert len(results) == 1

    def test_search_by_company(self):
        response = self.client.get("/api/v1/alumni/", {"search": "TCS"})
        results = response.data["data"]["results"]
        assert len(results) == 1

    def test_featured_endpoint(self):
        response = self.client.get("/api/v1/alumni/featured/")
        assert response.status_code == 200
        data = response.data["data"]
        assert len(data) == 1
        assert data[0]["name"] == "Priya M."

    def test_alumni_no_auth_required(self):
        response = self.client.get("/api/v1/alumni/")
        assert response.status_code == 200


class TestStudentProjectAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="inst@test.com", password="testpass123", role="instructor"
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="MERN Stack",
            description="Learn MERN", duration="10 weeks", price=22999, is_published=True,
        )
        self.skill = Tag.objects.create(name="React")
        self.published = StudentProject.objects.create(
            title="E-commerce App", description="A full-stack e-commerce platform",
            thumbnail="projects/thumbnails/ecom.jpg", student_name="Kiran V.",
            course=self.course, batch_year=2025,
            demo_url="https://ecom-demo.example.com",
            github_url="https://github.com/kiran/ecom",
            is_featured=True, is_published=True,
        )
        self.published.tech_tags.add(self.skill)
        self.unpublished = StudentProject.objects.create(
            title="Hidden", description="Secret project",
            thumbnail="projects/thumbnails/hidden.jpg", student_name="Nobody",
            course=self.course, batch_year=2025, is_published=False,
        )

    def test_list_projects_returns_only_published(self):
        response = self.client.get("/api/v1/projects/")
        assert response.status_code == 200
        results = response.data["data"]["results"]
        assert len(results) == 1
        assert results[0]["title"] == "E-commerce App"

    def test_project_detail(self):
        response = self.client.get(f"/api/v1/projects/{self.published.slug}/")
        assert response.status_code == 200
        data = response.data["data"]
        assert data["title"] == "E-commerce App"
        assert data["demo_url"] == "https://ecom-demo.example.com"
        assert data["github_url"] == "https://github.com/kiran/ecom"

    def test_project_includes_tech_tags(self):
        response = self.client.get(f"/api/v1/projects/{self.published.slug}/")
        data = response.data["data"]
        assert "React" in [t["name"] for t in data["tech_tags"]]

    def test_filter_by_course(self):
        response = self.client.get("/api/v1/projects/", {"course": "mern-stack"})
        results = response.data["data"]["results"]
        assert len(results) == 1

    def test_featured_endpoint(self):
        response = self.client.get("/api/v1/projects/featured/")
        assert response.status_code == 200
        data = response.data["data"]
        assert len(data) == 1

    def test_projects_no_auth_required(self):
        response = self.client.get("/api/v1/projects/")
        assert response.status_code == 200
