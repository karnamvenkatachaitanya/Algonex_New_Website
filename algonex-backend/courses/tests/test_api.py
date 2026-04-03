from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from courses.models import Course, Module, Topic, Skill, Enrollment

User = get_user_model()


class CourseAPITestMixin:
    """Shared setup for course API tests."""

    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="instructor@test.com", password="pass123",
            first_name="Inst", last_name="Ructor", role="instructor",
        )
        self.student = User.objects.create_user(
            email="student@test.com", password="pass123",
            first_name="Stu", last_name="Dent", role="student",
        )
        self.admin = User.objects.create_user(
            email="admin@test.com", password="pass123",
            first_name="Ad", last_name="Min", role="admin",
        )
        # Create a published course with modules and topics
        self.course = Course.objects.create(
            instructor=self.instructor, name="Test Course",
            description="Test desc", duration="10 days",
            price="999.00", is_published=True, slug="test-course",
        )
        skill = Skill.objects.create(name="Python")
        self.course.skills.add(skill)
        module = Module.objects.create(course=self.course, title="Module 1", order=1)
        Topic.objects.create(module=module, title="Topic 1", order=1)

    def login_as(self, user):
        response = self.client.post("/api/v1/auth/login/", {
            "email": user.email, "password": "pass123",
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")


class TestCourseListAPI(CourseAPITestMixin, TestCase):
    def test_list_published_courses(self):
        response = self.client.get("/api/v1/courses/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(len(response.data["data"]["results"]), 1)

    def test_unpublished_courses_not_listed(self):
        Course.objects.create(
            instructor=self.instructor, name="Draft", description="D",
            duration="5 days", price="500.00", is_published=False,
        )
        response = self.client.get("/api/v1/courses/")
        self.assertEqual(len(response.data["data"]["results"]), 1)

    def test_filter_by_level(self):
        response = self.client.get("/api/v1/courses/?level=beginner")
        self.assertEqual(response.status_code, 200)


class TestCourseDetailAPI(CourseAPITestMixin, TestCase):
    def test_get_course_detail(self):
        response = self.client.get("/api/v1/courses/test-course/")
        self.assertEqual(response.status_code, 200)
        data = response.data["data"]
        self.assertEqual(data["name"], "Test Course")
        self.assertIn("modules", data)
        self.assertIn("skills", data)

    def test_nonexistent_course_returns_404(self):
        response = self.client.get("/api/v1/courses/nonexistent/")
        self.assertEqual(response.status_code, 404)


class TestCourseCreateAPI(CourseAPITestMixin, TestCase):
    def test_instructor_can_create_course(self):
        self.login_as(self.instructor)
        response = self.client.post("/api/v1/courses/", {
            "name": "New Course",
            "description": "New course description",
            "duration": "5 days",
            "price": "500.00",
        }, format="json")
        self.assertEqual(response.status_code, 201)

    def test_student_cannot_create_course(self):
        self.login_as(self.student)
        response = self.client.post("/api/v1/courses/", {
            "name": "Student Course",
            "description": "Should fail",
            "duration": "5 days",
            "price": "500.00",
        }, format="json")
        self.assertEqual(response.status_code, 403)


class TestEnrollmentAPI(CourseAPITestMixin, TestCase):
    def test_student_can_enroll(self):
        self.login_as(self.student)
        response = self.client.post("/api/v1/courses/test-course/enroll/")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            Enrollment.objects.filter(student=self.student, course=self.course).exists()
        )

    def test_duplicate_enrollment_fails(self):
        self.login_as(self.student)
        self.client.post("/api/v1/courses/test-course/enroll/")
        response = self.client.post("/api/v1/courses/test-course/enroll/")
        self.assertEqual(response.status_code, 409)

    def test_list_my_enrollments(self):
        self.login_as(self.student)
        self.client.post("/api/v1/courses/test-course/enroll/")
        response = self.client.get("/api/v1/enrollments/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["data"]["results"]), 1)

    def test_drop_enrollment(self):
        self.login_as(self.student)
        self.client.post("/api/v1/courses/test-course/enroll/")
        enrollment = Enrollment.objects.get(student=self.student, course=self.course)
        response = self.client.post(f"/api/v1/enrollments/{enrollment.id}/drop/")
        self.assertEqual(response.status_code, 200)
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, "dropped")

    def test_unauthenticated_cannot_enroll(self):
        response = self.client.post("/api/v1/courses/test-course/enroll/")
        self.assertIn(response.status_code, [401, 403])


class TestModuleAPI(CourseAPITestMixin, TestCase):
    def test_instructor_can_add_module(self):
        self.login_as(self.instructor)
        response = self.client.post(
            "/api/v1/courses/test-course/modules/",
            {"title": "New Module", "description": "Desc", "order": 2},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_student_cannot_add_module(self):
        self.login_as(self.student)
        response = self.client.post(
            "/api/v1/courses/test-course/modules/",
            {"title": "Fail Module", "description": "Desc", "order": 2},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
