from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from events.models import Event, Registration
from events.services import register_for_event, cancel_registration
from events.exceptions import EventNotOpen, AlreadyRegistered

User = get_user_model()


def _create_upcoming_event(**kwargs):
    defaults = {
        "title": "Test Event",
        "description": "Test",
        "event_type": "workshop",
        "location": "Online",
        "start_date": timezone.now() + timedelta(days=7),
        "end_date": timezone.now() + timedelta(days=7, hours=4),
        "capacity": 2,
        "is_published": True,
    }
    defaults.update(kwargs)
    return Event.objects.create(**defaults)


class TestRegisterForEvent(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="u1@test.com", password="pass123")
        self.user2 = User.objects.create_user(email="u2@test.com", password="pass123")
        self.user3 = User.objects.create_user(email="u3@test.com", password="pass123")

    def test_register_confirmed_when_spots_available(self):
        event = _create_upcoming_event(capacity=10)
        reg = register_for_event(user=self.user1, event=event)
        self.assertEqual(reg.status, "confirmed")

    def test_register_waitlisted_when_full(self):
        event = _create_upcoming_event(capacity=1)
        register_for_event(user=self.user1, event=event)
        reg2 = register_for_event(user=self.user2, event=event)
        self.assertEqual(reg2.status, "waitlisted")

    def test_duplicate_registration_raises(self):
        event = _create_upcoming_event()
        register_for_event(user=self.user1, event=event)
        with self.assertRaises(AlreadyRegistered):
            register_for_event(user=self.user1, event=event)

    def test_past_event_raises(self):
        event = _create_upcoming_event(
            start_date=timezone.now() - timedelta(days=2),
            end_date=timezone.now() - timedelta(days=1),
        )
        with self.assertRaises(EventNotOpen):
            register_for_event(user=self.user1, event=event)

    def test_unpublished_event_raises(self):
        event = _create_upcoming_event(is_published=False)
        with self.assertRaises(EventNotOpen):
            register_for_event(user=self.user1, event=event)


class TestCancelRegistration(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="u1@test.com", password="pass123")
        self.user2 = User.objects.create_user(email="u2@test.com", password="pass123")

    def test_cancel_sets_status(self):
        event = _create_upcoming_event()
        reg = register_for_event(user=self.user1, event=event)
        cancel_registration(registration=reg)
        reg.refresh_from_db()
        self.assertEqual(reg.status, "cancelled")

    def test_cancel_promotes_waitlisted(self):
        event = _create_upcoming_event(capacity=1)
        reg1 = register_for_event(user=self.user1, event=event)
        reg2 = register_for_event(user=self.user2, event=event)
        self.assertEqual(reg2.status, "waitlisted")

        cancel_registration(registration=reg1)
        reg2.refresh_from_db()
        self.assertEqual(reg2.status, "confirmed")
