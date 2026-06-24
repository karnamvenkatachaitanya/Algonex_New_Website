from django.test import TestCase
from django.contrib.auth import get_user_model
from courses.models import Course, Enrollment
from courses.services import create_course, update_course, enroll_student, drop_enrollment
from courses.exceptions import CourseNotPublished, AlreadyEnrolled, CourseNotReady

User = get_user_model()


class TestCreateCourse(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            email="instructor@test.com", password="pass123", role="instructor"
        )

    def test_creates_draft_course(self):
        course = create_course(
            instructor=self.instructor,
            name="Test Course",
            description="Desc",
            duration="10 days",
            price="999.00",
        )
        self.assertEqual(course.name, "Test Course")
        self.assertFalse(course.is_published)
        self.assertEqual(course.instructor, self.instructor)
        self.assertTrue(course.slug)  # auto-generated

    def test_is_published_forced_false(self):
        course = create_course(
            instructor=self.instructor,
            name="Published?",
            description="Test",
            duration="5 days",
            price="500.00",
            is_published=True,  # should be overridden
        )
        self.assertFalse(course.is_published)


class TestUpdateCourse(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            email="instructor@test.com", password="pass123", role="instructor"
        )
        self.course = create_course(
            instructor=self.instructor,
            name="Original",
            description="Desc",
            duration="10 days",
            price="999.00",
        )

    def test_updates_fields(self):
        updated = update_course(course=self.course, name="Updated Name")
        self.assertEqual(updated.name, "Updated Name")

    def test_publish_without_modules_raises(self):
        with self.assertRaises(CourseNotReady):
            update_course(course=self.course, is_published=True)

    def test_publish_with_modules_and_topics_succeeds(self):
        self.course.curriculum = [{"title": "M1", "topics": [{"title": "T1"}]}]
        self.course.save()
        updated = update_course(course=self.course, is_published=True)
        self.assertTrue(updated.is_published)


class TestEnrollStudent(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            email="inst@test.com", password="pass123", role="instructor"
        )
        self.student = User.objects.create_user(
            email="student@test.com", password="pass123", role="student"
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="Published Course",
            description="D", duration="5 days", price="500.00", is_published=True,
        )

    def test_enroll_in_published_course(self):
        enrollment = enroll_student(student=self.student, course=self.course)
        self.assertEqual(enrollment.status, "active")
        self.assertEqual(enrollment.student, self.student)

    def test_enroll_in_unpublished_raises(self):
        self.course.is_published = False
        self.course.save()
        with self.assertRaises(CourseNotPublished):
            enroll_student(student=self.student, course=self.course)

    def test_duplicate_enrollment_raises(self):
        enroll_student(student=self.student, course=self.course)
        with self.assertRaises(AlreadyEnrolled):
            enroll_student(student=self.student, course=self.course)

    def test_re_enroll_after_drop_succeeds(self):
        enrollment = enroll_student(student=self.student, course=self.course)
        drop_enrollment(enrollment=enrollment)
        new_enrollment = enroll_student(student=self.student, course=self.course)
        self.assertEqual(new_enrollment.status, "active")


class TestDropEnrollment(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            email="inst@test.com", password="pass123", role="instructor"
        )
        self.student = User.objects.create_user(
            email="student@test.com", password="pass123", role="student"
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="Course",
            description="D", duration="5 days", price="500.00", is_published=True,
        )

    def test_drop_sets_status(self):
        enrollment = enroll_student(student=self.student, course=self.course)
        drop_enrollment(enrollment=enrollment)
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, "dropped")
