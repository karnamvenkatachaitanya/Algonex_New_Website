from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from courses.models import Course, Module, Topic, Enrollment, CourseReview
from courses.services import submit_review
from courses.exceptions import NotEnrolled, AlreadyReviewed

User = get_user_model()


class TestSubmitReview(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            email="inst@test.com", password="pass123", role="instructor"
        )
        self.student = User.objects.create_user(
            email="student@test.com", password="pass123", role="student"
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="Test Course",
            description="D", duration="5 days", price="500.00", is_published=True,
        )

    def test_enrolled_student_can_review(self):
        Enrollment.objects.create(student=self.student, course=self.course, status="active")
        review = submit_review(student=self.student, course=self.course, rating=5, text="Great!")
        self.assertEqual(review.rating, 5)

    def test_not_enrolled_raises(self):
        with self.assertRaises(NotEnrolled):
            submit_review(student=self.student, course=self.course, rating=4)

    def test_duplicate_review_raises(self):
        Enrollment.objects.create(student=self.student, course=self.course, status="active")
        submit_review(student=self.student, course=self.course, rating=5)
        with self.assertRaises(AlreadyReviewed):
            submit_review(student=self.student, course=self.course, rating=3)


class TestReviewAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="inst@test.com", password="pass123", role="instructor"
        )
        self.student = User.objects.create_user(
            email="student@test.com", password="pass123", role="student"
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="Test Course", slug="test-course",
            description="D", duration="5 days", price="500.00", is_published=True,
        )
        Enrollment.objects.create(student=self.student, course=self.course, status="active")

    def login_as(self, user):
        response = self.client.post("/api/v1/auth/login/", {
            "email": user.email, "password": "pass123",
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_submit_review_via_api(self):
        self.login_as(self.student)
        response = self.client.post(
            "/api/v1/courses/test-course/reviews/",
            {"rating": 5, "text": "Excellent course!"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["data"]["rating"], 5)

    def test_list_reviews(self):
        CourseReview.objects.create(
            student=self.student, course=self.course, rating=4, text="Good"
        )
        response = self.client.get("/api/v1/courses/test-course/reviews/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["data"]), 1)

    def test_average_rating_in_course_detail(self):
        CourseReview.objects.create(
            student=self.student, course=self.course, rating=4, text="Good"
        )
        response = self.client.get("/api/v1/courses/test-course/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["average_rating"], 4.0)
        self.assertEqual(response.data["data"]["review_count"], 1)
