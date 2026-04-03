from django.test import TestCase, RequestFactory
from common.exception_handler import custom_exception_handler
from rest_framework.exceptions import NotFound, ValidationError


class TestCustomExceptionHandler(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.request = self.factory.get("/")

    def test_not_found_returns_error_format(self):
        exc = NotFound("Course not found.")
        response = custom_exception_handler(exc, {"request": self.request})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["status"], "error")
        self.assertEqual(response.data["error"]["code"], "NOT_FOUND")
        self.assertEqual(response.data["error"]["message"], "Course not found.")

    def test_validation_error_returns_details(self):
        exc = ValidationError({"email": ["Enter a valid email."]})
        response = custom_exception_handler(exc, {"request": self.request})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["status"], "error")
        self.assertEqual(response.data["error"]["code"], "VALIDATION_ERROR")
        self.assertIn("email", response.data["error"]["details"])

    def test_non_drf_exception_returns_none(self):
        response = custom_exception_handler(Exception("oops"), {"request": self.request})
        self.assertIsNone(response)
