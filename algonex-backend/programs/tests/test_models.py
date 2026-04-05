from datetime import date, timedelta
from django.test import TestCase
from programs.models import Program


def _create_program(**kwargs):
    defaults = {
        "title": "Test Fellowship",
        "description": "A test program",
        "program_type": "fellowship",
        "duration": "3 months",
        "location": "Hyderabad",
        "eligibility_criteria": "B.Tech students",
        "application_deadline": date.today() + timedelta(days=30),
        "start_date": date.today() + timedelta(days=60),
        "end_date": date.today() + timedelta(days=150),
        "capacity": 20,
        "is_published": True,
    }
    defaults.update(kwargs)
    return Program.objects.create(**defaults)


class TestProgramModel(TestCase):
    def test_str_representation(self):
        program = _create_program(title="AI Fellowship", program_type="fellowship")
        self.assertEqual(str(program), "AI Fellowship (Fellowship)")

    def test_slug_auto_generated(self):
        program = _create_program(title="ML Internship")
        self.assertEqual(program.slug, "ml-internship")

    def test_is_accepting_future_deadline(self):
        program = _create_program(application_deadline=date.today() + timedelta(days=10))
        self.assertTrue(program.is_accepting)

    def test_is_accepting_past_deadline(self):
        program = _create_program(application_deadline=date.today() - timedelta(days=1))
        self.assertFalse(program.is_accepting)

    def test_is_accepting_today_deadline(self):
        program = _create_program(application_deadline=date.today())
        self.assertTrue(program.is_accepting)

    def test_spots_left_no_registrations(self):
        program = _create_program(capacity=20)
        self.assertEqual(program.spots_left, 20)

    def test_registration_count_zero(self):
        program = _create_program()
        self.assertEqual(program.registration_count, 0)

    def test_ordering(self):
        p1 = _create_program(title="P1", is_featured=False, application_deadline=date.today() + timedelta(days=5))
        p2 = _create_program(title="P2", is_featured=True, application_deadline=date.today() + timedelta(days=10))
        programs = list(Program.objects.all())
        self.assertEqual(programs[0], p2)  # featured first
