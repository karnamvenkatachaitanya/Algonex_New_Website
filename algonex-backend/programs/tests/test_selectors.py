from datetime import date, timedelta
from django.test import TestCase
from programs.models import Program
from programs.selectors import get_published_programs, get_program_detail


def _create_program(**kwargs):
    defaults = {
        "title": "Test Program",
        "description": "Desc",
        "program_type": "fellowship",
        "duration": "3 months",
        "location": "Hyderabad",
        "eligibility_criteria": "Open",
        "application_deadline": date.today() + timedelta(days=30),
        "start_date": date.today() + timedelta(days=60),
        "end_date": date.today() + timedelta(days=150),
        "capacity": 20,
        "is_published": True,
    }
    defaults.update(kwargs)
    return Program.objects.create(**defaults)


class TestGetPublishedPrograms(TestCase):
    def test_returns_only_published(self):
        _create_program(title="Published", is_published=True)
        _create_program(title="Draft", is_published=False)
        programs = get_published_programs()
        self.assertEqual(programs.count(), 1)
        self.assertEqual(programs.first().title, "Published")

    def test_has_registration_count_annotation(self):
        _create_program(title="P1")
        programs = get_published_programs()
        self.assertTrue(hasattr(programs.first(), "registration_count"))


class TestGetProgramDetail(TestCase):
    def test_returns_published_program(self):
        program = _create_program(title="Detail Test")
        result = get_program_detail(slug=program.slug)
        self.assertEqual(result.title, "Detail Test")

    def test_returns_none_for_unpublished(self):
        program = _create_program(title="Draft", is_published=False)
        result = get_program_detail(slug=program.slug)
        self.assertIsNone(result)

    def test_returns_none_for_nonexistent(self):
        result = get_program_detail(slug="does-not-exist")
        self.assertIsNone(result)
