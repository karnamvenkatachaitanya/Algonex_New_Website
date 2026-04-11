from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from careers.models import Job, Application
from careers.services import submit_application, transition_application, VALID_TRANSITIONS
from careers.exceptions import AlreadyApplied, JobNotActive, InvalidTransition

User = get_user_model()


def _create_job(**kwargs):
    defaults = {
        "title": "Test Developer",
        "department": "engineering",
        "job_type": "full_time",
        "location": "Hyderabad",
        "description": "Build things",
        "requirements": "Python, Django",
        "is_active": True,
    }
    defaults.update(kwargs)
    return Job.objects.create(**defaults)


def _dummy_resume():
    return SimpleUploadedFile("resume.pdf", b"fake pdf content", content_type="application/pdf")


class TestSubmitApplication(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="applicant@test.com", password="pass123")
        self.job = _create_job()

    def test_submit_application(self):
        app = submit_application(applicant=self.user, job=self.job, resume=_dummy_resume())
        self.assertEqual(app.status, "applied")
        self.assertEqual(app.applicant, self.user)

    def test_duplicate_application_raises(self):
        submit_application(applicant=self.user, job=self.job, resume=_dummy_resume())
        with self.assertRaises(AlreadyApplied):
            submit_application(applicant=self.user, job=self.job, resume=_dummy_resume())

    def test_inactive_job_raises(self):
        job = _create_job(title="Closed", is_active=False)
        with self.assertRaises(JobNotActive):
            submit_application(applicant=self.user, job=job, resume=_dummy_resume())

    def test_external_job_raises(self):
        from careers.exceptions import ExternalJob
        job = _create_job(
            title="External Dev",
            apply_mode="external",
            external_link="https://example.com/apply",
            company_name="TCS",
        )
        with self.assertRaises(ExternalJob):
            submit_application(applicant=self.user, job=job, resume=_dummy_resume())


class TestTransitionApplication(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="applicant@test.com", password="pass123")
        self.job = _create_job()
        self.app = submit_application(applicant=self.user, job=self.job, resume=_dummy_resume())

    def test_valid_transition_applied_to_reviewed(self):
        updated = transition_application(application=self.app, new_status="reviewed")
        self.assertEqual(updated.status, "reviewed")

    def test_valid_transition_reviewed_to_interview(self):
        self.app.status = "reviewed"
        self.app.save()
        updated = transition_application(application=self.app, new_status="interview")
        self.assertEqual(updated.status, "interview")

    def test_valid_transition_to_hired(self):
        self.app.status = "interview"
        self.app.save()
        updated = transition_application(application=self.app, new_status="hired")
        self.assertEqual(updated.status, "hired")

    def test_reject_from_any_stage(self):
        for stage in ["applied", "reviewed", "interview"]:
            self.app.status = stage
            self.app.save()
            updated = transition_application(application=self.app, new_status="rejected")
            self.assertEqual(updated.status, "rejected")
            # Reset for next iteration
            self.app.status = stage
            self.app.save()

    def test_invalid_transition_raises(self):
        with self.assertRaises(InvalidTransition):
            transition_application(application=self.app, new_status="hired")

    def test_terminal_state_raises(self):
        self.app.status = "hired"
        self.app.save()
        with self.assertRaises(InvalidTransition):
            transition_application(application=self.app, new_status="rejected")

    def test_admin_notes_saved(self):
        updated = transition_application(
            application=self.app, new_status="reviewed", admin_notes="Strong candidate"
        )
        self.assertEqual(updated.admin_notes, "Strong candidate")
