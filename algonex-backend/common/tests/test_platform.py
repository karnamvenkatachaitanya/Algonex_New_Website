from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from courses.models import Course
from common.models import PlatformSettings, CarouselSlide


class TestPlatformSettingsModel(TestCase):
    def test_load_creates_default(self):
        assert PlatformSettings.objects.count() == 0
        settings = PlatformSettings.load()
        assert PlatformSettings.objects.count() == 1
        assert settings.maintenance_mode is False
        assert settings.auto_publish_student_projects is True

    def test_singleton_enforced(self):
        PlatformSettings.load()
        PlatformSettings(maintenance_mode=True).save()
        assert PlatformSettings.objects.count() == 1
        assert PlatformSettings.objects.first().maintenance_mode is True


class TestPlatformSettingsAPI(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_settings_public(self):
        PlatformSettings.load()
        response = self.client.get("/api/v1/settings/")
        assert response.status_code == 200
        data = response.data["data"]
        assert data["maintenance_mode"] is False
        assert data["course_enrollment_enabled"] is True

    def test_settings_reflects_changes(self):
        settings = PlatformSettings.load()
        settings.maintenance_mode = True
        settings.save()
        response = self.client.get("/api/v1/settings/")
        assert response.data["data"]["maintenance_mode"] is True


class TestCarouselAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            email="inst@test.com", password="testpass123", role="instructor"
        )
        self.course = Course.objects.create(
            instructor=self.instructor, name="Python Full Stack",
            description="Learn Python", duration="12 weeks", price=24999, is_published=True,
        )

    def test_empty_carousel(self):
        response = self.client.get("/api/v1/carousel/")
        assert response.status_code == 200
        assert response.data["data"] == []

    def test_hero_slide(self):
        CarouselSlide.objects.create(slide_type="hero", order=1)
        response = self.client.get("/api/v1/carousel/")
        slides = response.data["data"]
        assert len(slides) == 1
        assert slides[0]["slide_type"] == "hero"
        assert slides[0]["item"] is None

    def test_course_slide_resolves_item(self):
        CarouselSlide.objects.create(slide_type="course", item_slug="python-full-stack", order=1)
        response = self.client.get("/api/v1/carousel/")
        slides = response.data["data"]
        assert len(slides) == 1
        assert slides[0]["item"]["name"] == "Python Full Stack"

    def test_ordering(self):
        CarouselSlide.objects.create(slide_type="hero", order=2)
        CarouselSlide.objects.create(slide_type="course", item_slug="python-full-stack", order=1)
        response = self.client.get("/api/v1/carousel/")
        slides = response.data["data"]
        assert slides[0]["slide_type"] == "course"
        assert slides[1]["slide_type"] == "hero"

    def test_inactive_slides_hidden(self):
        CarouselSlide.objects.create(slide_type="hero", order=1, is_active=False)
        response = self.client.get("/api/v1/carousel/")
        assert response.data["data"] == []

    def test_invalid_slug_skipped(self):
        CarouselSlide.objects.create(slide_type="course", item_slug="nonexistent", order=1)
        response = self.client.get("/api/v1/carousel/")
        assert response.data["data"] == []

    def test_no_auth_required(self):
        response = self.client.get("/api/v1/carousel/")
        assert response.status_code == 200

    def test_duplicate_item_rejected(self):
        """Same course can't appear in carousel twice."""
        CarouselSlide.objects.create(slide_type="course", item_slug="python-full-stack", order=1)
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            CarouselSlide.objects.create(slide_type="course", item_slug="python-full-stack", order=2)

    def test_duplicate_order_rejected(self):
        """Two slides can't have the same order."""
        CarouselSlide.objects.create(slide_type="hero", order=1)
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            CarouselSlide.objects.create(slide_type="course", item_slug="python-full-stack", order=1)
