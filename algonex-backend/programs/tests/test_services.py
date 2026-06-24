from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from programs.models import Program
from programs.services import create_program, update_program

User = get_user_model()


class TestCreateProgram(TestCase):
    def test_creates_program(self):
        program = create_program(
            name="AI Fellowship",
            description="Learn AI",
            course_type="fellowship",
            duration="3 months",
            location="Remote",
            eligibility_criteria="B.Tech students",
            application_deadline=date.today() + timedelta(days=30),
            start_date=date.today() + timedelta(days=60),
            end_date=date.today() + timedelta(days=150),
            capacity=20,
        )
        self.assertEqual(program.title, "AI Fellowship")
        self.assertFalse(program.is_published)

    def test_is_published_forced_false(self):
        program = create_program(
            name="Fellowship",
            description="Test",
            course_type="fellowship",
            duration="3 months",
            location="Online",
            eligibility_criteria="Open",
            application_deadline=date.today() + timedelta(days=30),
            start_date=date.today() + timedelta(days=60),
            end_date=date.today() + timedelta(days=150),
            capacity=10,
            is_published=True,
        )
        self.assertFalse(program.is_published)


class TestUpdateProgram(TestCase):
    def setUp(self):
        self.program = Program.objects.create(
            name="Original",
            description="Test",
            course_type="internship",
            duration="6 weeks",
            price=0,
            location="Hyderabad",
            eligibility_criteria="Open",
            application_deadline=date.today() + timedelta(days=30),
            start_date=date.today() + timedelta(days=60),
            end_date=date.today() + timedelta(days=100),
            capacity=15,
        )

    def test_updates_fields(self):
        updated = update_program(program=self.program, name="Updated Title")
        self.assertEqual(updated.title, "Updated Title")

    def test_publish_program(self):
        updated = update_program(program=self.program, is_published=True)
        self.assertTrue(updated.is_published)
