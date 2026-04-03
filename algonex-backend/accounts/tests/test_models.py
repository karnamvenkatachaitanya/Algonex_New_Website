from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class TestUserModel(TestCase):
    def test_create_user_with_email(self):
        user = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            first_name="Test",
            last_name="Student",
        )
        self.assertEqual(user.email, "student@test.com")
        self.assertEqual(user.role, "student")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_create_user_auto_generates_username(self):
        user = User.objects.create_user(
            email="auto@test.com",
            password="testpass123",
        )
        self.assertEqual(user.username, "auto")

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            email="admin@test.com",
            password="adminpass123",
            first_name="Admin",
            last_name="User",
        )
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.role, "admin")

    def test_default_role_is_student(self):
        user = User.objects.create_user(
            email="new@test.com",
            password="testpass123",
        )
        self.assertEqual(user.role, "student")

    def test_user_str(self):
        user = User.objects.create_user(
            email="display@test.com",
            password="testpass123",
            first_name="John",
            last_name="Doe",
        )
        self.assertEqual(str(user), "John Doe (display@test.com)")

    def test_role_choices(self):
        user = User.objects.create_user(
            email="instructor@test.com",
            password="testpass123",
            role="instructor",
        )
        self.assertEqual(user.role, "instructor")
