from django.conf import settings
from django.core.mail import send_mail
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import ContactFormSerializer


class ContactFormView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactFormSerializer(data=request.data)
        if serializer.is_valid():
            contact = serializer.save()
            self._notify_admin(contact)
            return Response(
                {"status": "success", "data": {"message": "Form submitted successfully."}},
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {
                "status": "error",
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid input.",
                    "details": serializer.errors,
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def _notify_admin(self, contact):
        """Send email notification to admin about new contact form submission."""
        try:
            send_mail(
                subject=f"[Algonex Contact] {contact.subject or 'New message'} — from {contact.full_name}",
                message=(
                    f"New contact form submission:\n\n"
                    f"Name: {contact.full_name}\n"
                    f"Email: {contact.email}\n"
                    f"Phone: {contact.phone or 'Not provided'}\n"
                    f"Subject: {contact.subject or 'Not provided'}\n\n"
                    f"Message:\n{contact.message}\n\n"
                    f"---\n"
                    f"View in admin: /admin/contactform/contactform/{contact.id}/change/"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, "DEFAULT_FROM_EMAIL") else "noreply@algonex.in",
                recipient_list=self._get_admin_emails(),
                fail_silently=True,
            )
        except Exception:
            pass  # Don't fail the API response if email fails

    def _get_admin_emails(self):
        """Get admin email addresses. Falls back to superusers if ADMINS not set."""
        if hasattr(settings, "ADMINS") and settings.ADMINS:
            return [email for _, email in settings.ADMINS]
        # Fallback: email all superusers
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return list(User.objects.filter(is_superuser=True).values_list("email", flat=True))
