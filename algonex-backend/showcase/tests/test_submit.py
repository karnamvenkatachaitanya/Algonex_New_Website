from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from courses.models import Course
from common.models import PlatformSettings
from showcase.models import StudentProject


class TestStudentProjectSubmission(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="inst@test.com", password="testpass123", role="instructor"
        )
        self.student = User.objects.create_user(
            email="student@test.com", password="testpass123",
            role="student", first_name="Sai", last_name="Kumar",
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="Python Full Stack",
            description="Learn Python", duration="12 weeks", price=24999, is_published=True,
        )

    def test_authenticated_student_can_submit(self):
        self.client.force_authenticate(self.student)
        response = self.client.post("/api/v1/projects/", {
            "title": "My Cool Project",
            "description": "A project I built during the course.",
            "course_slug": "python-full-stack",
        }, format="json")
        assert response.status_code == 201
        assert response.data["status"] == "success"
        assert StudentProject.objects.count() == 1
        project = StudentProject.objects.first()
        assert project.student_name == "Sai Kumar"
        assert project.course == self.course

    def test_unauthenticated_cannot_submit(self):
        response = self.client.post("/api/v1/projects/", {
            "title": "My Project",
            "description": "Test",
            "course_slug": "python-full-stack",
        }, format="json")
        assert response.status_code == 401

    def test_invalid_course_slug_rejected(self):
        self.client.force_authenticate(self.student)
        response = self.client.post("/api/v1/projects/", {
            "title": "My Project",
            "description": "Test",
            "course_slug": "nonexistent-course",
        }, format="json")
        assert response.status_code == 400

    def test_auto_publish_when_setting_enabled(self):
        settings = PlatformSettings.load()
        settings.auto_publish_student_projects = True
        settings.save()

        self.client.force_authenticate(self.student)
        self.client.post("/api/v1/projects/", {
            "title": "Auto Published",
            "description": "Should be published immediately.",
            "course_slug": "python-full-stack",
        }, format="json")
        project = StudentProject.objects.first()
        assert project.is_published is True

    def test_not_published_when_setting_disabled(self):
        settings = PlatformSettings.load()
        settings.auto_publish_student_projects = False
        settings.save()

        self.client.force_authenticate(self.student)
        response = self.client.post("/api/v1/projects/", {
            "title": "Needs Review",
            "description": "Should not be published yet.",
            "course_slug": "python-full-stack",
        }, format="json")
        project = StudentProject.objects.first()
        assert project.is_published is False
        assert "review" in response.data["data"]["message"].lower()

    def test_tech_tags_created(self):
        self.client.force_authenticate(self.student)
        self.client.post("/api/v1/projects/", {
            "title": "Tagged Project",
            "description": "Has tech tags.",
            "course_slug": "python-full-stack",
            "tech_tag_names": ["Python", "Django", "React"],
        }, format="json")
        project = StudentProject.objects.first()
        assert project.tech_tags.count() == 3

    def test_slug_auto_generated(self):
        self.client.force_authenticate(self.student)
        self.client.post("/api/v1/projects/", {
            "title": "My Amazing E-Commerce App",
            "description": "Test",
            "course_slug": "python-full-stack",
        }, format="json")
        project = StudentProject.objects.first()
        assert project.slug == "my-amazing-e-commerce-app"
